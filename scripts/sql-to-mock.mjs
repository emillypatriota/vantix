// Converte database/02_dados.sql em src/app/core/mock/mock-seed.json.
// O mock do front usa exatamente os mesmos dados do MySQL.
// Uso: node scripts/sql-to-mock.mjs   (rode de novo sempre que o 02_dados.sql mudar)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(join(root, 'database', '02_dados.sql'), 'utf8');

/** Lê os valores de uma tupla SQL a partir de text[i] === '('. */
function parseTuples(text) {
  const rows = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] !== '(') { i++; continue; }
    i++;
    const row = [];
    let token = '';
    let inStr = false;
    let wasStr = false;
    for (; i < text.length; i++) {
      const c = text[i];
      if (inStr) {
        if (c === '\\') { token += text[++i]; continue; }
        if (c === "'" && text[i + 1] === "'") { token += "'"; i++; continue; }
        if (c === "'") { inStr = false; continue; }
        token += c;
        continue;
      }
      if (c === "'") { inStr = true; wasStr = true; continue; }
      if (c === ',' || c === ')') {
        row.push(convert(token.trim(), wasStr));
        token = ''; wasStr = false;
        if (c === ')') { i++; break; }
        continue;
      }
      token += c;
    }
    rows.push(row);
  }
  return rows;
}

function convert(raw, wasStr) {
  if (wasStr) return raw;
  if (raw.toUpperCase() === 'NULL') return null;
  if (raw.toUpperCase() === 'TRUE') return 1;
  if (raw.toUpperCase() === 'FALSE') return 0;
  const n = Number(raw);
  return Number.isNaN(n) ? raw : n;
}

const tables = {};
const re = /INSERT INTO\s+(\w+)\s*\(([^)]*)\)\s*VALUES\s*([\s\S]*?);\s*$/gim;
let m;
while ((m = re.exec(sql))) {
  const [, table, colsRaw, values] = m;
  const cols = colsRaw.split(',').map(c => c.trim());
  const rows = parseTuples(values).map(r => Object.fromEntries(cols.map((c, idx) => [c, r[idx]])));
  (tables[table] ??= []).push(...rows);
}

// Simula o AUTO_INCREMENT das tabelas que têm id próprio.
const ids = { usuario_painel: 'id_usuario', categoria: 'id_categoria', produto: 'id_produto',
              cliente: 'id_cliente', pedido: 'id_pedido', item_pedido: 'id_item', pagamento: 'id_pagamento' };
for (const [table, idCol] of Object.entries(ids)) {
  (tables[table] ?? []).forEach((row, idx) => { row[idCol] ??= idx + 1; });
}

const out = join(root, 'src', 'app', 'core', 'mock', 'mock-seed.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(tables, null, 1));
console.log('mock-seed.json gerado:', Object.entries(tables).map(([t, r]) => `${t}=${r.length}`).join(', '));

package com.voltz.api.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Relatorios do painel do gerente (Frente 4).
 * Segue docs/API_CONTRATO.md: todos aceitam ?inicio=AAAA-MM-DD&fim=AAAA-MM-DD (inclusivo).
 * Usa so JDBC, entao NAO depende das entidades Pedido/Produto do Lucas.
 * O acesso so para gerente deve ser configurado no SecurityConfig do Lucas: /api/relatorios/** -> GERENTE.
 */
@RestController
@RequestMapping("/api/relatorios")
public class RelatorioController {

    private static final LocalDate INICIO_PADRAO = LocalDate.of(1900, 1, 1);
    private static final LocalDate FIM_PADRAO = LocalDate.of(9999, 12, 31);

    private final NamedParameterJdbcTemplate jdbc;

    public RelatorioController(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private MapSqlParameterSource periodo(LocalDate inicio, LocalDate fim) {
        return new MapSqlParameterSource()
                .addValue("inicio", inicio != null ? inicio : INICIO_PADRAO)
                .addValue("fim", fim != null ? fim : FIM_PADRAO);
    }

    @GetMapping("/resumo")
    public Map<String, Object> resumo(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        String sql = """
                SELECT
                  COALESCE(SUM(CASE WHEN status <> 'cancelado' THEN valor_total END), 0) AS faturamento,
                  COUNT(*) AS totalPedidos,
                  COALESCE(SUM(status = 'entregue'), 0) AS pedidosEntregues,
                  COALESCE(SUM(status = 'cancelado'), 0) AS pedidosCancelados,
                  COALESCE(ROUND(SUM(CASE WHEN status <> 'cancelado' THEN valor_total END)
                         / NULLIF(SUM(status <> 'cancelado'), 0), 2), 0) AS ticketMedio
                FROM pedido
                WHERE DATE(data_criacao) BETWEEN :inicio AND :fim
                """;
        return jdbc.queryForMap(sql, periodo(inicio, fim));
    }

    @GetMapping("/faturamento-diario")
    public List<Map<String, Object>> faturamentoDiario(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        String sql = """
                SELECT DATE_FORMAT(DATE(data_criacao), '%Y-%m-%d') AS dia,
                       COUNT(*) AS pedidos,
                       SUM(valor_total) AS faturamento
                FROM pedido
                WHERE status <> 'cancelado'
                  AND DATE(data_criacao) BETWEEN :inicio AND :fim
                GROUP BY DATE(data_criacao)
                ORDER BY DATE(data_criacao)
                """;
        return jdbc.queryForList(sql, periodo(inicio, fim));
    }

    @GetMapping("/pedidos-por-status")
    public List<Map<String, Object>> pedidosPorStatus(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        String sql = """
                SELECT status, COUNT(*) AS pedidos
                FROM pedido
                WHERE DATE(data_criacao) BETWEEN :inicio AND :fim
                GROUP BY status
                ORDER BY pedidos DESC
                """;
        return jdbc.queryForList(sql, periodo(inicio, fim));
    }

    @GetMapping("/mais-vendidos")
    public List<Map<String, Object>> maisVendidos(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim,
            @RequestParam(defaultValue = "5") int limite) {
        String sql = """
                SELECT p.id_produto AS idProduto,
                       p.nome AS nome,
                       c.nome AS categoria,
                       SUM(i.quantidade) AS unidadesVendidas,
                       SUM(i.subtotal) AS receita
                FROM item_pedido i
                JOIN pedido pe ON pe.id_pedido = i.id_pedido AND pe.status <> 'cancelado'
                JOIN produto p ON p.id_produto = i.id_produto
                JOIN categoria c ON c.id_categoria = p.id_categoria
                WHERE DATE(pe.data_criacao) BETWEEN :inicio AND :fim
                GROUP BY p.id_produto, p.nome, c.nome
                ORDER BY unidadesVendidas DESC, receita DESC
                LIMIT :limite
                """;
        return jdbc.queryForList(sql, periodo(inicio, fim).addValue("limite", Math.max(1, Math.min(limite, 50))));
    }

    @GetMapping("/formas-pagamento")
    public List<Map<String, Object>> formasPagamento(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        String sql = """
                SELECT pg.forma AS forma, COUNT(*) AS pedidos, SUM(pg.valor) AS valor
                FROM pagamento pg
                JOIN pedido pe ON pe.id_pedido = pg.id_pedido AND pe.status <> 'cancelado'
                WHERE DATE(pe.data_criacao) BETWEEN :inicio AND :fim
                GROUP BY pg.forma
                ORDER BY pedidos DESC
                """;
        return jdbc.queryForList(sql, periodo(inicio, fim));
    }

    @GetMapping("/pedidos-por-hora")
    public List<Map<String, Object>> pedidosPorHora(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim) {
        String sql = """
                SELECT HOUR(data_criacao) AS hora, COUNT(*) AS pedidos
                FROM pedido
                WHERE DATE(data_criacao) BETWEEN :inicio AND :fim
                GROUP BY HOUR(data_criacao)
                ORDER BY hora
                """;
        return jdbc.queryForList(sql, periodo(inicio, fim));
    }

    @GetMapping("/estoque-baixo")
    public List<Map<String, Object>> estoqueBaixo() {
        String sql = """
                SELECT id_produto AS idProduto, nome, estoque
                FROM vw_estoque_baixo
                ORDER BY estoque, nome
                """;
        return jdbc.getJdbcTemplate().queryForList(sql);
    }
}

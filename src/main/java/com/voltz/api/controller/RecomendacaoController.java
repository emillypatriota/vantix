package com.voltz.api.controller;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * "Quem comprou tambem levou" (Frente 4). Rota publica.
 * GET /api/recomendacoes?produtos=1,7&limite=4
 * Ordena por: vezes comprados juntos (vw_comprados_juntos) + 1 ponto por estar em produto_relacionado.
 * Remove os produtos informados, os indisponiveis e os sem estoque.
 * Libere /api/recomendacoes no SecurityConfig do Lucas (permitAll).
 */
@RestController
@RequestMapping("/api/recomendacoes")
public class RecomendacaoController {

    private final NamedParameterJdbcTemplate jdbc;

    public RecomendacaoController(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping
    public List<Map<String, Object>> recomendar(
            @RequestParam List<Long> produtos,
            @RequestParam(defaultValue = "4") int limite) {
        if (produtos == null || produtos.isEmpty()) {
            return List.of();
        }
        String sql = """
                SELECT p.id_produto AS id,
                       p.id_categoria AS idCategoria,
                       c.nome AS categoria,
                       p.nome AS nome,
                       p.descricao AS descricao,
                       p.marca AS marca,
                       p.preco AS preco,
                       p.preco_antigo AS precoAntigo,
                       p.estoque AS estoque,
                       p.imagem_url AS imagemUrl,
                       p.destaque AS destaque,
                       p.disponivel AS disponivel
                FROM (
                    SELECT id_recomendado AS id, SUM(vezes) AS pontos
                    FROM vw_comprados_juntos
                    WHERE id_produto IN (:ids)
                    GROUP BY id_recomendado
                    UNION ALL
                    SELECT id_produto_relacionado AS id, 1 AS pontos
                    FROM produto_relacionado
                    WHERE id_produto IN (:ids)
                ) r
                JOIN produto p ON p.id_produto = r.id
                JOIN categoria c ON c.id_categoria = p.id_categoria
                WHERE p.id_produto NOT IN (:ids)
                  AND p.disponivel = TRUE
                  AND p.estoque > 0
                GROUP BY p.id_produto, p.id_categoria, c.nome, p.nome, p.descricao, p.marca,
                         p.preco, p.preco_antigo, p.estoque, p.imagem_url, p.destaque, p.disponivel
                ORDER BY SUM(r.pontos) DESC, p.destaque DESC, p.nome
                LIMIT :limite
                """;
        return jdbc.queryForList(sql, new MapSqlParameterSource()
                .addValue("ids", produtos)
                .addValue("limite", Math.max(1, Math.min(limite, 20))));
    }
}

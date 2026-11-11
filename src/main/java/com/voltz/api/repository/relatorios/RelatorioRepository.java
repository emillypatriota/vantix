package com.voltz.api.repository.relatorios;

import com.voltz.api.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RelatorioRepository extends JpaRepository<Pedido, Long> {

    @Query(value = "SELECT SUM(valor_total) as valorTotal, COUNT(id_pedido) as quantidadePedidos " +
                   "FROM pedido WHERE data_criacao >= :dataInicio AND status <> 'cancelado'", nativeQuery = true)
    List<Object[]> consultarFaturamento(@Param("dataInicio") LocalDateTime dataInicio);

    @Query(value = "SELECT status, COUNT(id_pedido) as quantidade " +
                   "FROM pedido WHERE data_criacao >= :dataInicio GROUP BY status", nativeQuery = true)
    List<Object[]> consultarPedidosPorStatus(@Param("dataInicio") LocalDateTime dataInicio);

    @Query(value = "SELECT p.nome as nomeProduto, SUM(i.quantidade) as quantidadeVendida, SUM(i.subtotal) as receita " +
                   "FROM item_pedido i " +
                   "JOIN pedido pe ON pe.id_pedido = i.id_pedido " +
                   "JOIN produto p ON p.id_produto = i.id_produto " +
                   "WHERE pe.data_criacao >= :dataInicio AND pe.status <> 'cancelado' " +
                   "GROUP BY p.id_produto, p.nome ORDER BY quantidadeVendida DESC LIMIT 5", nativeQuery = true)
    List<Object[]> consultarItensMaisVendidos(@Param("dataInicio") LocalDateTime dataInicio);

    @Query(value = "SELECT pg.forma as formaPagamento, COUNT(pg.id_pagamento) as quantidade, SUM(pg.valor) as valorTotal " +
                   "FROM pagamento pg " +
                   "JOIN pedido pe ON pe.id_pedido = pg.id_pedido " +
                   "WHERE pe.data_criacao >= :dataInicio AND pe.status <> 'cancelado' " +
                   "GROUP BY pg.forma", nativeQuery = true)
    List<Object[]> consultarFormasPagamento(@Param("dataInicio") LocalDateTime dataInicio);

    @Query(value = "SELECT HOUR(data_criacao) as hora, COUNT(id_pedido) as quantidadePedidos " +
                   "FROM pedido WHERE data_criacao >= :dataInicio GROUP BY HOUR(data_criacao)", nativeQuery = true)
    List<Object[]> consultarPedidosPorHora(@Param("dataInicio") LocalDateTime dataInicio);
}
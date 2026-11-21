package com.voltz.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "pedido") @Getter @Setter
public class Pedido {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pedido") private Long id;
    private String numero;
    @Column(name = "id_cliente") private Long idCliente;
    @Column(name = "id_entregador") private Long idEntregador;
    @Column(name = "tipo_entrega") private String tipoEntrega;
    @Column(name = "endereco_entrega") private String enderecoEntrega;
    private BigDecimal frete;
    @Column(name = "valor_total") private BigDecimal valorTotal;
    private String status;
    private String observacoes;
    @Column(name = "motivo_cancelamento") private String motivoCancelamento;
    @Column(name = "data_criacao") private LocalDateTime dataCriacao;
    @Column(name = "data_atualizacao") private LocalDateTime dataAtualizacao;
}
package com.voltz.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "produto") @Getter @Setter
public class Produto {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_produto") private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_categoria") private Categoria categoria;

    private String nome;
    private String descricao;
    private String marca;
    private BigDecimal preco;
    @Column(name = "preco_antigo") private BigDecimal precoAntigo;
    private Integer estoque;
    @Column(name = "imagem_url") private String imagemUrl;
    private Boolean destaque;
    private Boolean disponivel;
    @Column(name = "data_criacao") private LocalDateTime dataCriacao;
    @Column(name = "data_atualizacao") private LocalDateTime dataAtualizacao;

    @PrePersist
    void aoCriar() {
        dataCriacao = LocalDateTime.now();
        dataAtualizacao = dataCriacao;
    }

    @PreUpdate
    void aoAtualizar() {
        dataAtualizacao = LocalDateTime.now();
    }
}
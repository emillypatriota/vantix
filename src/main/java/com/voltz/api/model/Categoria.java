package com.voltz.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name = "categoria") @Getter @Setter
public class Categoria {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_categoria") private Long id;
    private String nome;
    private String descricao;
}
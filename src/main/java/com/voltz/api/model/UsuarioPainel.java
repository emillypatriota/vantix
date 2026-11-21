package com.voltz.api.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity @Table(name = "usuario_painel") @Getter @Setter
public class UsuarioPainel {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario") private Long id;
    private String nome;
    private String email;
    @Column(name = "senha_hash") private String senhaHash;
    private String papel;   // gerente | estoque | logistica
    private Boolean ativo;
    @Column(name = "data_criacao") private LocalDateTime dataCriacao;

    @PrePersist
    void aoCriar() {
        if (dataCriacao == null) dataCriacao = LocalDateTime.now();
    }
}
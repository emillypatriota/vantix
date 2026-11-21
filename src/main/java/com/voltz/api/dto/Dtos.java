package com.voltz.api.dto;

import com.voltz.api.model.Categoria;
import com.voltz.api.model.Produto;
import com.voltz.api.model.UsuarioPainel;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class Dtos {
    private Dtos() {}

    public record LoginRequest(
            @NotBlank(message = "Informe o e-mail") String email,
            @NotBlank(message = "Informe a senha") String senha) {}

    public record UsuarioResponse(Long id, String nome, String email, String papel, boolean ativo) {
        public static UsuarioResponse de(UsuarioPainel u) {
            return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getPapel(),
                    Boolean.TRUE.equals(u.getAtivo()));
        }
    }

    public record LoginResponse(String token, UsuarioResponse usuario) {}

    public record CategoriaResponse(Long id, String nome, String descricao) {
        public static CategoriaResponse de(Categoria c) {
            return new CategoriaResponse(c.getId(), c.getNome(), c.getDescricao());
        }
    }

    public record ProdutoRequest(
            @NotBlank(message = "Informe o nome do produto") String nome,
            String descricao,
            String marca,
            @NotNull(message = "Informe o preço") @Positive(message = "O preço deve ser maior que zero") BigDecimal preco,
            BigDecimal precoAntigo,
            @NotNull(message = "Informe o estoque") @PositiveOrZero(message = "O estoque não pode ser negativo") Integer estoque,
            String imagemUrl,
            Boolean destaque,
            Boolean disponivel,
            @NotNull(message = "Informe a categoria") Long idCategoria) {}

    public record ProdutoResponse(Long id, Long idCategoria, String categoria, String nome, String descricao,
                                  String marca, BigDecimal preco, BigDecimal precoAntigo, Integer estoque,
                                  String imagemUrl, boolean destaque, boolean disponivel) {
        public static ProdutoResponse de(Produto p) {
            return new ProdutoResponse(p.getId(),
                    p.getCategoria() == null ? null : p.getCategoria().getId(),
                    p.getCategoria() == null ? null : p.getCategoria().getNome(),
                    p.getNome(), p.getDescricao(), p.getMarca(), p.getPreco(), p.getPrecoAntigo(),
                    p.getEstoque(), p.getImagemUrl(),
                    Boolean.TRUE.equals(p.getDestaque()), Boolean.TRUE.equals(p.getDisponivel()));
        }
    }

    public record DisponivelRequest(@NotNull(message = "Informe o valor") Boolean disponivel) {}

    public record FuncionarioRequest(
            @NotBlank(message = "Informe o nome") String nome,
            @NotBlank(message = "Informe o e-mail") @Email(message = "E-mail inválido") String email,
            @NotBlank(message = "Informe o papel")
            @Pattern(regexp = "gerente|estoque|logistica", message = "Papel inválido") String papel,
            Boolean ativo,
            String senha) {}

    public record FuncionarioResponse(Long id, String nome, String email, String papel, boolean ativo,
                                      LocalDateTime dataCriacao) {
        public static FuncionarioResponse de(UsuarioPainel u) {
            return new FuncionarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getPapel(),
                    Boolean.TRUE.equals(u.getAtivo()), u.getDataCriacao());
        }
    }

    public record AtivoRequest(@NotNull(message = "Informe o valor") Boolean ativo) {}
}
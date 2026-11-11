package com.voltz.api.dto.relatorios;

public record ProdutoRecomendadoDTO(
    Long idProduto, 
    String nome, 
    Double preco, 
    String imagemUrl
) {}
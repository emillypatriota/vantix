package com.voltz.api.dto.relatorios;

public record ItemMaisVendidoDTO(
    String nomeProduto, 
    Integer quantidadeVendida,
    Double receitaTotal
) {}
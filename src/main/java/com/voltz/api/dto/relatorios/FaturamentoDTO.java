package com.voltz.api.dto.relatorios;

public record FaturamentoDTO(
    String periodo, 
    Double valorTotal, 
    Integer quantidadePedidos
) {}
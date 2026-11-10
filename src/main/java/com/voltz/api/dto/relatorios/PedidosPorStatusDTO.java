package com.voltz.api.dto.relatorios;

public record PedidosPorStatusDTO(
    String status, 
    Integer quantidade
) {}
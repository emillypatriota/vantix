package com.voltz.api.dto.relatorios;

public record FormaPagamentoDTO(
    String formaPagamento, 
    Integer quantidade, 
    Double valorTotal
) {}
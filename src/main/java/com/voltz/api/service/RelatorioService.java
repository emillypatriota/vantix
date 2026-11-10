package com.voltz.api.service;

import com.voltz.api.dto.relatorios.*;
import com.voltz.api.repository.relatorios.RelatorioRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RelatorioService {

    private final RelatorioRepository repository;

    public RelatorioService(RelatorioRepository repository) {
        this.repository = repository;
    }

    private LocalDateTime calcularDataInicio(String periodo) {
        LocalDateTime agora = LocalDateTime.now();
        return switch (periodo != null ? periodo.toLowerCase() : "tudo") {
            case "semana" -> agora.minusWeeks(1);
            case "mes" -> agora.minusMonths(1);
            default -> LocalDateTime.of(2000, 1, 1, 0, 0);
        };
    }

    public FaturamentoDTO obterFaturamento(String periodo) {
        LocalDateTime dataInicio = calcularDataInicio(periodo);
        List<Object[]> resultado = repository.consultarFaturamento(dataInicio);
        
        if (resultado != null && !resultado.isEmpty() && resultado.get(0)[0] != null) {
            Object[] row = resultado.get(0);
            Double valorTotal = ((Number) row[0]).doubleValue();
            Integer qtdPedidos = ((Number) row[1]).intValue();
            return new FaturamentoDTO(periodo, valorTotal, qtdPedidos);
        }
        return new FaturamentoDTO(periodo, 0.0, 0);
    }

    public List<PedidosPorStatusDTO> obterPedidosPorStatus(String periodo) {
        LocalDateTime dataInicio = calcularDataInicio(periodo);
        return repository.consultarPedidosPorStatus(dataInicio).stream()
                .map(row -> new PedidosPorStatusDTO(
                        (String) row[0],
                        ((Number) row[1]).intValue()
                ))
                .collect(Collectors.toList());
    }

    public List<ItemMaisVendidoDTO> obterItensMaisVendidos(String periodo) {
        LocalDateTime dataInicio = calcularDataInicio(periodo);
        return repository.consultarItensMaisVendidos(dataInicio).stream()
                .map(row -> new ItemMaisVendidoDTO(
                        (String) row[0],
                        ((Number) row[1]).intValue(),
                        ((Number) row[2]).doubleValue()
                ))
                .collect(Collectors.toList());
    }

    public List<FormaPagamentoDTO> obterFormasPagamento(String periodo) {
        LocalDateTime dataInicio = calcularDataInicio(periodo);
        return repository.consultarFormasPagamento(dataInicio).stream()
                .map(row -> new FormaPagamentoDTO(
                        (String) row[0],
                        ((Number) row[1]).intValue(),
                        ((Number) row[2]).doubleValue()
                ))
                .collect(Collectors.toList());
    }

    public List<PedidoPorHoraDTO> obterPedidosPorHora(String periodo) {
        LocalDateTime dataInicio = calcularDataInicio(periodo);
        return repository.consultarPedidosPorHora(dataInicio).stream()
                .map(row -> new PedidoPorHoraDTO(
                        ((Number) row[0]).intValue(),
                        ((Number) row[1]).intValue()
                ))
                .collect(Collectors.toList());
    }
}
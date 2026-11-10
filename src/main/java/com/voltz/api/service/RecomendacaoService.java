package com.voltz.api.service;

import com.voltz.api.dto.relatorios.ProdutoRecomendadoDTO;
import com.voltz.api.repository.relatorios.RecomendacaoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RecomendacaoService {

    private final RecomendacaoRepository repository;

    public RecomendacaoService(RecomendacaoRepository repository) {
        this.repository = repository;
    }

    public List<ProdutoRecomendadoDTO> obterRecomendacoes(Long idProduto) {
        List<Object[]> resultados = repository.buscarProdutosRelacionados(idProduto);
        
        return resultados.stream()
                .map(row -> new ProdutoRecomendadoDTO(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).doubleValue(),
                        (String) row[3]
                ))
                .collect(Collectors.toList());
    }
}
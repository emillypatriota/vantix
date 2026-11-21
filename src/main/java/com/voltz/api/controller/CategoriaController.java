package com.voltz.api.controller;

import com.voltz.api.dto.Dtos.CategoriaResponse;
import com.voltz.api.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
public class CategoriaController {
    private final CategoriaRepository categorias;

    @GetMapping
    public List<CategoriaResponse> listar() {
        return categorias.findAll(Sort.by("id")).stream().map(CategoriaResponse::de).toList();
    }
}
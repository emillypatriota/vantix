package com.voltz.api.controller;

import com.voltz.api.dto.Dtos.DisponivelRequest;
import com.voltz.api.dto.Dtos.ProdutoRequest;
import com.voltz.api.dto.Dtos.ProdutoResponse;
import com.voltz.api.model.Produto;
import com.voltz.api.repository.CategoriaRepository;
import com.voltz.api.repository.ProdutoRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/produtos")
@RequiredArgsConstructor
public class ProdutoController {
    private final ProdutoRepository produtos;
    private final CategoriaRepository categorias;

    @GetMapping
    public List<ProdutoResponse> listar(@RequestParam(defaultValue = "") String categoria,
                                        @RequestParam(defaultValue = "") String busca,
                                        @RequestParam(defaultValue = "false") boolean incluirInativos,
                                        Authentication auth) {
        if (incluirInativos && !ehGerente(auth)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Apenas o gerente vê produtos inativos");
        }
        return produtos.filtrar(incluirInativos, categoria.trim(), busca.trim())
                .stream().map(ProdutoResponse::de).toList();
    }

    @GetMapping("/{id}")
    public ProdutoResponse buscar(@PathVariable Long id) {
        return ProdutoResponse.de(achar(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProdutoResponse criar(@Valid @RequestBody ProdutoRequest r) {
        Produto p = new Produto();
        preencher(p, r);
        return ProdutoResponse.de(produtos.save(p));
    }

    @PutMapping("/{id}")
    public ProdutoResponse editar(@PathVariable Long id, @Valid @RequestBody ProdutoRequest r) {
        Produto p = achar(id);
        preencher(p, r);
        return ProdutoResponse.de(produtos.save(p));
    }

    @PatchMapping("/{id}/disponivel")
    public ProdutoResponse disponivel(@PathVariable Long id, @Valid @RequestBody DisponivelRequest r) {
        Produto p = achar(id);
        p.setDisponivel(r.disponivel());
        return ProdutoResponse.de(produtos.save(p));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        Produto p = achar(id);
        try {
            produtos.delete(p);
            produtos.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Este produto já tem pedidos e não pode ser excluído. Desative-o.");
        }
        return ResponseEntity.noContent().build();
    }

    private boolean ehGerente(Authentication auth) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_GERENTE"));
    }

    private Produto achar(Long id) {
        return produtos.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));
    }

    private void preencher(Produto p, ProdutoRequest r) {
        p.setNome(r.nome().trim());
        p.setDescricao(r.descricao());
        p.setMarca(r.marca());
        p.setPreco(r.preco());
        p.setPrecoAntigo(r.precoAntigo());
        p.setEstoque(r.estoque());
        p.setImagemUrl(r.imagemUrl());
        p.setDestaque(r.destaque() != null && r.destaque());
        p.setDisponivel(r.disponivel() == null || r.disponivel());
        p.setCategoria(categorias.findById(r.idCategoria())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria inexistente")));
    }
}
package com.voltz.api.controller;

import com.voltz.api.dto.Dtos.AtivoRequest;
import com.voltz.api.dto.Dtos.FuncionarioRequest;
import com.voltz.api.dto.Dtos.FuncionarioResponse;
import com.voltz.api.model.UsuarioPainel;
import com.voltz.api.repository.UsuarioPainelRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/funcionarios")
@RequiredArgsConstructor
public class FuncionarioController {
    private final UsuarioPainelRepository usuarios;
    private final PasswordEncoder encoder;

    @GetMapping
    public List<FuncionarioResponse> listar() {
        return usuarios.findAll().stream().map(FuncionarioResponse::de).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FuncionarioResponse cadastrar(@Valid @RequestBody FuncionarioRequest r) {
        String email = r.email().trim().toLowerCase();
        if (usuarios.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
        }
        validarSenha(r.senha());
        UsuarioPainel u = new UsuarioPainel();
        u.setNome(r.nome().trim());
        u.setEmail(email);
        u.setPapel(r.papel());
        u.setAtivo(r.ativo() == null || r.ativo());
        u.setSenhaHash(encoder.encode(r.senha()));
        return FuncionarioResponse.de(usuarios.save(u));
    }

    @PutMapping("/{id}")
    public FuncionarioResponse editar(@PathVariable Long id, @Valid @RequestBody FuncionarioRequest r,
                                      Authentication auth) {
        UsuarioPainel u = achar(id);
        String email = r.email().trim().toLowerCase();
        usuarios.findByEmailIgnoreCase(email).filter(x -> !x.getId().equals(id)).ifPresent(x -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
        });
        boolean ativo = r.ativo() == null || r.ativo();
        if (!ativo && u.getEmail().equalsIgnoreCase(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Você não pode desativar o seu próprio usuário");
        }
        if (r.senha() != null && !r.senha().isBlank()) {
            validarSenha(r.senha());
            u.setSenhaHash(encoder.encode(r.senha()));
        }
        u.setNome(r.nome().trim());
        u.setEmail(email);
        u.setPapel(r.papel());
        u.setAtivo(ativo);
        return FuncionarioResponse.de(usuarios.save(u));
    }

    @PatchMapping("/{id}/ativo")
    public FuncionarioResponse ativo(@PathVariable Long id, @Valid @RequestBody AtivoRequest r,
                                     Authentication auth) {
        UsuarioPainel u = achar(id);
        if (!r.ativo() && u.getEmail().equalsIgnoreCase(auth.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Você não pode desativar o seu próprio usuário");
        }
        u.setAtivo(r.ativo());
        return FuncionarioResponse.de(usuarios.save(u));
    }

    private void validarSenha(String senha) {
        if (senha == null || senha.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A senha deve ter no mínimo 6 caracteres");
        }
    }

    private UsuarioPainel achar(Long id) {
        return usuarios.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Funcionário não encontrado"));
    }
}
package com.voltz.api.controller;

import com.voltz.api.dto.Dtos.LoginRequest;
import com.voltz.api.dto.Dtos.LoginResponse;
import com.voltz.api.dto.Dtos.UsuarioResponse;
import com.voltz.api.repository.UsuarioPainelRepository;
import com.voltz.api.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UsuarioPainelRepository usuarios;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest r) {
        var u = usuarios.findByEmailIgnoreCase(r.email().trim())
                .filter(x -> encoder.matches(r.senha(), x.getSenhaHash()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos"));
        if (!Boolean.TRUE.equals(u.getAtivo())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuário desativado");
        }
        return new LoginResponse(jwt.gerar(u), UsuarioResponse.de(u));
    }
}
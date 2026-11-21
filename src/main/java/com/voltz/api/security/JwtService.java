package com.voltz.api.security;

import com.voltz.api.model.UsuarioPainel;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expiracaoMs;

    public JwtService(@Value("${voltz.jwt.secret}") String secret,
                      @Value("${voltz.jwt.expiration-ms}") long expiracaoMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiracaoMs = expiracaoMs;
    }

    public String gerar(UsuarioPainel u) {
        return Jwts.builder()
                .subject(u.getEmail())
                .claim("papel", u.getPapel())
                .claim("nome", u.getNome())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiracaoMs))
                .signWith(key)
                .compact();
    }

    public Claims ler(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}
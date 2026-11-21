package com.voltz.api.repository;

import com.voltz.api.model.UsuarioPainel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioPainelRepository extends JpaRepository<UsuarioPainel, Long> {
    Optional<UsuarioPainel> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
}
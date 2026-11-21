package com.voltz.api.repository;

import com.voltz.api.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface ProdutoRepository extends JpaRepository<Produto, Long> {
    @Query("""
        select p from Produto p join fetch p.categoria c
        where (:incluirInativos = true or p.disponivel = true)
          and (:categoria = '' or lower(c.nome) = lower(:categoria))
          and (:busca = ''
               or lower(p.nome) like lower(concat('%', :busca, '%'))
               or lower(coalesce(p.marca, '')) like lower(concat('%', :busca, '%')))
        order by p.nome
        """)
    List<Produto> filtrar(@Param("incluirInativos") boolean incluirInativos,
                          @Param("categoria") String categoria,
                          @Param("busca") String busca);
}
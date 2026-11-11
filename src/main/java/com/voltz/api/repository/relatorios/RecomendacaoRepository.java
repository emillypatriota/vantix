package com.voltz.api.repository.relatorios;

import com.voltz.api.model.Produto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecomendacaoRepository extends JpaRepository<Produto, Long> {

    @Query(value = "SELECT p.id_produto, p.nome, p.preco, p.imagem_url " +
                   "FROM produto p " +
                   "JOIN produto_relacionado pr ON p.id_produto = pr.id_produto_relacionado " +
                   "WHERE pr.id_produto = :idProduto", nativeQuery = true)
    List<Object[]> buscarProdutosRelacionados(@Param("idProduto") Long idProduto);
}
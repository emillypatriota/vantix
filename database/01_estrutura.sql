-- =====================================================================
-- VOLTZ TECH STORE - Banco de dados (MySQL 8)  |  Script 1 de 2: ESTRUTURA
-- rode este arquivo primeiro e depois o 02_dados.sql.
-- ATENCAO: a linha DROP abaixo apaga o banco vantix_db se ele ja existir.
-- =====================================================================
DROP DATABASE IF EXISTS vantix_db;
CREATE DATABASE vantix_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE vantix_db;

-- CLIENTES (quem compra na loja)
CREATE TABLE cliente (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    endereco VARCHAR(255),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- USUARIOS DOS PAINEIS (gerente, estoque, logistica) - usados no login
CREATE TABLE usuario_painel (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    papel ENUM('gerente', 'estoque', 'logistica') NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIAS
CREATE TABLE categoria (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUTOS
CREATE TABLE produto (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    marca VARCHAR(60),
    preco DECIMAL(10, 2) NOT NULL,
    preco_antigo DECIMAL(10, 2),
    estoque INT NOT NULL DEFAULT 0,
    imagem_url VARCHAR(255),
    destaque BOOLEAN NOT NULL DEFAULT FALSE,
    disponivel BOOLEAN NOT NULL DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT ck_produto_preco CHECK (preco > 0),
    CONSTRAINT ck_produto_estoque CHECK (estoque >= 0),
    FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria) ON DELETE RESTRICT
);

-- PRODUTOS RELACIONADOS (N:N do produto com ele mesmo) - base da recomendacao
CREATE TABLE produto_relacionado (
    id_produto INT NOT NULL,
    id_produto_relacionado INT NOT NULL,
    PRIMARY KEY (id_produto, id_produto_relacionado),
    CONSTRAINT ck_relacionado_diferente CHECK (id_produto <> id_produto_relacionado),
    FOREIGN KEY (id_produto) REFERENCES produto(id_produto) ON DELETE CASCADE,
    FOREIGN KEY (id_produto_relacionado) REFERENCES produto(id_produto) ON DELETE CASCADE
);

-- PEDIDOS
CREATE TABLE pedido (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,
    id_cliente INT NOT NULL,
    id_entregador INT NULL,
    tipo_entrega ENUM('entrega', 'retirada') NOT NULL DEFAULT 'entrega',
    endereco_entrega TEXT NULL,
    frete DECIMAL(10, 2) NOT NULL DEFAULT 0,
    valor_total DECIMAL(10, 2) NOT NULL,
    status ENUM('pendente', 'confirmado', 'em_preparacao', 'pronto',
                'saiu_para_entrega', 'entregue', 'cancelado') NOT NULL DEFAULT 'pendente',
    observacoes TEXT,
    motivo_cancelamento VARCHAR(255),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT ck_pedido_total CHECK (valor_total >= 0),
    FOREIGN KEY (id_cliente) REFERENCES cliente(id_cliente) ON DELETE RESTRICT,
    FOREIGN KEY (id_entregador) REFERENCES usuario_painel(id_usuario) ON DELETE SET NULL
);

-- ITENS DO PEDIDO (subtotal e calculado pelo banco, nao pode ficar inconsistente)
CREATE TABLE item_pedido (
    id_item INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,
    CONSTRAINT ck_item_quantidade CHECK (quantidade > 0),
    CONSTRAINT uq_item_pedido_produto UNIQUE (id_pedido, id_produto),
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_produto) REFERENCES produto(id_produto) ON DELETE RESTRICT
);

-- PAGAMENTO (1:1 com o pedido)
CREATE TABLE pagamento (
    id_pagamento INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL UNIQUE,
    forma ENUM('credito', 'debito', 'pix', 'boleto') NOT NULL,
    parcelas INT NOT NULL DEFAULT 1,
    valor DECIMAL(10, 2) NOT NULL,
    CONSTRAINT ck_pagamento_parcelas CHECK (parcelas BETWEEN 1 AND 12),
    FOREIGN KEY (id_pedido) REFERENCES pedido(id_pedido) ON DELETE CASCADE
);

-- INDICES para as consultas mais usadas
CREATE INDEX idx_produto_categoria ON produto(id_categoria);
CREATE INDEX idx_pedido_status ON pedido(status);
CREATE INDEX idx_pedido_data ON pedido(data_criacao);
CREATE INDEX idx_pedido_cliente ON pedido(id_cliente);

-- ---------------------------------------------------------------------
-- TRIGGER DE ESTOQUE
--  * pedido pendente -> confirmado: baixa o estoque (se faltar, da erro e desfaz)
--  * pedido cancelado depois de confirmado (e antes de sair p/ entrega): devolve o estoque
-- ---------------------------------------------------------------------
DELIMITER $$
CREATE TRIGGER trg_pedido_estoque
AFTER UPDATE ON pedido
FOR EACH ROW
BEGIN
    IF OLD.status = 'pendente' AND NEW.status = 'confirmado' THEN
        UPDATE produto p
        JOIN item_pedido i ON i.id_produto = p.id_produto
        SET p.estoque = p.estoque - i.quantidade
        WHERE i.id_pedido = NEW.id_pedido;
    ELSEIF NEW.status = 'cancelado'
           AND OLD.status IN ('confirmado', 'em_preparacao', 'pronto') THEN
        UPDATE produto p
        JOIN item_pedido i ON i.id_produto = p.id_produto
        SET p.estoque = p.estoque + i.quantidade
        WHERE i.id_pedido = NEW.id_pedido;
    END IF;
END$$
DELIMITER ;

-- ---------------------------------------------------------------------
-- VIEWS (alimentam os graficos e indicadores do painel do gerente)
-- ---------------------------------------------------------------------
CREATE VIEW vw_faturamento_diario AS
SELECT DATE(data_criacao) AS dia, COUNT(*) AS pedidos, SUM(valor_total) AS faturamento
FROM pedido WHERE status <> 'cancelado'
GROUP BY DATE(data_criacao);

CREATE VIEW vw_pedidos_por_status AS
SELECT status, COUNT(*) AS pedidos FROM pedido GROUP BY status;

CREATE VIEW vw_produtos_mais_vendidos AS
SELECT p.id_produto, p.nome, c.nome AS categoria,
       SUM(i.quantidade) AS unidades_vendidas, SUM(i.subtotal) AS receita
FROM item_pedido i
JOIN pedido pe ON pe.id_pedido = i.id_pedido AND pe.status <> 'cancelado'
JOIN produto p ON p.id_produto = i.id_produto
JOIN categoria c ON c.id_categoria = p.id_categoria
GROUP BY p.id_produto, p.nome, c.nome;

CREATE VIEW vw_formas_pagamento AS
SELECT pg.forma, COUNT(*) AS pedidos, SUM(pg.valor) AS valor
FROM pagamento pg JOIN pedido pe ON pe.id_pedido = pg.id_pedido
WHERE pe.status <> 'cancelado'
GROUP BY pg.forma;

CREATE VIEW vw_pedidos_por_hora AS
SELECT HOUR(data_criacao) AS hora, COUNT(*) AS pedidos FROM pedido GROUP BY HOUR(data_criacao);

CREATE VIEW vw_estoque_baixo AS
SELECT id_produto, nome, estoque FROM produto WHERE disponivel = TRUE AND estoque <= 10;

-- RECOMENDACAO: "quem comprou o produto A tambem levou o produto B"
CREATE VIEW vw_comprados_juntos AS
SELECT a.id_produto AS id_produto, b.id_produto AS id_recomendado, COUNT(*) AS vezes
FROM item_pedido a
JOIN item_pedido b ON b.id_pedido = a.id_pedido AND b.id_produto <> a.id_produto
JOIN pedido pe ON pe.id_pedido = a.id_pedido AND pe.status <> 'cancelado'
GROUP BY a.id_produto, b.id_produto;

SHOW TABLES;

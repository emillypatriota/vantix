# Firebase Setup — VOLTZ Tech Store

## 1. Criar um projeto novo (recomendado)

O `src/environments/environment.ts` e o `environment.prod.ts` ainda apontam para o
projeto antigo **maka-delivery-7382b**. Para a loja nova:

1. https://console.firebase.google.com → **Adicionar projeto**
2. Ative **Authentication** (método E-mail/senha) e **Firestore Database**
3. Configurações do projeto → Seus apps → **Web** → copie o objeto `firebaseConfig`
4. Cole nos dois arquivos de `src/environments/`
5. Atualize `.firebaserc` com o id do projeto novo (para `firebase deploy`)

> Se preferir reaproveitar o projeto antigo, funciona: o catálogo agora usa a coleção
> `products` (antes era `menu`), então os produtos novos são criados automaticamente
> sem conflitar com os pratos antigos. Só que pedidos (`orders`) e equipe (`staff`)
> antigos continuam lá e vão aparecer nos painéis — por isso o projeto novo é o ideal.

## 2. Criar os usuários (Authentication → Users → Add user)

| E-mail              | Senha     | Portal    |
|---------------------|-----------|-----------|
| gerente@voltz.com   | voltz2024 | Gerente   |
| estoque@voltz.com   | voltz2024 | Estoque   |
| logistica@voltz.com | voltz2024 | Logística |

## 3. Regras do Firestore

O cliente navega **sem login**, então o catálogo precisa de leitura pública e o
checkout precisa conseguir criar pedidos. Sugestão (adequada para demo acadêmica):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Catálogo: todos leem; só funcionários editam.
    // A 1ª execução grava o catálogo inicial: faça login como gerente uma vez
    // (ou libere o write temporariamente) para o seed rodar.
    match /products/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Pedidos: cliente cria e acompanha; funcionários atualizam.
    match /orders/{id} {
      allow create, read: if true;
      allow update, delete: if request.auth != null;
    }

    // Demais coleções (equipe etc.): só funcionários.
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 4. Rodar

```bash
npm install
npm start
```

## 5. URLs

| Portal    | URL                                  |
|-----------|--------------------------------------|
| Cliente   | http://localhost:4200                |
| Gerente   | http://localhost:4200/login/manager  |
| Estoque   | http://localhost:4200/login/kitchen  |
| Logística | http://localhost:4200/login/delivery |

// Configuração de desenvolvimento.
// useMock: true  -> o Angular usa um back-end falso em memória (dados do database/02_dados.sql).
// useMock: false -> o Angular chama a API Java (Spring Boot) em apiUrl.
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  useMock: true,
  pollingMs: 5000, // intervalo de atualização dos painéis de Estoque e Logística
};

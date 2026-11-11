// Configuração de produção (ng build). Aponta para a API Java.
export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080/api',
  useMock: false,
  pollingMs: 5000,
};

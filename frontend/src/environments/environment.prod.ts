// Build de producción (S3 static website). La URL del API Gateway no cambia entre
// sesiones del Learner Lab; lo que cambia (el DNS de la EC2) queda detrás de él (ADR-06).
export const environment = {
  production: true,
  apiUrl: 'https://m58rg3eg2k.execute-api.us-east-1.amazonaws.com/api',
};

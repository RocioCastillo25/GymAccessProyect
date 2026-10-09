// Configuración de pruebas: entorno de test antes de cargar la aplicación.
// Las variables DB_* provienen de backend/.env (o del entorno); aquí solo se
// fija el modo de prueba y la clave JWT de firma para las pruebas.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto_de_pruebas_no_produccion';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '60m';

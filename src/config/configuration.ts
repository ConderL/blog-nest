export default () => ({
  app: {
    name: "conder's blog",
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    username: process.env.DATABASE_USERNAME || 'root',
    password: process.env.DATABASE_PASSWORD || 'wdrx4100',
    database: process.env.DATABASE_DATABASE || 'blog',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'MZPCcTuDFHkAb87fP7veY4YUwuwbI9t4tPcJC4E7pzg',
    expiresIn: '24h',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  },
});

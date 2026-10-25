// pm2 start ecosystem.config.cjs && pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: 'mappuzzle-gateway',
      script: 'server.mjs',
      cwd: __dirname,
      instances: 1, // el trabajo pesado va a los procesos hijo (WORKERS)
      exec_mode: 'fork',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 3100,
        // En el VPS: ruta absoluta del SQLite (por defecto ../../data/front.sqlite3.png)
        DATABASE_FILE: '/var/www/mappuzzle/front.sqlite3.png',
        WORKERS: 2,
        QUERY_TIMEOUT_MS: 10000,
      },
    },
  ],
};

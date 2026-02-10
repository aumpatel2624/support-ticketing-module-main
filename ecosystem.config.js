module.exports = {
    apps: [
        {
            name: 'backend-api',
            script: './src/index.js',
            cwd: './backend', // IMPORTANT: Run from backend directory so .env is found
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 5000
            }
        },
        // Frontend is served via Nginx or build artifacts, so no PM2 process needed here
        // unless running a Next.js server (which would need 'npm start' in ./frontend)
    ]
};

module.exports = {
  apps: [{
    name: 'ebuilders',
    script: 'server.js',
    cwd: '/home/ebuilders',
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
      HOSTNAME: '127.0.0.1'
    }
  }]
}

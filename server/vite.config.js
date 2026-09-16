import path from 'path'

export default {
  root: path.join(__dirname, 'src'),
  publicDir: path.join(__dirname, 'public'),
  server: {
    port: 8080,
    host: true
  },
  plugins: []
}
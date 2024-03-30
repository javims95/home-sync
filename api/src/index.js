const express = require('express')
const dotenv = require('dotenv')
const logger = require('./middleware/logger')
const mainRoutes = require('./routes/apiRoutes')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware para registrar las solicitudes
app.use(logger)

// Rutas principales
app.use('/', mainRoutes)

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
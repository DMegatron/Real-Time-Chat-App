const express = require('express')
const path = require('path')
const { createServer } = require('node:http')
const { Server } = require('socket.io')
const { log } = require('node:console')

const app = express()
const server = createServer(app)
const io = new Server(server)

const PORT = 3000

app.use(express.static(path.join(__dirname, '../frontend/public')))

app.get('/', (req, res) => {
    res.sendFile('index.html')
})

io.on('connection', (socket) => {
    console.log(`User ${ socket.id } connected.`)
    socket.on('chat message', (message) => {
        io.emit('chat message', message)
    })
    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected`)
    })
})

server.listen(PORT, () => {
    console.log(`Server is running on: http://localhost:${PORT}`)
})
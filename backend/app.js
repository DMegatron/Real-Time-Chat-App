const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const path = require('path')
const { createServer } = require('node:http')
const { Server } = require('socket.io')
 
const Messages = require('./models/messages.model')

mongoose.connect("mongodb://127.0.0.1:27017/chatApp")
.then(() => {
    console.log('Mongodb Connected!')
})
.catch(err => {
    console.log('Could not connect Mongodb')
})
 
const app = express()
const server = createServer(app)
const io = new Server(server, {
    connectionStateRecovery: {}
})

const PORT = 3000

app.use(express.static(path.join(__dirname, '../frontend/public')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/login.html'))
}) 

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/chat.html'))
})  

io.on('connection', async (socket) => {
    console.log(`User ${ socket.id } connected.`)
    
    //Send previous messages to new users
    try {
        const messages = await Messages.find().sort({ timestamp: 1})
        if (messages.length > 0) {
            socket.emit('load previous messages', messages.map(msg => ({
                id: msg._id.toString(),
                username: msg.username,
                // room: msg.room || "general",
                time: msg.timestamp,
                text: msg.text
            })))
        }
    } catch (error) {
        console.error("Error loading messages: ", error)
    }

    //Normal message sending
    socket.on('chat message', async (message) => {
        try {
            //Save to database
            const savedMessages = await Messages.create({
                text: message.text,
                userId: socket.id,
                username: message.username || "Anonymous",
                // room: message.room || "general"
            })

            //Broadcast to all connected users in the same room
            io.emit("chat message", {
                id: savedMessages._id.toString(),
                userId: savedMessages.userId,
                text: savedMessages.text,
                username: savedMessages.username,
                // room: savedMessages.room,
                timestamp: savedMessages.timestamp
            })
        } catch (error) {
            console.log('Error saving message: ', error)
        }
    })

    //On disconnect
    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected!`)
    })

})

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on: http://localhost:${PORT}`)
}) 
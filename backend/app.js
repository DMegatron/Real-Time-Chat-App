const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const path = require('path')
const { createServer } = require('node:http')
const { Server } = require('socket.io')
const session = require('express-session')
const bcrypt = require('bcrypt')
 
const Messages = require('./models/messages.model')
const User = require('./models/users.model')
const { isPromise } = require('node:util/types')

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

const PORT = 5000

//Middleware for passing json and form data
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//Session middleware
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24
    }
}))

app.use(express.static(path.join(__dirname, '../frontend/public')))

const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login')
    }
    next()
}

app.get('/chat', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/chat.html'))
})  

app.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/chat')
    }
    res.sendFile(path.join(__dirname, '../frontend/public/login.html'))
}) 

app.post('/login', async(req, res) => {
    try {
        const { username, password } = req.body
        const user = await User.findOne({ username })
        //Check if user exists or not
        if (!user) {
            return res.status(400).json({ message: "Invalid username or password!"})
        }
        //If user exists check password
        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password!'})
        }

        req.session.user = {
            id: user._id,
            username: user.username,
            name: user.name
        }
        console.log('success')
        res.status(200).json({
            message: 'Login successful!',
            username: user.username,
            name: user.name
        })
    } catch (error) {
        console.log("Login error: ", error)
        res.status(500).json({ message: 'Error logging in!'})
    }
})

app.post('/register', async(req, res) => {
    try {
        const { name, username, password, confirmPassword } = req.body
        const existingUser = await User.findOne({ username })
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists!'})
        }
        if (password != confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match!'})
        }
        const newUser = new User({ name, username, password })
        await newUser.save()
        req.session.user = {
            id: newUser._id,
            username: newUser.username,
            name: newUser.name
        }
        res.status(201).json({
            message: "User registered successfully!",
            username: newUser.username,
            name: newUser.name
        })
    } catch (error) {
        console.log('Registration error: ', error)
        res.status(500).json({ message: "Error registering user!"})
    }
})

app.get('/logout', (req,res) => {
    req.session.destroy()
    res.redirect('/login')
})

const connectedUsers = new Map();

io.on('connection', async (socket) => {
    console.log(`User ${ socket.id } connected.`)

    //Get username from session
    const username = socket.handshake.query.username
    const name = socket.handshake.query.name

    if (username) {
        socket.username = username
        socket.name = name
    }

    connectedUsers.set(username, {
        name: name,
        username: username,
        socketId: socket.id
    })

    io.emit('user list', Array.from(connectedUsers.values()))

    //Send previous messages to new users
    try {
        const messages = await Messages.find().sort({ timestamp: 1})
        if (messages.length > 0) {
            socket.emit('load previous messages', messages.map(msg => ({
                id: msg._id.toString(),
                username: msg.username,
                name: msg.name,
                recipient: msg.recipient,
                isPrivate: msg.isPrivate,
                timestamp: msg.timestamp,
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
                username: message.username,
                name: message.name
            })

            //Broadcast to all connected users in the same room
            io.emit("chat message", {
                id: savedMessages._id.toString(),
                text: savedMessages.text,
                username: savedMessages.username,
                name: savedMessages.name,
                timestamp: savedMessages.timestamp
            })
        } catch (error) {
            console.log('Error saving message: ', error)
        }
    })

    //Private message sending
    socket.on('private message', async (data) => {
        try {
            const { to, text } = data
            const from = socket.username
            const fromName = socket.name
            //Get receivers socket id
            const userData = connectedUsers.get(to)
            const recipientSocketId = userData ? userData.socketId : null;

            // if (!recipientSocketId ) {
                
            // }

            //Save message to database
            const savedMessage = await Messages.create({
                text,
                username: from,
                name: fromName,
                recipient: to,
                isPrivate: true
            })

            //Message data to send
            const messageData = {
                id: savedMessage._id.toString(),
                text,
                username: from,
                name: fromName,
                recipient: to,
                timestamp: savedMessage.timestamp,
                isPrivate: true
            }
            io.to(recipientSocketId).emit('private message', messageData)

            socket.emit('private message', messageData)
        } catch (error) {
            console.log('Error sending private message: ', error)
            socket.emit('private message error', {
                message: 'Failed to send messasge!'
            })
        }
    })

    //On disconnect
    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected!`)

        connectedUsers.delete(socket.username)

        if (socket.username) {
            io.emit('user list', Array.from(connectedUsers.keys()))
        }

    })

})

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on: http://localhost:${PORT}/login`)
}) 
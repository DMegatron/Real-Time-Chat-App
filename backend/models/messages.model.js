const mongoose = require('mongoose')

const Messages = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: false,
        default: "Anonymous"
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
})

module.exports = mongoose.model('Messages', Messages)
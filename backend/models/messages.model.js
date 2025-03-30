const mongoose = require('mongoose')

const Messages = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: false,
        default: "anonymous"
    },
    username: {
        type: String,
        required: false,
        default: "Anonymous"
    },
    // room: {
    //     type: String,
    //     require: false,
    //     default: "general"
    // },
    timestamp: {
        type: Date,
        default: Date.now
    },
})

module.exports = mongoose.model('Messages', Messages)
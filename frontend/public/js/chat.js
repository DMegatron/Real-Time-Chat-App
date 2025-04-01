//Add username input
const username = sessionStorage.getItem('username')
const name = sessionStorage.getItem('name')
if (!username) {
    window.location.href = '/login'
}
document.getElementById('username-display').textContent = `${name}`

const form = document.getElementById('form')
const input = document.getElementById('input')
const messages = document.getElementById('messages')
const toggleButton = document.getElementById('toggle-btn')
const receivedMessageIDs = new Set()

const socket = io({
    query: {
        username: username,
        name: name
    }
});

//Track current receipients
let currentRecipient = null
const userList = document.getElementById('users')

// Update the user list event handler to toggle private chat
socket.on('user list', (users) => {
    userList.innerHTML = '';

    // Add all users except self
    users.forEach(user => {
        if (user.username != username) {
            const userItem = document.createElement('li');
            userItem.textContent = user.name;
            
            // Store username as a data attribute for easy reference
            userItem.dataset.username = user.username;
            
            // Check if this user is the current recipient and mark as selected
            if (user.username === currentRecipient) {
                userItem.classList.add('selected');
            }
            
            userItem.addEventListener('click', () => {
                // Toggle functionality - if already selected, deselect
                if (currentRecipient === user.username) {
                    // Exit private chat mode
                    currentRecipient = null;
                    userItem.classList.remove('selected');
                    input.placeholder = 'Type a message...';
                    
                    // Add visual feedback
                    userItem.classList.add('deselected');
                    setTimeout(() => {
                        userItem.classList.remove('deselected');
                    }, 300);
                } else {
                    // Enter private chat mode with this user
                    currentRecipient = user.username;
                    
                    // Remove 'selected' class from all users
                    document.querySelectorAll('#users li').forEach(li => {
                        li.classList.remove('selected');
                    });
                    
                    // Add 'selected' class to this user
                    userItem.classList.add('selected');
                    input.placeholder = `Message to ${user.name}...`;
                    
                    // Add visual feedback
                    userItem.classList.add('just-selected');
                    setTimeout(() => {
                        userItem.classList.remove('just-selected');
                    }, 300);
                }
            });
            
            userList.appendChild(userItem);
        }
    });
})

//Load previous messages
socket.on('load previous messages', (previousMessages) => {
    previousMessages.forEach(message => {
        if (!receivedMessageIDs.has(message.id)) {
            addMessageToDOM(message)
            receivedMessageIDs.add(message.id)
        }
    })
    window.scrollTo(0, document.body.scrollHeight)
})

//Listen for new messages
socket.on('chat message', (message) => {
    console.log('Received message:', message)
    if (!receivedMessageIDs.has(message.id)) {
        addMessageToDOM(message)
        receivedMessageIDs.add(message.id)
    }
    window.scrollTo(0, document.body.scrollHeight)
})

//Handle form submission
form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (input.value) {
        if (currentRecipient) {
            socket.emit('private message', {
                to: currentRecipient,
                text: input.value
            })
        } else {
            socket.emit('chat message', {
                text: input.value,
                username: username,
                name: name
                // userId: socket.id,
                // room: 'general'
            })
        }
        input.value = ''
    }
})

//Cancel private message
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && currentRecipient) {
        currentRecipient = null
        document.querySelectorAll('#users li').forEach(li => {
            li.classList.remove('selected')
        })
        input.placeholder = 'Type a message...'
    }
})

//Handle incoming private message
socket.on('private message', (message) => {
    console.log('Received private message:', message)

    const item = document.createElement('li')
    const isFromMe = message.username === username

    item.classList.add('private-message')
    if (isFromMe) {
        item.classList.add('own-message')
    }

    item.innerHTML = `
                <div class="message-header">
                <strong>${message.name || message.username}</strong>
                <span class="private-badge">Private</span>
            </div>
            <div class="message-body">${message.text}</div>
            <small class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</small>
            `

    messages.appendChild(item)
    window.scrollTo(0, document.body.scrollHeight)
})

socket.on('private message error', (error) => {
    console.log('Private message error:', error)

    const item = document.createElement('li')
    item.classList.add('error-message')
    item.textContent = `Error sending message to ${error.to}: ${error.message}`;
    messages.appendChild(item)
})

//Connect and Disconnect
toggleButton.addEventListener('click', (event) => {
    event.preventDefault();
    if (socket.connected) {
        toggleButton.innerText = 'Connect'
        socket.disconnect()
    } else {
        toggleButton.innerText = 'Disconnect'
        socket.connect()
    }
})

//Add message to DOM
function addMessageToDOM(message) {
    const item = document.createElement('li')
    const isCurrentUser = message.username === username

    if (message.isPrivate) {
        // Only display private messages if they are to/from the current user
        if (message.username === username || message.recipient === username) {
            item.classList.add('private-message');

            item.innerHTML = `
                <div class="message-header">
                    <strong>${message.name || message.username}</strong>
                    <span class="private-badge">Private</span>
                </div>
                <div class="message-body">${message.text}</div>
                <small class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</small>
            `;

            if (isCurrentUser) {
                item.classList.add('own-message');
            }

            messages.appendChild(item);
        }
    } else {
        // Regular public message
        item.innerHTML = `
            <strong>${message.name || message.username}:</strong>
            ${message.text}
            <small class="timestamp">${new Date(message.timestamp).toLocaleTimeString()}</small>
        `;

        if (isCurrentUser) {
            item.classList.add('own-message');
        }

        messages.appendChild(item);
    }
}
// Check if users container has overflow and add class if needed
function checkUserListOverflow() {
    const usersContainer = document.querySelector('.users-container');
    if (!usersContainer) return;

    if (usersContainer.scrollWidth > usersContainer.clientWidth) {
        usersContainer.classList.add('has-overflow');
    } else {
        usersContainer.classList.remove('has-overflow');
    }
}

// Call on window resize and when users list changes
window.addEventListener('resize', checkUserListOverflow);
socket.on('user list', () => {
    setTimeout(checkUserListOverflow, 100); // Delay to ensure DOM is updated
});
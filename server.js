const WebSocket = require('ws');

let userIds = 0;
const clients = [];
const server = new WebSocket.Server({ port: 4000 });

server.on('connection', (ws) => {
    // connected(ws);
    clients.push(ws);
    ws.on('message', (message) => {
        handle(ws, message);
    });
    ws.on('close', () => {
        handleClose(ws);
    });
});

// function connected(ws) {
//     userIds++;
//     ws.id = userIds;
//     clients.push(ws);
// }

function handle(ws, message) {
    console.log('Received:', message);
    let messageData = prepareMessage(message);
    console.log('messageData:', messageData);
    if (messageData.username) {
        ws.username = messageData.username;
        ws.send(JSON.stringify({ online: onlineUsers() }));
    }
    messageData.online = onlineUsers();
    sendToAllClients(JSON.stringify(messageData), ws);
}

function prepareMessage(messageObj) {
    let data = {};
    const receivedData = JSON.parse(messageObj);
    if (receivedData.login && receivedData.username) {
        const username = receivedData.username;

        const msgToSend = `${username} has joined`;

        data = { username: username, message: msgToSend, type: 'login' };
        
    } else if (receivedData.body) {
        data = { message: receivedData.body, type: 'chat' };
    }
    return data;
}

function onlineUsers() {
    return clients.map(client => client.username);
}

function sendToAllClients(message, excludeClient) {
    clients.forEach(client => {
        if (client !== excludeClient) {
            client.send(message);
        }
    });
}

function handleClose(ws) {
    const index = clients.indexOf(ws);
    if (index !== -1) {
        clients.splice(index, 1);
    }
    const msgToSend = `${ws.username} has been disconnected`;
    const data = { type: 'logout', message: msgToSend, online: onlineUsers() };
    sendToAllClients(JSON.stringify(data), ws);
}

console.log("server run on port 4000");

const WebSocket = require('ws');

let userIds = 0;
const clients = [];
const server = new WebSocket.Server({ port: 4000 });

server.on('connection', (ws) => {
    connected(ws);
    // clients.push(ws);
    ws.on('message', (message) => {
        handle(ws, message);
    });
    ws.on('close', () => {
        handleClose(ws);
    });
});

function connected(ws) {
    userIds++;
    ws.id = userIds;
    clients.push(ws);
    const data = { online: onlineUsers() };
    clients.forEach(client => {
            client.send(JSON.stringify(data));
        
    });
    
}

function handle(ws, message) {
    let messageData = prepareMessage(message,ws);
    if (messageData.username) {
        ws.username = messageData.username;

        clients.forEach(client => {
            client.send(JSON.stringify({ online: onlineUsers() }));
        
    });
    }else if (messageData.to_user){
        clients.forEach(client => {
            if (client.id == messageData.to_user) {
                client.send(JSON.stringify(messageData));
            }
        });


    }else{
        messageData.online = onlineUsers();
        sendToAllClients(JSON.stringify(messageData), ws);
    }

}

function prepareMessage(messageObj,ws) {
    let data = {};
    const receivedData = JSON.parse(messageObj);
    if (receivedData.login && receivedData.username) {
        const username = receivedData.username;

        const msgToSend = `${username} has joined`;

        data = { username: username, message: msgToSend, type: 'login' };
        
    }else if (receivedData.private) {
        data = { message: receivedData.body, type: 'private', from_user:ws.id, to_user: receivedData.to_user};
    
    } else if (receivedData.body) {
        data = { message: receivedData.body, type: 'chat' };

    }
    return data;
}

function onlineUsers() {
    return clients.map(client => { return {"username": client.username, "id": client.id}; });
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

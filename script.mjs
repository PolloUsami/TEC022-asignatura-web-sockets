import express from "express";
import expressWs from "express-ws";
import { join } from "path";
import { clients, messages } from "./service.js";


// Express + WebSocket
const appWs = expressWs(express()).app;

// Archivos estaticos de la app.
appWs.use(express.static(join(process.cwd(), "public")));


let messageIndex = 1;

// Conexion con los websockets.
appWs.ws("/ws", (ws, req) => {
    const username = String(req.query.username).toLowerCase();
    
    if(!/[a-zA-Z]+/i.test(username)) {
        ws.send(JSON.stringify({
            type: "sys/alert",
            data: "Usuario invalido.",
        }));
        ws.close();
        return;
    }
    
    
    ws.username = username; // Lo almacena para acceso futuro.
    
    // Comprueba que el cliente no se encuentre conectado.
    if(clients.has(username) && clients.get(username).readyState < WebSocket.CLOSING) {
        ws.send(JSON.stringify({
            type: 'sys/alert',
            data: "Usuario ya conectado.",
        }))
        ws.close();
        return;
    }
    
    let pingTask = null;
    
    // Cuando un cliente se conecta se le envia toda la lista de mensajes pasados.
    ws.send(JSON.stringify({
        type: 'chat/full',
        data: messages
    }));
    
    pingTask = setInterval(() => {
        ws.send(JSON.stringify({
            type: "sys/ping",
            data: null,
        }));
    }, 10 * 1000);
        
    
    // Elimina la referencia al cliente del sv.
    ws.onclose = () => {
        clients.delete(username);
        
        if(pingTask !== null) {
            clearInterval(pingTask);
        }
    };
    
    ws.onmessage = (event) => {
        const username = event.target.username;
        const content = String(event.data);
        
        // Muestra los mensajes en la consola.
        console.log(`[${username}]: ` + content);
        
        const message = {
            id: messageIndex++,
            content,
            username,
        };
        
        messages.push(message);
        
        clients.forEach(client => {
            client.send(JSON.stringify({
                type: "chat/entry",
                data: message,
            }))
        });
        
    }
    
    
    clients.set(username, ws);
    
});



appWs.listen(3000, ()=> {
    console.log(`Servicio iniciado.`);
    console.log(`http://cnu.edu.ni:3000/`);
    
});

// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

/**
 * Nodejs Modules
 */
// https://nodejs.org/api/modules.html#modules_modules

const fs = require('fs');
const url = require('url');
const path = require('path');
const http = require('http');
const webSocketServer = require('websocket').server;

/**
 * Global variables
 */

// Hostname and port where we'll run the websocket server
const hostname = process.argv[2] || '0.0.0.0';
const port = process.argv[3] || 8080;

// latest 100 messages
let history = [];
// list of currently connected clients (users)
let indexOfClient = 0;
let clientsMap = new Map();
// Array with some colors
const colors = ['red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange'];
// ... in random order
colors.sort(function (a, b) {
    return Math.random() > 0.5;
});

/**
 * handles HTTP request (when client connects to the server for the first time via browser)
 */

const requestHandler = (request, response) => {
    if (request.method === 'POST') {        // for image sending
        console.log((new Date()) + "POST Request - start.");
        let imageBody = '';
        request.on('data', function (data) {
            imageBody += data;
            console.log((new Date()) + "POST Request: Body part of image data.");
        });
        request.on('end', function () {
            //console.log("Body: " + body);
            console.log((new Date()) + "POST Request: End of image data.");

            // broadcast message to all connected clients
            const json = JSON.stringify({type: 'image', data: imageBody});
            for (let [key, value] of clientsMap) {
                value.fd.sendUTF(json);
            }
        });

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end('post received');
        return;
    }

    // Parse the request containing file name
    const pathname = url.parse(request.url).pathname;
    // based on the URL path, extract the file extension. e.g. .js, .doc, ...
    const fileExtension = path.parse(pathname).ext;
    // maps file extension to MIME typere
    const map = {
        '.ico': 'image/x-icon',
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword'
    };
    fs.exists("../" + pathname, function (exist) {
        // if the file is not found, return 404
        if (!exist) {
            response.statusCode = 404;
            response.end(`File ${pathname} not found!`);
            return;
        }
        // if a directory search for index file is matching the extension
        // Read the requested file content from file system
        fs.readFile("../" + pathname.substr(1), function (err, data) {
            if (err) {
                // HTTP Status: 500 : INTERNAL SERVER ERROR
                response.statusCode = 500;
                response.end(`Error getting the file: ${err}.`);
            } else {
                //Page found -> HTTP Status: 200 : OK
                response.writeHead(200, {'Content-Type': map[fileExtension] || 'text/plain'});
                // Write the content of the file to response body
                response.write(data.toString(), 'utf-8');
                // Send the response body
                response.end();
            }
        });
    });
};

/**
 * HTTP server
 */

const server = http.createServer(requestHandler);
server.listen(port, hostname, function () {
    console.log((new Date()) + " Server is listening on port " + port);
});

/**
 * WebSocket server
 */

const wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

/**
 * wsServer.on(eventType, listener) - This callback function is called every time someone
 * tries to connect to the WebSocket server
 */

wsServer.on('request', function (request) {
    // new request came
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    const connection = request.accept(null, request.origin);

    // increment indexOfClient and set userId for new client
    const userId = indexOfClient++;

    // add client to array
    clientsMap.set(userId, {id: userId, fd: connection});

    let userName = false;
    let userColor = false;

    console.log((new Date()) + ' Connection accepted. New user\'s id: ' + userId);

    // send back chat history
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify({type: 'history', data: history}));
    }

    // receive message from user
    connection.on('message', function (message) {
        if (message.type === 'utf8') { // accept only utf8 messages
            let json_message = false;
            try {
                json_message = JSON.parse(message.utf8Data);
                if (json_message.type === 'image') {
                    console.log("IMAGE received.");
                    // broadcast message to all connected clients
                    const json = JSON.stringify({type: 'image', data: json_message.data});
                    for (let [key, value] of clientsMap) {
                        value.fd.sendUTF(json);
                    }
                }
                // first message sent by user should be name
                else if (json_message.type === 'clientName') {
                    console.log("NAME received.");
                    // remember user name
                    userName = json_message.data;
                    // get random color and send it back to the user
                    userColor = colors.shift();
                    connection.sendUTF(JSON.stringify({type: 'color', data: userColor}));
                    console.log((new Date()) + ' User is known as: ' + userName + '(' + userId + ') with ' + userColor + ' color.');
                }
                else if (json_message.type === 'chatMessage'){ // log and broadcast the message
                    console.log("CHAT-MESSAGE received.");
                    console.log((new Date()) + ' Received Message from ' + userName + '(' + userId + ') : ' + json_message.data);

                    // we want to keep history of all sent messages
                    const obj = {
                        time: (new Date()).getTime(),
                        text: json_message.data,
                        author: userName,
                        color: userColor
                    };
                    history.push(obj);
                    // slice history so the length won't cross 100 messages
                    history = history.slice(-100);

                    // broadcast message to all connected clients
                    const json = JSON.stringify({type: 'chatMessageOnBroadcast', data: obj});
                    for (let [key, value] of clientsMap) {
                        value.fd.sendUTF(json);
                    }
                }
                else if(json_message.type === 'markers'){
                    console.log('markers received! from ' + userName + ', color ' + userColor);
                    console.log(json_message.data);
                    // broadcast message to all connected clients
                    const json = JSON.stringify({type: 'received_markers', data: json_message.data, color: userColor, user: userName});
                    for (let [key, value] of clientsMap) {
                        console.log(key, value);
                        if(key != userId)
                            value.fd.sendUTF(json);
                    }
                }
                else {
                    console.log('Hmm..., I\'ve never seen JSON like this: ', json_message.data);
                }
            } catch (e) {
                console.log('This doesn\'t look like a valid JSON: ', json_message.data);
            }
        }
        else
            console.log('Not UTF8 message type.');
    });

    // user disconnected
    connection.on('close', function (connection) {
        // close user connection
        if (clientsMap.get(userId) !== undefined) {
            // remove user from the list of connected clients
            clientsMap.delete(userId);
            // push back user's color to be reused by another user
            colors.push(userColor);
            console.log((new Date()) + " Peer with id " + userId + " (" + userName + ") disconnected. " + clientsMap.size + " left.");
        }
    });

});
// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// websocket and http servers
const webSocketServer = require('websocket').server;
const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

// CONFIGURATION
const port = 8080;
const hostname = '0.0.0.0';

/**
 * Global variables
 */
// latest 100 messages
let history = [ ];
// list of currently connected clients (users)
let clients = [ ];

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Array with some colors
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... in random order
colors.sort(function(a,b) { return Math.random() > 0.5; } );

/**
 * handler for HTTP server - first connection with client
 */
const requestHandler = (request, response) => {
    // Parse the request containing file name
    const pathname = url.parse(request.url).pathname;
    // based on the URL path, extract the file extention. e.g. .js, .doc, ...
    const fileExtension = path.parse(pathname).ext;
    // maps file extention to MIME typere
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
                console.log((new Date()) + err);
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
if (!server.listen(port, hostname, function () {
        try {
            console.log((new Date()) + " Server is listening on port " + port);
        }
        catch (err) {
            console.log("Problem with server ip. Check ip configuration.");
            return false;
        }
        return true;
    })) return;

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin);
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;

    console.log((new Date()) + ' Connection accepted.');

    // send back chat history
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }

    // user sent some message
    connection.on('message', function(message) {
        if (message.type === 'utf8') { // accept only text
            if (userName === false) { // first message sent by user is their name
                // remember user name
                userName = htmlEntities(message.utf8Data);
                // get random color and send it back to the user
                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({ type:'color', data: userColor }));
                console.log((new Date()) + ' User is known as: ' + userName
                    + ' with ' + userColor + ' color.');

            } else { // log and broadcast the message
                console.log((new Date()) + ' Received Message from '
                    + userName + ': ' + message.utf8Data);

                // we want to keep history of all sent messages
                var obj = {
                    time: (new Date()).getTime(),
                    text: htmlEntities(message.utf8Data),
                    author: userName,
                    color: userColor
                };
                history.push(obj);
                history = history.slice(-100);

                // broadcast message to all connected clients
                var json = JSON.stringify({ type:'message', data: obj });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
            }
        }
    });

    // user disconnected
    connection.on('close', function(connection) {
        if (userName !== false && userColor !== false) {
            console.log((new Date()) + " Peer "
                + connection.remoteAddress + " disconnected.");
            // remove user from the list of connected clients
            clients.splice(index, 1);
            // push back user's color to be reused by another user
            colors.push(userColor);
        }
    });

});
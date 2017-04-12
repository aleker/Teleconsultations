var connection = false;
const imageWidth = 300;

$(function () {
    "use strict";

    $('#container').draggable();
    /**    // $( "#uploaded_image" ).draggable({
    //     containment: "#container", scroll: true});
     * Global variables
     */

    let chat = {
        window : $('#chat-window'),
        input : $('#chat-input'),
        status : $('#chat-status')
    };

    let thisUser = {
        name : false,       // name sent to the server
        color : false       // color assigned by the server
    };

    /**
     * Socket settings
     */

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    // if browser doesn't support WebSocket, just show some notification and exit
    if (!window.WebSocket) {
        chat.window.html($('<p>', { text: 'Sorry, but your browser doesn\'t support WebSockets.'} ));
        chat.input.hide();
        $('span').hide();
        return;
    }

    // open connection
    const server_host_port = window.location.host;
    console.log("Connecting to host: " + server_host_port);
    connection = new WebSocket('ws://' + server_host_port);

    /**
     * Connection listeners. Receive message from server and handle errors.
     */

    connection.onopen = function () {
        // first we want users to enter their names
        chat.input.removeAttr('disabled');
        chat.status.text('Choose name:');
    };

    connection.onerror = function (error) {
        // just in there were some problems with connection...
        chat.window.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
        + 'connection or the server is down.' } ));
    };

    // most important part - incoming messages
    connection.onmessage = function (message) {
        // try to parse JSON message. Because we know that the server always returns
        // JSON this should work without any problem but we should make sure that
        // the massage is not chunked or otherwise damaged.
        let json_message = false;
        try {
            json_message = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }

        // NOTE: if you're not sure about the JSON structure
        // check the server source code above
        if (json_message.type === 'color') { // first response from the server with user's color
            thisUser.color = json_message.data;
            chat.status.text(thisUser.name + ': ').css('color', thisUser.color);
            chat.input.removeAttr('disabled').focus();
            // from now user can start sending messages
        }
        else if (json_message.type === 'history') { // entire message history
            // insert every single message to the chat window
            for (let i=0; i < json_message.data.length; i++) {
                addMessage(json_message.data[i].author, json_message.data[i].text,
                    json_message.data[i].color, new Date(json_message.data[i].time));
            }
        }
        else if (json_message.type === 'chatMessageOnBroadcast') { // it's a single message
            chat.input.removeAttr('disabled').focus(); // let the user write another message
            addMessage(json_message.data.author, json_message.data.text,
                json_message.data.color, new Date(json_message.data.time));
        }
        else if (json_message.type === 'image') {
            $('#uploaded_image')
                .attr('src', json_message.data)
                .width(imageWidth);
        }
        else {
            console.log('Hmm..., I\'ve never seen JSON like this: ', json_message);
        }
    };

    /**
     * Send mesage when user presses Enter key in chat_input
     */

    chat.input.keydown(function(e) {
        if (e.keyCode === 13) {
            let msg = $(this).val();
            if (!msg) {
                return;
            }

            let jsonType = false;
            // we know that the first message sent from a user their name
            if (thisUser.name === false) {
                thisUser.name = msg;
                jsonType = 'clientName';
            }
            else jsonType = 'chatMessage';

            const json = JSON.stringify({type: jsonType, data: msg});

            // send the message as an ordinary text
            connection.send(json);
            $(this).val('');
            // disable the input field to make the user wait until server
            // sends back response
            chat.input.attr('disabled', 'disabled');
        }
    });

    /**
     * This method is optional. If the server wasn't able to respond to the
     * in 3 seconds then show some error message to notify the user that
     * something is wrong.
     */

    setInterval(function() {
        if (connection.readyState !== 1) {
            chat.status.text('Error');
            chat.input.attr('disabled', 'disabled').val('Unable to comminucate '
                + 'with the WebSocket server.');
        }
    }, 3000);

    /**
     * Add message to the chat window
     */

    function addMessage(author, message, color, dt) {
        chat.window.prepend('<p><span style="color:' + color + '">' + author + '</span> @ ' +
            + (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'
            + (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())
            + ': ' + message + '</p>');
    }
});


/**
 * Upload image and send it to server
 */

function readURL(input) {
    if (input.files && input.files[0]) {
        let reader = new FileReader();
        reader.onload = function (e) {
            $('#uploaded_image')
                .attr('src', e.target.result)
                .width(imageWidth);
            // sending to server
            const toSend = this.result;

            // --- SENDING IMAGE TO SERVER ---
            let request = new AJAX_image(toSend, "");
            request.init();
            request.send();
            // ---

        };
        reader.readAsDataURL(input.files[0]);
    }
}

/**
 * Sending image to server using HTTP connection
 */

var imageOffset_x = 0;
var imageOffset_y = 0;

function onZoom()
{
    var mouseInFrame_x = event.x;
    var mouseinFrame_y = event.y;
    var mouseInImage_x = imageOffset_x + mouseInFrame_x;
    var mouseInImage_y = imageOffset_y + mouseinFrame_y;
    imageOffset_x += mouseInImage_x * 0.16;
    imageOffset_y += mouseInImage_y * 0.16;

    var image = $('#uploaded_image');
    var imageWidth = image.width();
    var imageHeight = image.height();

    image.css({
        height: imageHeight * 1.2,
        width: imageWidth * 1.2,
        left: -imageOffset_x,
        top: -imageOffset_y
    });
}

function onRightClick() {
    imageOffset_x = 0;
    imageOffset_y = 0;

    $('#container img').css({
        height: 600,
        width: 400,
        left: 0,
        top: 0
    });

    return false;
}

let AJAX_image = function(data, name) {
    this.server = false;
    this.url = window.location.protocol + "//" + window.location.host + name;
    this.method = 'POST';
    this.dataType = 'text/html';
    this.async = true;
    this.data = data;

    this.init = function () {
        this.server = new XMLHttpRequest();

        //Open first, before setting the request headers.
        this.server.open(this.method, this.url, this.async);
        // this.server.setRequestHeader('Content-length', this.data.length);
        console.log("XMLHttpRequest created.");
        return true;
    };

    this.send = function () {
        if (this.init()) {
            this.server.send(this.data);
        }
    }
};




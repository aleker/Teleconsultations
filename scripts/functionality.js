let connection = false;
let imageWithMarkers = false;
let thumbnail = new function() {
    this.imageCounter = 0;
    this.currentlyChosen = false;
};

let thisUser = {
    name : false,       // name sent to the server
    color : false,       // color assigned by the server
    id : false
};

$(function () {
    "use strict";

    /**
     * Global variables
     */

    let chat = {
        window : $('#chat-window'),
        input : $('.chat-input'),
        status : $('.chat-status')
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
    connection = new WebSocket('wss://' + server_host_port);

    /**
     * Connection listeners. Receive message from server and handle errors.
     */

    connection.onopen = function () {
        // first we want users to enter their names
        chat.input.removeAttr('disabled').focus();
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
        if (json_message.type === 'color_id') { // first response from the server with user's color
            thisUser.color = json_message.data;
            thisUser.id = json_message.id;
            chat.status.text(thisUser.name + ': ').css('color', thisUser.color);
            chat.input.removeAttr('disabled').focus();
            $('#loginPanel').hide();
            $('#application').show();
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
            console.log("IMAGE RECEIVED.");
            const newImageId = createImageContainer(json_message.imageData, json_message.filters, json_message.brightness);
            markers_array[newImageId] = json_message.markers;
            changeSlider(json_message.brightness);
            sendToPython(newImageId);
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
 * Upload image
 */

function readURL(input) {
    if (input.files && input.files[0]) {
        let reader = new FileReader();
        reader.onload = function (e) {
            createImageContainer(e.target.result, false, false);
        };
        reader.readAsDataURL(input.files[0]);
    }
}

/**
 * Create new 'div' and 'img' for uploaded file
 */
function createImageContainer(imgData, filters, imageBrightness) {
    console.log("Creating image container.");
    const newThumbnail = document.createElement("div");
    newThumbnail.setAttribute("class", "thumbnail");

    const newImage = document.createElement("img");
    newImage.setAttribute("src", imgData);
    newImage.setAttribute("class", "hover-shadow cursor");
    const id_name = "thumbnail_img_" + (thumbnail.imageCounter++).toString();
    newImage.setAttribute("id", id_name);
    newImage.setAttribute("onclick", 'changeChosenImageByClick(this)');

    const newRemoveImageButton = document.createElement("button");
    newRemoveImageButton.setAttribute("class", "remove_thumbnail_button");
    newRemoveImageButton.setAttribute("onclick", 'removeImageFromList(this)');
    newRemoveImageButton.textContent = 'Remove from list';
    newThumbnail.appendChild(newRemoveImageButton);

    newThumbnail.appendChild(newImage);
    document.getElementById("thumbnail_container").appendChild(newThumbnail);

    let json_obj = {};
    json_obj.filters = ['none'];
    json_obj.brightness = 100;
    if (filters !== false) { json_obj.filters = filters; }
    if (imageBrightness !== false) { json_obj.brightness = imageBrightness; }
    json_obj.original_img = imgData;
    thumbnails_filters[id_name] = json_obj;

    return id_name;
}

function currentlyChosenImageIdHandler(value) {
    thumbnail.currentlyChosen = value;
    if (value === false) $('#sendImageButton').attr('disabled', 'disabled');
    else $('#sendImageButton').removeAttr('disabled');
}

/**
 * Send image data to server
 */

function sendImageToServer() {
    sendConfirmationMessage();
    const thumbnail_to_send = thumbnail.currentlyChosen;
    if (thumbnail_to_send !== false) {
        /** ORIGINAL IMAGE DATA: */
        const image_data = thumbnails_filters[thumbnail_to_send].original_img;
        const selectedFilters = thumbnails_filters[thumbnail_to_send].filters;
        const brightness = thumbnails_filters[thumbnail_to_send].brightness;
        exportMarkersFromImage();

        /** IMAGE DATA FROM THUMBNAIL: */
        //const image_data = document.getElementById(thumbnail.currentlyChosen).src;

        /** IMAGE DATA FROM MAIN CANVAS: */
        // let image_data = $('#uploaded_image').css('background-image');
        // image_data = image_data.replace('url(','').replace(')','').replace(/\"/gi, "");

        let request = new ImageSender(image_data, selectedFilters, brightness, "");
        request.send();
    }
}

/**
 * Sending image to server using HTTP connection
 */

let ImageSender = function(data, selectedFilters, brightness, name) {
    this.server = false;
    this.url = window.location.protocol + "//" + window.location.host + name;
    this.method = 'POST';
    this.dataType = 'text/html';
    this.async = true;

    let actualMarkers = false;
    if (thumbnail.currentlyChosen in markers_array) {
        actualMarkers = markers_array[thumbnail.currentlyChosen];
    }
    console.log("Applied filters to send to server: " + selectedFilters);
    console.log("Applied markers count to send to server: " + actualMarkers.length);


    this.data = JSON.stringify({
        type: 'imageFromClient',
        filters: selectedFilters,
        clientsId : thisUser.id,
        markers: actualMarkers,
        brightness: brightness,
        imageData: data
    });

    this.init = function () {
        this.server = new XMLHttpRequest();

        //Open first, before setting the request headers.
        this.server.open(this.method, this.url, this.async);
        // this.server.setRequestHeader('Content-length', this.data.length);
        console.log("XMLHttpRequest created. Ready to send image.");
        return true;
    };
    this.send = function () {
        if (this.init()) {
            this.server.send(this.data);
        }
    }
};

function changeChosenImageByClick(image) {
    let img_object = thumbnails_filters[image.id];
    changeCheckBoxes(img_object.filters);
    changeSlider(img_object.brightness);
    exportMarkersFromImage();
    currentlyChosenImageIdHandler(image.id);
    $('#uploaded_image').attr('src', image.src);
    refreshMarkerImageAndMarkers();
}

function removeImageById(imageId) {
    if (imageId === thumbnail.currentlyChosen) {
        $('#uploaded_image').attr('src', "");
        imageWithMarkers.imgNotes("destroy");
        imageWithMarkers = false;
        currentlyChosenImageIdHandler(false);
    }
    $(document.getElementById(imageId)).closest('div').remove();
    // Removing the image structure from the dictionary
    delete thumbnails_filters[imageId];
}

function removeImageFromList(button) {
    let imageId = $(button).closest('div').find('img').attr('id');
    removeImageById(imageId);
    if (imageId in markers_array)
        delete markers_array[imageId];
}

function changeCheckBoxes(applied_filters) {
    $('input[type=checkbox]').each(function () {
        if(applied_filters.includes(this.value))
            $(this).prop('checked', true);
        else
            $(this).prop('checked', false);
    });
}
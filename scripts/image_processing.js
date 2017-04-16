$(function() {

    wheelzoom(document.querySelector('img.zoom'));

    const params={
        // scroll will be used to zoom in and out
        wheelRotate: false,
    // other params:
    //    angle: the starting rotation for the element (default 0 degrees)
    //    rotationCenterX, rotationCenterY: position about which the element will be rotated
    };


    // Prepare extra handles
    let nw = $("<div>", {
        class: "ui-rotatable-handle"
    });
    let ne = nw.clone();
    let se = nw.clone();

    // Assign Rotatable
    $('.box').resizable().rotatable(params);
    // Assign coordinate classes to handles
    $('.box div.ui-rotatable-handle').addClass("ui-rotatable-handle-ne");
    nw.addClass("ui-rotatable-handle-nw");
    ne.addClass("ui-rotatable-handle-ne");
    se.addClass("ui-rotatable-handle-se");
    // Assign handles to box
    // $(".box").append(nw, ne, se);
    // Assigning bindings for rotation event
    $(".box div[class*='ui-rotatable-handle-']").bind("mousedown", function(e) {
        $('.box').rotatable("instance").startRotate(e);
    });
});


// PYTHON

function sendToPython() {
    $.ajax({
        type: "GET",
        url: "http://localhost:9999",
        success: function(response) {
            document.getElementById("python-response").innerHTML = response;
        }
    });
}


// MARKERS
function addMarkerDefault(){
    addSingleMarker('100px', '100px', 'blue', 'you', 'text');
}

function addSingleMarker(left, top, color, userName, markerText) {
    let div = document.createElement('div');
    let id = 'marker_' + String($('.marker').length);
    div.textContent = userName + ' : ' + markerText;
    div.className = 'marker';
    div.id = id;
    div.style.left = left;
    div.style.top = top;
    div.style.color = color;
    // document.body.appendChild(div);
    document.getElementById('container').appendChild(div);
    $('.marker').draggable();

}

function sendMarkers() {
    // Add all current marker's positions to an array - id, left and top
    let markers = [];
    $('.marker').each(function (index, obj) {
        console.log(index, obj.id);
        markers.push({id:obj.id, left: String(obj.style.left), top: String(obj.style.top), text: obj.textContent});
    });
    // Send the information about the markers
    const json = JSON.stringify({type: 'markers', data: markers});
    connection.send(json);
}

function addMarkers(markers_json) {
    // Adding all new markers
    let color = markers_json['color'];
    let user = markers_json['user'];
    let arr = markers_json.data;
    for (let i = 0; i < arr.length; i++){
        addSingleMarker(arr[i].left, arr[i].top, color, user, arr[i].text);
    }

}


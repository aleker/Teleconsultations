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

function sendToPython() {
    $.ajax({
        type: "GET",
        url: "http://localhost:9999",
        success: function(response) {
            document.getElementById("python-response").innerHTML = response;
        }
    });
}
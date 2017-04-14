$(function() {

    function createImageOnCanvas(imageId) {
        canvas.style.display = "block";
        document.getElementById("images").style.overflowY = "hidden";
        var img = new Image(300, 300);
        img.src = document.getElementById(imageId).src;
        context.drawImage(img, (0), (0)); //onload....
    }

    wheelzoom(document.querySelector('img.zoom'));

    const params={
        // scroll will be used to zoom in and out
        wheelRotate: false,
    // other params:
    //    angle: the starting rotation for the element (default 0 degrees)
    //    rotationCenterX, rotationCenterY: position about which the element will be rotated
    };


    // Prepare extra handles
    var nw = $("<div>", {
        class: "ui-rotatable-handle"
    });
    var ne = nw.clone();
    var se = nw.clone();
    /*
     You can also combine this plugin with the jQuery UI built-in resizable() and draggable(), although the latter works best when applied to a container with the rotatable inside it. See the Demo page for some examples.
     */
    // Assign Draggable
    // $('.box-wrapper').draggable({
    //     cancel: ".ui-rotatable-handle"
    // });
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


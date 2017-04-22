$(function() {

    wheelzoom(document.querySelector('img.zoom'));

    const params = {
        // scroll will be used to zoom in and out
        wheelRotate: false,
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
    $('.box div.ui-rotatable-handle').addClass("ui-rotatable-handle-sw");
    nw.addClass("ui-rotatable-handle-nw");
    ne.addClass("ui-rotatable-handle-ne");
    se.addClass("ui-rotatable-handle-se");
    // Assign handles to box
    $(".box").append(nw, ne, se);
    // Assigning bindings for rotation event
    $(".box div[class*='ui-rotatable-handle-']").bind("mousedown", function (e) {
        $('.box').rotatable("instance").startRotate(e);
    });
});


// PYTHON
function sendToPython() {
    // TODO DIFFERENT IMAGE PROCESSING METHODS
    // get currently chosen thumbnail
    const thumbnail_to_rewrite = thumbnail.currentlyChosen;
    console.log(thumbnail_to_rewrite);
    let image_data = $('#uploaded_image').css('background-image');
    //console.log(image_data);
    image_data = image_data.replace('url(','').replace(')','').replace(/\"/gi, "");

    let selected = [];
    $('#python_container input:checked').each(function() {
        selected.push($(this).attr('value'));
    });


    let json_data = {'type': selected, 'image': image_data};
    $.ajax({
        type: "POST",
        url: "http://localhost:9000",
        data: json_data,
        success: function (response) {
            $('#uploaded_image')
                .attr('src', response.data);
            $('#' + thumbnail_to_rewrite)
                .attr('src', response.data);
            thumbnails_filters[thumbnail_to_rewrite] = selected;
        }
    });

}




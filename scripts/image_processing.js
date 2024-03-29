let thumbnails_filters = {};
let markers_array = {};
$(function() {
    $(' #python_container input').on('click', function(){
        sendToPython(thumbnail.currentlyChosen);
    });

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
function sendToPython(imageId) {
    exportMarkersFromImage();
    const currentlyChosenId = thumbnail.currentlyChosen;
    thumbnails_filters[imageId].brightness = $('input[name=slide]').val();

    let currentFilters = ['none'];
    /** if currently chosen image is the one we want to filter - read filters from checkboxes */
    if (currentlyChosenId === imageId) {
        $('#python_container input:checked').each(function () {
            currentFilters.push($(this).attr('value'));
        });
    }
    /** in other case when image we want to filter is not the current chosen image - read filters from thumbnails_filters */
    else currentFilters = thumbnails_filters[imageId].filters;
    console.log("Applied filters to send to Python: " + currentFilters);

    let json_data = {'type': currentFilters, 'image': thumbnails_filters[imageId].original_img, 'brightness': thumbnails_filters[imageId].brightness};

    console.log("https://" +  window.location.hostname+ ":" + python_port + "/");
    $.ajax({
        type: "POST",
        url: "https://" +  window.location.hostname + ":" + python_port + "/",
        data: json_data,
        success: function (response) {
            $('#' + imageId).attr('src', response.data);
            thumbnails_filters[imageId].filters = currentFilters;
            /** if currently chosen image is the one we filtered - also change image on canvas */
            if (currentlyChosenId === imageId) {
                $('#uploaded_image').attr('src', response.data);
                refreshMarkerImageAndMarkers();
            }
        }
    });
}

/**
 * MARKERS HANDLER
 */

/**from urlparse import parse_qs this function reads notes from json and adds them to imageWithMarkers */
function importMarkers(jsonMarkers) {
    if (jsonMarkers !== false && jsonMarkers.length > 0) {
        imageWithMarkers.imgNotes("import", jsonMarkers);
        console.log("Markers imported for: " + thumbnail.currentlyChosen + ". Count: " + jsonMarkers.length);
    }
}

/** this function exports actual markers */
function exportMarkersFromImage() {
    if (imageWithMarkers !== false) {
        markers_array[thumbnail.currentlyChosen] = imageWithMarkers.imgNotes('export');
        console.log("Markers exported for: " + thumbnail.currentlyChosen + ". Count: " + markers_array[thumbnail.currentlyChosen].length);
    }
}

/** this function turns off and on marker plugin (useful when image change) */
function refreshMarkerImageAndMarkers() {
    console.log("Refreshing image markers.");
    if (imageWithMarkers !== false) {
        imageWithMarkers.imgNotes("destroy");
    }
    imageWithMarkers = $("#uploaded_image").imgNotes({
        onShow: $.noop,
        onAdd: function () {
            this.options.vAll = "bottom";
            this.options.hAll = "middle";
            const elem = $(document.createElement('span')).addClass("marker black").html(this.noteCount).attr("title", "");
            const self = this;
            $(elem).tooltip({
                content: function () {
                    return $(elem).data("note");
                }
            });
            return elem;
        }
    });
    imageWithMarkers.imgNotes("option", "canEdit", true);
    if (thumbnail.currentlyChosen in markers_array) {
        console.log("Old markers imported for: " + thumbnail.currentlyChosen + ' if not empty: ');

        importMarkers(markers_array[thumbnail.currentlyChosen]);
    }
}

function updateSlider() {
    sendToPython(thumbnail.currentlyChosen);
}

/**
 * Changes the brightness slider automatically after receiving a new image.
 * @param brightness Current brightness level.
 */
function changeSlider(brightness) {
    $('input[type=hidden]').val(brightness);
    $('input[name=slide]').val(brightness);
}

/**
 * Displaying a message bubble that confirms sending the image.
 */
function sendConfirmationMessage(){
    console.log('sendCOnf');
    $('.messageBubble').css("visibility", "visible");
    $('.messageBubble').css("opacity", "100");
    $('.messageBubble').fadeTo( 3000, 0, function () {
        $('.messageBubble').css("visibility", "hidden");
    });

}
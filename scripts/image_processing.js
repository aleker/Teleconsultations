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
    // TODO DIFFERENT IMAGE PROCESSING METHODS
    // get id of currently chosen thumbnail:
    const currentlyChosenId = thumbnail.currentlyChosen;
    thumbnails_filters[imageId].brightness = $('input[name=slide]').val();

    // TODO remove unused code:
    // let image_data = $('#uploaded_image').css('background-image');
    // //console.log(image_data);
    // image_data = image_data.replace('url(','').replace(')','').replace(/\"/gi, "");

    let currentFilters = ['none'];
    /** if currently chosen image is the one we want to filter - read filters from checkboxes */
    if (currentlyChosenId === imageId) {
        $('#python_container input:checked').each(function () {
            currentFilters.push($(this).attr('value'));
        });
    }
    /** in other case when image we want to filter is not the current chosen image - read filters from thumbnails_filters */
    else currentFilters = thumbnails_filters[imageId].filters;

    let json_data = {'type': currentFilters, 'image': thumbnails_filters[imageId].original_img, 'brightness': thumbnails_filters[imageId].brightness};

    $.ajax({
        type: "POST",
        url: "http://localhost:9000",
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


/** this function reads notes from json and adds them to imageWithMarkers */
function importMarkers(jsonMarkers) {
    if (jsonMarkers !== false && jsonMarkers.length > 0) {
    imageWithMarkers.imgNotes("import", jsonMarkers);
    }
}

/** this function exports actual markers */
function exportMarkersFromImage() {
    if (imageWithMarkers !== false) {
        markers_array[thumbnail.currentlyChosen] = imageWithMarkers.imgNotes('export');
        console.log(thumbnail.currentlyChosen + ' exported');
    }
}

/** this function turns off and on marker plugin (useful when image change) */
function refreshMarkerImageAndMarkers() {
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
    if (thumbnail.currentlyChosen in markers_array)
        importMarkers(markers_array[thumbnail.currentlyChosen]);
}


function updateSlider() {
    sendToPython(thumbnail.currentlyChosen);
}


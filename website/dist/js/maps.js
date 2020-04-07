
map = {
    apiReady: false,
    bounds: null,
    places: null,
    centerPlace: null,
    center: null,
    progress: 0,
    error: null,
};
function onMapApiReady() {
    map.apiReady = true;
}
function setCenterPlace(place) {
    map.centerPlace = place;
    setCenter(place.geometry);
}
function setCenter(geometry) {
    map.center = geometry;
}

function locateMe() {
    if (navigator.geolocation) {
        map.progress++;
        navigator.geolocation.getCurrentPosition(onLocateSuccess, onLocateFail);
    }
}
function onLocateSuccess(position) {
    map.progress--;
    setCenter({
        location: new google.maps.LatLng(position.coords.latitude, position.coords.longitude)
    })
}
function onLocateFail(err) {
    map.progress--;
    console.error(err);
}

var refreshTimer = null;
function refreshPlaces() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(refreshPlacesNow, 500);
}
function refreshPlacesNow() {
    map.progress++;
    $.ajax({
        url: serviceUrl + "/get-test-locations",
        data: {
            northEast: map.bounds.getNorthEast().toJSON(),
            southWest: map.bounds.getSouthWest().toJSON(),
            myLocation: map.center.location.toJSON()
        },
        dataType: "json",
        success: function(result) {
            map.places = result.sort(function(a,b) {return a.distance-b.distance});
        },
        error: function(xhr, textStatus, errorThrown) {
            map.error = {message: xhr.responseText || errorThrown || textStatus};
        },
        complete: function() {
            map.progress--;
        }
    })
}

addLocationDialog = {
    visible: false
}

discussionDialog = {
    place: null,
    visible: false
}
function joinDiscussion(place) {
    discussionDialog.place = place;
    discussionDialog.visible = true;
}
function showDirections(place) {
    window.open("https://www.google.com/maps/dir/?api=1&destination=" + place.lat + "," + place.lng, "_blank");
}

inputLocationDialog = {
    place: null,
    visible: false
}
function showInputLocationDialog(place) {
    if (!place) return alert("Please use the Search bar to locate the test location first.  You can search using the place name, such as the name of the hospital, a street address, or an intersection.");
    inputLocationDialog.place = place;
    inputLocationDialog.visible = true;
}
function onLocationAdded() {
    inputLocationDialog.place = null;
    refreshPlacesNow();
}

embedDialog = {
    visible: false
}
function showEmbedDialog() {
    embedDialog.visible = true;
}

contactUsDialog = {
    visible: false
}
function showContactUsDialog() {
    contactUsDialog.visible = true;
}

instructionsDialog = {
    place: null,
    visible: false
}
function showInstructions(place) {
    instructionsDialog.place = place;
    instructionsDialog.visible = true;
}

function startup() {
    if (queryString.co) {
        var coords = queryString.co.split(",");
        setCenter({
            location: new google.maps.LatLng(coords[0], coords[1]),
            viewport: new google.maps.LatLngBounds(
                new google.maps.LatLng(coords[2], coords[3]),
                new google.maps.LatLng(coords[4], coords[5])
            )
        })
    }
    else {
        setCenter({
            location: new google.maps.LatLng(37.09024, -95.712891),
            viewport: new google.maps.LatLngBounds(
                new google.maps.LatLng(5.100253434039721, -143.16576293945312),
                new google.maps.LatLng(61.52715099213155, -48.164237060546874)
            )
        })
    }
}

function shareTwitter() {
    var url = "https://twitter.com/intent/tweet?url=" + encodeURIComponent(getUrlForSharing()) + "&text=" + encodeURIComponent("COVID-19 Testing Locations");
    window.open(url, "_blank");
}
function shareFacebook() {
    FB.ui({method: "share", href: getUrlForSharing()}, function() {});
}
function getUrlForSharing(embed) {
    var base = embed ? (location.protocol + "//" + location.host + "/embedded.html") : location.href.split("?")[0];
    if (map.center) {
        var viewport = map.bounds.toJSON();
        var coords = [
            map.center.location.lat(),
            map.center.location.lng(),
            viewport.south,
            viewport.west,
            viewport.north,
            viewport.east
        ];
        return base + "?co=" + coords.join(",");
    }
    else return base;
}

tags = null;
tagMap = null;
$.get(serviceUrl + "/get-tags", function(result) {
    tags = result;
    tagMap = {};
    for (var i=0; i<tags.length; i++) tagMap[tags[i].id] = tags[i].name;
})

function printDistance(meters, abbreviateUnit) {
    var miles = meters / 1609.34;
    if (miles > 150) return "";
    return Number(miles).toFixed(1) + (abbreviateUnit ? " mi" : " miles");
}

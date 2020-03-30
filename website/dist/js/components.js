
function NavBar() {
}



function MapSearch(viewRoot) {
    this.searchBox = null;
    this.initSearchBox = function(elem) {
        this.searchBox = new google.maps.places.SearchBox(elem);
        this.searchBox.addListener('places_changed', onPlacesChanged.bind(this));
    }
    function onPlacesChanged() {
        var places = this.searchBox.getPlaces();
        if (places.length) $(viewRoot).triggerHandler("place-changed", places[0]);
    }
    this.onLocateMe = function() {
        $(viewRoot).find("input.search-fields").val("");
        $(viewRoot).triggerHandler("locate-me");
    }
}



function TheMap(viewRoot) {
    var map;
    var centerMarker;
    var placeMarkers = {};
    var pinLabels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").reverse();
    var infoWindow;
    this.mapReady = false;
    this.init = function(elem) {
        map = new google.maps.Map(elem, {
            center: new google.maps.LatLng(0, 0),
            zoom: 2,
            fullscreenControl: false,
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                position: google.maps.ControlPosition.TOP_RIGHT
            }
        });
        map.addListener('bounds_changed', function() {
            $(viewRoot).triggerHandler("bounds-changed", map.getBounds());
        });
        centerMarker = new google.maps.Marker({
            map: map,
            icon: "/img/azure-pin.png",
        });
        infoWindow = new google.maps.InfoWindow();
        this.mapReady = true;
    }
    this.setCenter = function(place) {
            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
            }
            else {
                map.setCenter(place.geometry.location);
                map.setZoom(12);
            }
            centerMarker.setPosition(place.geometry.location);
    }
    this.setPlaces = function(places) {
        var newMarkers = {};
        places.forEach(function(place) {
            newMarkers[place.id] = placeMarkers[place.id] || newMarker(place);
        })
        for (var id in placeMarkers) {
            if (!newMarkers[id]) {
                placeMarkers[id].setMap(null);
                pinLabels.push(placeMarkers[id].getLabel());
            }
        }
        placeMarkers = newMarkers;
    }
    function newMarker(place) {
        var marker = new google.maps.Marker({
            map: map,
            label: pinLabels.pop(),
            position: new google.maps.LatLng(place.lat, place.lng)
        })
        marker.addListener('click', function() {
            infoWindow.setContent(getInfoWindowContent(place));
            infoWindow.open(map, marker);
        })
        return marker;
    }
    function getInfoWindowContent(place) {
        function joinDiscussion(place) {
            $(viewRoot).triggerHandler("join-discussion", place);
        }
        var div = $("<div>").get(0);
        $("<h6>").text(place.name).appendTo(div);
        if (place.address) $("<div>").text(place.address).appendTo(div);
        if (place.address2) $("<div>").text(place.address2).appendTo(div);
        if (place.city || place.state) $("<div>").text(place.city + (place.city && place.state ? ", " : "") + place.state + " " + place.postalCode).appendTo(div);
        $("<a class='d-block mt-1'>").css({color: "blue", textDecoration: "underline"}).text("Join Discussion").click(joinDiscussion).appendTo(div);
        return div;
    }
}



function LocationDetails(viewRoot) {
    this.showDirections = function(place) {
        window.open("https://www.google.com/maps/dir/?api=1&destination=" + place.lat + "," + place.lng, "_blank");
    }
    this.showDiscussion = function(place) {
        $(viewRoot).triggerHandler('join-discussion', place);
    }
}



function AddLocationDialog() {
    this.showSuccess = false;
    this.submit = function(source, email) {
        if (!source.trim()) return;
        $.ajax({
            method: "POST",
            url: serviceUrl + "/add-user-submission",
            data: JSON.stringify({
                source: source,
                email: email
            }),
            contentType: "application/json",
            success: onSubmitted.bind(this)
        })
    }
    function onSubmitted() {
        this.showSuccess = true;
    }
}



function DiscussionDialog() {
}

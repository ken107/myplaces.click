
function NavBar() {
}



function MapSearch(viewRoot) {
    this.searchBox = null;
    this.initSearchBox = function(elem) {
        this.searchBox = new google.maps.places.SearchBox(elem);
        this.searchBox.addListener('places_changed', onPlacesChanged.bind(this));
    }
    function onPlacesChanged() {
        $(viewRoot).triggerHandler("places-changed", this.searchBox.getPlaces());
    }
    this.onLocateMe = function() {
        $(viewRoot).find("input.search-fields").val("");
        $(viewRoot).triggerHandler("locate-me");
    }
}



function TheMap(viewRoot) {
    var map;
    var marker;
    this.mapReady = false;
    this.init = function(elem) {
        map = new google.maps.Map(elem, {
            center: new google.maps.LatLng(0, 0),
            zoom: 2,
        });
        map.addListener('bounds_changed', function() {
            $(viewRoot).triggerHandler("bounds-changed", map.getBounds());
        });
        marker = new google.maps.Marker({
            map: map,
            anchorPoint: new google.maps.Point(0, 0)
        });
        this.mapReady = true;
    }
    this.setPlaces = function(places) {
        if (places.length) {
            var place = places[0];
            if (place.geometry.viewport) {
                map.fitBounds(place.geometry.viewport);
            }
            else {
                map.setCenter(place.geometry.location);
                map.setZoom(12);
            }
            marker.setPosition(place.geometry.location);
        }
    }
}


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
    this.onSubmit = function() {
        $(viewRoot).triggerHandler("locate-me");
    }
}



function TheMap(viewRoot) {
    var map;
    var markers = [];
    this.mapReady = false;

    this.init = function(elem) {
        map = new google.maps.Map(elem, {
            center: new google.maps.LatLng(0, 0),
            zoom: 2,
            maxZoom: 13,
        });
        map.addListener('bounds_changed', function() {
            $(viewRoot).triggerHandler("bounds-changed", map.getBounds());
        });
        this.mapReady = true;
    }

    this.setPlaces = function(places) {
        // Clear markers
        for (var i=0; i<markers.length; i++) markers[i].setMap(null);
        markers = [];

        if (places.length == 0) return;

        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function(place) {
            if (!place.geometry) {
                console.log("Returned place contains no geometry");
                return;
            }
            var icon = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25)
            };

            // Create a marker for each place.
            markers.push(new google.maps.Marker({
                map: map,
                icon: icon,
                title: place.name,
                position: place.geometry.location
            }));

            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });

        map.fitBounds(bounds);
    }
}

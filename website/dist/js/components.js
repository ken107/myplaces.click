
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
    var self = this;
    var map;
    var centerMarker;
    var placeMarkers = {};
    var infoWindow;
    this.mapReady = false;
    this.init = function(elem) {
        map = new google.maps.Map(elem, {
            fullscreenControl: false,
            gestureHandling: "greedy",
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
            clickable: false,
        });
        infoWindow = new google.maps.InfoWindow();
        this.mapReady = true;
    }
    this.setCenter = function(geometry) {
            if (geometry.viewport) {
                map.fitBounds(geometry.viewport, {top:0, right:0, bottom:0, left:0});
            }
            else {
                map.setCenter(geometry.location);
                map.setZoom(12);
            }
            centerMarker.setPosition(geometry.location);
    }
    this.setPlaces = function(places) {
        var newMarkers = {};
        places.forEach(function(place, index) {
            newMarkers[place.id] = placeMarkers[place.id] || newMarker(place);
            newMarkers[place.id].setLabel("ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(index) || "●");
        })
        for (var id in placeMarkers) {
            if (!newMarkers[id]) {
                placeMarkers[id].setMap(null);
            }
        }
        placeMarkers = newMarkers;
    }
    function newMarker(place) {
        var marker = new google.maps.Marker({
            map: map,
            position: new google.maps.LatLng(place.lat, place.lng),
            icon: {
                url: place.isVerified ? "/img/spotlight-poi-dotless2.png" : "/img/poi-dotless-yellow.png",
                labelOrigin: new google.maps.Point(13, 14),
            },
        })
        marker.addListener('click', function() {
            infoWindow.setContent(getInfoWindowContent(place));
            infoWindow.open(map, marker);
        })
        return marker;
    }
    function getInfoWindowContent(place) {
        function joinDiscussion() {
            $(viewRoot).triggerHandler("join-discussion", place);
        }
        function showDirections() {
            $(viewRoot).triggerHandler("show-directions", place);
        }
        var div = $("<div>").get(0);
        var title = $("<h6>").appendTo(div);
        $("<span>").text(place.name).appendTo(title);
        if (!place.isVerified) $("<small>").text(" (unverified)").appendTo(title);

        if (place.address) $("<div>").text(place.address).appendTo(div);
        if (place.address2) $("<div>").text(place.address2).appendTo(div);
        if (place.city || place.state) $("<div>").text(place.city + (place.city && place.state ? ", " : "") + place.state + " " + place.postalCode).appendTo(div);
        if (self.tagMap && place.tagIds) $("<div class='text-muted font-italic'>").text(place.tagIds.map(function(x) {return self.tagMap[x]}).join(", ")).appendTo(div);

        var buttons = $("<div class='buttons mt-3'>").appendTo(div);
        $('<button type="button" class="btn btn-primary mr-1"><i class="material-icons">directions</i></button>').click(showDirections).appendTo(buttons);
        $('<button type="button" class="btn btn-secondary mr-1"><i class="material-icons">forum</i></button>').click(joinDiscussion).appendTo(buttons);
        if (place.phone) $('<a class="btn btn-success mr-1"><i class="material-icons">local_phone</i></a>').attr('href', 'tel:'+place.phone).appendTo(buttons);

        var source = $("<div class='mt-2 text-muted font-italic'>").appendTo(div);
        $("<span>").text("source: ").appendTo(source);
        $("<a>").attr("target", "_blank").attr("href", place.sourceUrl).text(place.source).css("text-decoration", "underline").appendTo(source);
        return div;
    }
}



function LocationDetails(viewRoot) {
    this.showDirections = function(place) {
        $(viewRoot).triggerHandler('show-directions', place);
    }
    this.showDiscussion = function(place) {
        $(viewRoot).triggerHandler('join-discussion', place);
    }
    this.printTags = function(tagIds, tagMap) {
        if (tagIds && tagMap) return tagIds.map(function(x) {return tagMap[x]}).join(", ");
    }
    this.setPinIcon = function(elem, place) {
        var img = place.isVerified ? "/img/spotlight-poi-dotless2.png" : "/img/poi-dotless-yellow.png";
        $(elem).css("background-image", "url(" + img + ")");
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
    this.showDiscussion = function(frame, place) {
        frame.src = "discuss.html?id=" + place.id + "&title=" + encodeURIComponent(place.name);
    }
}



function InputLocationDialog(viewRoot) {
    this.populate = function(form, place) {
        var addr = {};
        if (place.address_components) for (var comp of place.address_components) for (var type of comp.types) addr[type] = comp.short_name;
        form.name.value = place.name;
        form.address.value = [addr.street_number, addr.route].filter(function(x) {return x}).join(" ");
        form.address2.value = "";
        form.city.value = addr.locality || addr.sublocality || "";
        form.state.value = addr.administrative_area_level_1 || "";
        form.postalCode.value = addr.postal_code || "";
        form.countryCode.value = addr.country || "";
        form.phone.value = "";
        form.lat.value = place.geometry.location.lat();
        form.lng.value = place.geometry.location.lng();
    }
    this.progress = 0;
    this.error = null;
    this.submit = function(form) {
        var data = {
            name: form.name.value,
            address: form.address.value,
            address2: form.address2.value,
            city: form.city.value,
            state: form.state.value,
            postalCode: form.postalCode.value,
            countryCode: form.countryCode.value,
            phone: form.phone.value,
            lat: form.lat.value,
            lng: form.lng.value,
            source: form.source.value,
            sourceUrl: form.sourceUrl.value,
            tagIds: this.tags.filter(function(x) {return form["tag-"+x.id].checked}).map(function(x) {return x.id}),
        };
        if (!data.name) return this.error = {message: "Missing name"};
        if (!data.lat) return this.error = {message: "Missing lat"};
        if (!data.lng) return this.error = {message: "Missing lng"};
        if (!data.source) return this.error = {message: "Missing source"};
        if (!data.sourceUrl) return this.error = {message: "Missing source URL"};
        this.progress++;
        this.error = null;
        $.ajax({
            method: "POST",
            url: serviceUrl + "/add-test-location",
            data: JSON.stringify(data),
            contentType: "application/json",
            success: onSuccess.bind(this),
            error: onError.bind(this),
            complete: onComplete.bind(this)
        })
    }
    function onSuccess() {
        this.visible = false;
        $(viewRoot).triggerHandler("location-added");
    }
    function onError(xhr, textStatus, errorThrown) {
        this.error = {message: xhr.responseText || errorThrown || textStatus};
    }
    function onComplete() {
        this.progress--;
    }
}



function EmbedDialog(viewRoot) {
    this.getCode = function() {
        return "<iframe style='width:500px; height:500px;' src='" + getUrlForSharing(true) + "'></iframe>";
    }
    this.copyCode = function() {
        try {
            $(viewRoot).find("textarea").get(0).select();
            if (!document.execCommand('copy')) throw "fail";
            this.visible = false;
        }
        catch (err) {
            this.error = {message: "Failed, please copy manually"};
        }
    }
}



function ContactUsDialog() {
    this.status = null;
    this.submit = function(email, message) {
        email = email.trim();
        message = message.trim();
        if (!email) return this.status = {type: "ERROR", message: "Missing email"};
        if (!email.match(/^\S+@\S+$/)) return this.status = {type: "ERROR", message: "Invalid email"};
        if (!message) return this.status = {type: "ERROR", message: "Missing message"};
        $.ajax({
            method: "POST",
            url: serviceUrl + "/contact-us",
            data: JSON.stringify({
                email: email,
                message: message
            }),
            contentType: "application/json",
            success: onSuccess.bind(this),
            error: onError.bind(this),
        })
    }
    function onSuccess() {
        this.status = {type: "SUCCESS", message: "We have received your message, thank you."};
    }
    function onError(xhr, textStatus, errorThrown) {
        this.status = {type: "ERROR", message: xhr.responseText || errorThrown || textStatus};
    }
}

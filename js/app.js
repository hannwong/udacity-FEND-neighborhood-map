var app = app || {}

app.Location = function(name, latlng) {
  var self = this;
  self.name = name;
  self.latlng = latlng;
  self.hidden = ko.observable(false);
  self.selected = ko.observable(false);
};

app.mapData = {
  map: {
    latlng: {lat: 1.3688548, lng: 103.9487079},
    zoom: 15
  },
  locations: [
    new app.Location("Downtown East", {lat: 1.376684, lng: 103.954890}),
    new app.Location("Fishing Pond", {lat: 1.371890, lng: 103.952218}),
    new app.Location("Pasir Ris Subway Station", {lat: 1.373435, lng: 103.949450}),
    new app.Location("Pasir Ris Sports Centre", {lat: 1.374428, lng: 103.951986}),
    new app.Location("Pasir Ris Beach", {lat: 1.383931, lng: 103.947114})
  ]
};

app.markers = []; // Array of Google Map markers. TODO: put inside app.Location
app.markerSelected = null; // Google Maps marker
app.locationSelected = null; // index into app.mapData.locations

app.createMarkers = function(map) {
  var markers = app.markers = [];
  for (var i = 0; i < app.mapData.locations.length; i++) {
    var marker = new google.maps.Marker({
      position: app.mapData.locations[i].latlng,
      map: map,
      title: app.mapData.locations[i].name
    });
    markers.push(marker);
  }

  // Use only 1 instance of InfoWindow
  var infoWindow = new google.maps.InfoWindow({
    content: ''
  });

  for (var i = 0; i < markers.length; i++) {
    (function(infoWindow, marker, map, index) {
      marker.addListener('click', function() {
        // Stop animation for last selected marker.
        if (app.markerSelected != null) {
          app.markerSelected.setAnimation(null);
          // Unselect last selected location too.
          app.mapData.locations[app.locationSelected].selected(false);
        }

        if (app.markerSelected == marker) {
          // Unselecting
          app.markerSelected = null;
          app.locationSelected = null;
          infoWindow.close();
        }
        else {
          // Selecting (a new location)
          app.markerSelected = marker;
          marker.setAnimation(google.maps.Animation.BOUNCE);
          app.locationSelected = index;
          app.mapData.locations[index].selected(true);

          // Open infoWindow at selected marker.
          infoWindow.setContent(marker.title);
          infoWindow.open(map, marker);
        }
      });
    })(infoWindow, markers[i], map, i);
  }

  return markers;
};

app.initMap = function() {
  var map;
  map = new google.maps.Map($('#map')[0]);

  markers = app.createMarkers(map);

  // Center and zoom map to fit all markers.
  var markerBounds = new google.maps.LatLngBounds();
  for (var i = 0; i < markers.length; i++) {
    markerBounds.extend(markers[i].getPosition());
  }
  map.fitBounds(markerBounds);

  // createMarkers() creates some DOM that has KO bindings.
  ko.applyBindings(new app.AppViewModel());

  // Match width of location list to textfield. +2 to account for border.
  var width = $('div.location_filter').width() + 2;
  $('div.locations').width(width);
};

app.AppViewModel = function() {
  var self = this;

  self.filter = ko.observable("");
  // Each '.locations div' binds to a location in this array.
  self.locations = app.mapData.locations;
  // Only true when any location in self.locations is selected.
  self.locationsListSelected = ko.computed(function() {
    var value = false;
    for (var i = 0; i < self.locations.length; i++){
      if (self.locations[i].selected() == true) {
        value = true;
        break;
      }
    }
    return value;
  }, this);

  self.filterLocations = function() {
    var filterText = self.filter().toUpperCase();

    for (var i = 0; i < self.locations.length; i++) {
      var location = self.locations[i];
      if (location.name.toUpperCase().indexOf(filterText) == -1) {
        // Unselect this location before hiding, if it was selected.
        if (i == app.locationSelected) {
          $('.locations div').eq(i).trigger('click');
        }
        location.hidden(true);
        app.markers[i].setVisible(false);
      }
      else {
        location.hidden(false);
        app.markers[i].setVisible(true);
      }
    }
  };

  self.filterFieldKeyPressed = function(data, event) {
    if (event.keyCode == 13) {
      self.filterLocations();
    }
    return true;
  }

  /**
   * Clicking on a selected location unselects it.
   * Note how this mirrors exactly the listener for selecting/unselecting markers.
   * (Listener defined in app.createMarkers())
   */
  self.locationClicked = function(index) {
    // Set 'selected' to false for previous selected location.
    if (app.locationSelected != null) {
      self.locations[app.locationSelected].selected(false);
    }

    if (app.locationSelected == index) {
      // Unselecting
      app.locationSelected = null;
    }
    else {
      // Selecting (a new location)
      app.locationSelected = index;
      self.locations[index].selected(true);
    }

    // Trigger click on marker.
    google.maps.event.trigger(app.markers[index], 'click');
  }
}

// Init menu icon when document DOM is ready.
$(document).ready(function() {
  var menu = document.querySelector('#menu');
  var body = document.querySelector('body');
  var locationFilter = document.querySelector('div.location_filter');
  var locationList = document.querySelector('div.locations');

  // Opens when hamburger icon is clicked.
  menu.addEventListener('click', function(e) {
    locationFilter.classList.toggle('open');
    locationList.classList.toggle('open');
    e.stopPropagation();
  });
  // Closes when any part of 'body' is clicked.
  body.addEventListener('click', function(e) {
    if (e.target != document.querySelector('input.location_filter') &&
        e.target != document.querySelector('button.location_filter') &&
        e.target.parentNode != document.querySelector('div.locations')) {
      locationFilter.classList.remove('open');
      locationList.classList.remove('open');
    }
  });
});

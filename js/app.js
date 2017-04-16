var app = app || {}

app.Location = function(name, latlng) {
  var self = this;
  self.name = name;
  self.latlng = latlng;
  self.hidden = ko.observable(false);
  self.selected = ko.observable(false);

  self.marker = null; // Google Map marker. See createMarker().

  self.createMarker = function(map) {
    self.marker = new google.maps.Marker({
      position: self.latlng,
      map: map,
      title: self.name
    });
  };
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

app.locationSelected = null; // index into app.mapData.locations

app.createMarkers = function(map) {
  // Use only 1 instance of InfoWindow
  var infoWindow = new google.maps.InfoWindow({
    content: ''
  });

  for (var i = 0; i < app.mapData.locations.length; i++) {
    var location = app.mapData.locations[i];

    // Create Google Map marker.
    location.createMarker(map);

    // Create marker listener.
    (function(map, index) {
      var locations = app.mapData.locations;
      var marker = locations[index].marker;

      marker.addListener('click', function() {
        // Stop animation for last selected marker.
        if (app.locationSelected != null) {
          locations[app.locationSelected].marker.setAnimation(null);
          // Unselect last selected location too.
          locations[app.locationSelected].selected(false);
        }

        if (app.locationSelected == index) {
          // Unselecting
          app.locationSelected = null;
          infoWindow.close();
        }
        else {
          // Selecting (a new location)
          app.locationSelected = index;
          marker.setAnimation(google.maps.Animation.BOUNCE);
          locations[index].selected(true);

          // Open infoWindow at selected marker.
          infoWindow.setContent(marker.title);
          infoWindow.open(map, marker);
        }
      });
    })(map, i);
  }
};

app.initMap = function() {
  var map;
  map = new google.maps.Map($('#map')[0]);

  app.createMarkers(map);

  var locations = app.mapData.locations;

  // Center and zoom map to fit all markers.
  var markerBounds = new google.maps.LatLngBounds();
  for (var i = 0; i < locations.length; i++) {
    markerBounds.extend(locations[i].marker.getPosition());
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
  }, self);

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
        location.marker.setVisible(false);
      }
      else {
        location.hidden(false);
        location.marker.setVisible(true);
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
      self.locations[app.locationSelected].marker.setAnimation(null);
    }

    if (app.locationSelected == index) {
      // Unselecting
      app.locationSelected = null;
    }
    else {
      // Selecting (a new location)
      app.locationSelected = index;
      self.locations[index].selected(true);
      self.locations[index].marker.setAnimation(google.maps.Animation.BOUNCE);
    }
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

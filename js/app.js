var app = app || {};

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
    new app.Location("Downtown East", {lat: 1.376386, lng: 103.954857}),
    new app.Location("Fishing Pond", {lat: 1.371507, lng: 103.952228}),
    new app.Location("Pasir Ris Subway Station", {lat: 1.373104, lng: 103.949435}),
    new app.Location("Pasir Ris Sports Centre", {lat: 1.374292, lng: 103.951975}),
    new app.Location("Pasir Ris Beach", {lat: 1.383694, lng: 103.947102})
  ]
};

app.locationSelected = null; // index into app.mapData.locations
app.map = null; // Google map
app.infoWindow = null; // Use only 1 instance of InfoWindow
app.mapBounds = null; // Calculated once, includes all markers.

app.initMap = function() {
  app.map = new google.maps.Map($('#map')[0]);

  app.infoWindow = new google.maps.InfoWindow({
    content: ''
  });

  ko.applyBindings(new app.AppViewModel());

  var locations = app.mapData.locations;

  // Center and zoom map to fit all markers.
  app.mapBounds = new google.maps.LatLngBounds();
  for (var i = 0; i < locations.length; i++) {
    app.mapBounds.extend(locations[i].marker.getPosition());
  }
  app.map.fitBounds(app.mapBounds);

  // Re-fit to bounds upon window resize.
  google.maps.event.addDomListener(window, 'resize', function() {
    app.map.fitBounds(app.mapBounds);
  });

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
      if (self.locations[i].selected() === true) {
        value = true;
        break;
      }
    }
    return value;
  }, self);

  // Visibility state for both the input field and the locations list.
  self.locationsListVisible = ko.observable(false);

  self.showHideLocationsList = function() {
    if (self.locationsListVisible() === true)
      self.locationsListVisible(false);
    else {
      self.locationsListVisible(true);
    }
  };

  self.hideLocationsList = function(data, e) {
    self.locationsListVisible(false);
    return true;
  };

  self.filterLocations = function() {
    var filterText = self.filter().toUpperCase();

    for (var i = 0; i < self.locations.length; i++) {
      var location = self.locations[i];
      if (location.name.toUpperCase().indexOf(filterText) == -1) {
        // Unselect this location before hiding, if it was selected.
        if (i == app.locationSelected) {
          self.unselectLocation(i);
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
  };

  self.unselectLocation = function(index) {
    var infoWindow = app.infoWindow;
    var location = self.locations[index];
    location.selected(false);
    location.marker.setAnimation(null);
    infoWindow.close();
  };

  self.selectLocation = function(index) {
    var infoWindow = app.infoWindow, map = app.map;
    var location = self.locations[index];
    app.locationSelected = index;
    location.selected(true);
    location.marker.setAnimation(google.maps.Animation.BOUNCE);

    // Open infoWindow at selected marker.
    infoWindow.setContent(location.name);
    infoWindow.open(map, location.marker);

    // Pull in more info from Foursquare.
    self.callFoursquare(location);
  };

  /**
   * Clicking on a selected location unselects it.
   * Note how this function is used for both marker and DOM listeners.
   * (See self.attachMarkerListeners())
   */
  self.locationClicked = function(index) {
    // Set 'selected' to false for previous selected location.
    if (app.locationSelected !== null) {
      self.unselectLocation(app.locationSelected);
    }

    if (app.locationSelected == index) {
      // Unselecting
      app.locationSelected = null;
    }
    else {
      // Selecting (a new location)
      self.selectLocation(index);
    }
  };

  self.callFoursquare = function(location) {
    var infoWindow = app.infoWindow;
    var content = '<center>' + infoWindow.getContent() + '</center>';

    // Use Foursquare. Get official venue name, contact info.
    var endpoint = 'https://api.foursquare.com/v2/venues/search';
    var data = {
      ll: location.latlng.lat + ',' + location.latlng.lng,
      client_id: 'DWY4APYOJTPFZRYOKFWOEHLE2Q2XJDMM44YL4PLSSGAH0VQL',
      client_secret: 'PBGWQRBUBIIZBIRWD2HNL2HHMVYMJNJR3BGSK2VVJV5WAZNO',
      v: '20170416'
    };
    $.getJSON(endpoint, data, function(data) {
      // Take 1st venue. It's the most accurate.
      // Prefer formatted phone number. Add to infoWindow.
      var venue = null;
      if (data.response.venues.length > 0) {
        venue = data.response.venues[0];
      }

      if (venue === null) {
        content += '<br>No Foursquare venue here';
        infoWindow.setContent(content);
        return;
      }

      content += '<br><b>Official venue name</b>:<br>' + venue.name + '<br>';

      if (Object.keys(venue.contact).length <= 0) {
        content += '<br>No contact info found';
        infoWindow.setContent(content);
        return;
      }

      if (venue.contact.formattedPhone) {
        content += '<br>Phone: ' + venue.contact.formattedPhone;
      }
      else {
        var key = Object.keys(venue.contact)[0];
        content += '<br>' + key + ': ' + venue.contact[key];
      }
      infoWindow.setContent(content);
    }).fail(function(jqxhr, textStatus, error) {
      var err = textStatus + ", " + error;
      content += '<br>Unable to contact Foursquare<br>' + err;
      infoWindow.setContent(content);
    });
  };

  self.createMarker = function(index) {
    var marker = self.locations[index].marker;
    marker.addListener('click', self.locationClicked.bind(self, index));
  };

  // Creates markers, listeners, and the listeners to markers.
  self.createMarkers = function() {
    var map = app.map;
    for (var i = 0; i < self.locations.length; i++) {
      var location = self.locations[i];

      // Create the Google Map marker.
      location.createMarker(map);

      // Create the listener and attach it to the marker.
      self.createMarker(i);
    }
  };
  self.createMarkers();
};

app.googleMapLoadErrorHandler = function(e) {
  $('#map')[0].innerHTML = '<p>Error loading Google Maps!</p>' +
    '<p>Try checking your internet connection?</p>' +
    '<p>Or try again later?</p>';
};

function gm_authFailure() {
  $('#map')[0].innerHTML = '<p>Error loading Google Maps API!</p>' +
    '<p>Please notify us about this!</p>';
}

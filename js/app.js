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

app.initMap = function() {
  app.map = new google.maps.Map($('#map')[0]);

  app.infoWindow = new google.maps.InfoWindow({
    content: ''
  });

  ko.applyBindings(new app.AppViewModel());

  var locations = app.mapData.locations;

  // Center and zoom map to fit all markers.
  var markerBounds = new google.maps.LatLngBounds();
  for (var i = 0; i < locations.length; i++) {
    markerBounds.extend(locations[i].marker.getPosition());
  }
  app.map.fitBounds(markerBounds);

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
   * Note how this function is used for both marker and DOM listeners.
   * (See self.attachMarkerListeners())
   */
  self.locationClicked = function(index) {
    var infoWindow = app.infoWindow, map = app.map;
    var location = self.locations[index];

    // Set 'selected' to false for previous selected location.
    if (app.locationSelected != null) {
      self.locations[app.locationSelected].selected(false);
      self.locations[app.locationSelected].marker.setAnimation(null);
    }

    if (app.locationSelected == index) {
      // Unselecting
      app.locationSelected = null;
      infoWindow.close();
    }
    else {
      // Selecting (a new location)
      app.locationSelected = index;
      location.selected(true);
      location.marker.setAnimation(google.maps.Animation.BOUNCE);

      // Open infoWindow at selected marker.
      infoWindow.setContent(location.name);
      infoWindow.open(map, location.marker);

      // Pull in more info from Foursquare.
      self.callFoursquare(location);
    }
  }

  self.callFoursquare = function(location) {
    var infoWindow = app.infoWindow;
    var content = '<center>' + infoWindow.getContent() + '</center>';

    // Use Foursquare. Get official venue name, contact info.
    var endpoint = 'https://api.foursquare.com/v2/venues/search'
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

      console.log(data.response.venues);

      if (venue == null) {
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
  }

  // Creates markers, listeners, and the listeners to markers.
  self.createMarkers = function() {
    var map = app.map, infoWindow = app.infoWindow;
    for (var i = 0; i < self.locations.length; i++) {
      var location = self.locations[i];

      // Create the Google Map marker.
      location.createMarker(map);

      // Create the listener and attach it to the marker.
      (function(index) {
        var marker = self.locations[index].marker;
        marker.addListener('click', self.locationClicked.bind(self, index));
      })(i);
    }
  }
  self.createMarkers();
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

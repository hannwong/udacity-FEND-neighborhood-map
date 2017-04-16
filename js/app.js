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

app.markers = [];
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
    (function(infoWindow, marker, map) {
      marker.addListener('click', function() {
        // Stop animation for last selected marker.
        if (app.markerSelected != null) {
          app.markerSelected.setAnimation(null);
        }

        if (app.markerSelected == marker) {
          // Unselecting
          app.markerSelected = null;
          infoWindow.close();
        }
        else {
          // Selecting (a new marker)
          app.markerSelected = marker;
          infoWindow.setContent(marker.title);
          infoWindow.open(map, marker);
          marker.setAnimation(google.maps.Animation.BOUNCE);
        }
      });
    })(infoWindow, markers[i], map);
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
  this.filter = ko.observable("");
  // Each '.locations div' binds to a location in this array...
  this.locations = app.mapData.locations;
  generateLocationsDOM(this.locations); // Like so here.
  // Only true when any location in this.locations is selected.
  this.locationsListSelected = ko.computed(function() {
    var value = false;
    for (var i = 0; i < this.locations.length; i++){
      if (this.locations[i].selected() == true) {
        value = true;
        break;
      }
    }
    return value;
  }, this);

  this.filterLocations = function() {
    var filterText = this.filter().toUpperCase();

    for (var i = 0; i < this.locations.length; i++) {
      var location = this.locations[i];
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

  this.filterFieldKeyPressed = function(data, event) {
    if (event.keyCode == 13) {
      this.filterLocations();
    }
    return true;
  }

  /**
   * Clicking on a selected location unselects it.
   * Note how this mirrors exactly the listener for selecting/unselecting markers.
   * (Listener defined in app.createMarkers())
   */
  this.locationClicked = function(index) {
    // Set 'selected' to false for previous selected location.
    if (app.locationSelected != null) {
      this.locations[app.locationSelected].selected(false);
    }

    if (app.locationSelected == index) {
      // Unselecting
      app.locationSelected = null;
    }
    else {
      // Selecting (a new location)
      app.locationSelected = index;
      this.locations[index].selected(true);
    }

    // Trigger click on marker.
    google.maps.event.trigger(app.markers[index], 'click');
  }

  /**
   * Technically, this should be in View. But there's no way to put this
   * dynamically generated HTML in the .html file. So it's here for now.
   */
  function generateLocationsDOM(locations) {
    var locationsList = $('div.locations');
    for (var i = 0; i < locations.length; i++) {
      var location = locations[i];
      var clickBinding = 'click: locationClicked.bind($data, ' + i + ')';
      var cssBinding = 'css: { ' +
          'selected: locations[' + i + '].selected(), ' +
          'hidden: locations[' + i + '].hidden()' +
          '}';

      var locationDiv = '<div data-bind="' +
          clickBinding + ', ' + cssBinding + '">' + location.name + '</div>';

      locationsList.append(locationDiv);
    }
  };
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

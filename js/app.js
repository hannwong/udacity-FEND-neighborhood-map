var app = app || {}

app.mapData = {
  map: {
    latlng: {lat: 1.3688548, lng: 103.9487079},
    zoom: 15
  },
  locations: [
    {name: "Downtown East",
      latlng: {lat: 1.376684, lng: 103.954890}
    },
    {
      name: "Fishing Pond",
      latlng: {lat: 1.371890, lng: 103.952218}
    },
    {
      name: "Pasir Ris Subway Station",
      latlng: {lat: 1.373435, lng: 103.949450}
    },
    {
      name: "Pasir Ris Sports Centre",
      latlng: {lat: 1.374428, lng: 103.951986}
    },
    {
      name: "Pasir Ris Beach",
      latlng: {lat: 1.383931, lng: 103.947114}
    }
  ]
};

app.markers = [];
app.markerSelected = null; // Google Maps marker
app.locationSelected = null; // DOM element

app.createMarkers = function(map) {
  var markers = app.markers = [];
  for (var i = 0; i < app.mapData.locations.length; i++) {
    var marker = new google.maps.Marker({
      position: app.mapData.locations[i].latlng,
      map: map,
      title: app.mapData.locations[i].name
    });
    markers.push(marker);
    $('.locations').append(
      '<div data-bind="click: locationClicked.bind($data, ' + i + ')">' +
        marker.title + '</div>');
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
};

app.AppViewModel = function() {
  this.filter = ko.observable("");

  this.filterLocations = function() {
    var filterText = this.filter().toUpperCase();
    $('div.locations div').each(function(index) {
      if ($(this).html().toUpperCase().indexOf(filterText) == -1) {
        $(this).addClass('hidden');
        app.markers[index].setVisible(false);
      }
      else {
        $(this).removeClass('hidden');
        app.markers[index].setVisible(true);
      }
    });
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
  this.locationClicked = function(index, data, event) {
    var clickedLocation = event.target;

    // Remove 'selected' style from previous selected location DOM element.
    if (app.locationSelected != null) {
      $(app.locationSelected).removeClass('selected');
    }

    if (app.locationSelected == clickedLocation) {
      // Unselecting
      app.locationSelected = null;
    }
    else {
      // Selecting (a new location)
      app.locationSelected = clickedLocation;
      $(clickedLocation).addClass('selected');
    }

    // Trigger click on marker.
    google.maps.event.trigger(app.markers[index], 'click');
  }
}

// Init menu icon when document DOM is ready.
$(document).ready(function() {
  var menu = document.querySelector('#menu');
  var body = document.querySelector('body');
  var drawer = document.querySelector('.nav');

  // Opens when hamburger icon is clicked.
  menu.addEventListener('click', function(e) {
    drawer.classList.toggle('open');
    e.stopPropagation();
  });
  // Closes when any part of 'body' is clicked.
  body.addEventListener('click', function(e) {
    if (e.target != document.querySelector('input.location_filter') &&
        e.target != document.querySelector('button.location_filter') &&
        e.target.parentNode != document.querySelector('div.locations'))
      drawer.classList.remove('open');
  });
});

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

app.createMarkers = function(map) {
  var markers = [];
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
        infoWindow.setContent(marker.title);
        infoWindow.open(map, marker);
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
};

function update() {
    d3.select("#map")
      .style("height", window.innerHeight+"px");
}

//We update the position and the size of the hospitals' markers
function updateMarkers() {
    var markerSize = Math.round(map.getZoom() * 20 / 14);
    markers
      .attr("width", markerSize)
      .attr("height", markerSize)
      .attr("x", function(d) { 
          return map.latLngToLayerPoint([d.latitude, d.longitude]).x - markerSize / 2;
      })
      .attr("y", function(d) { 
          return map.latLngToLayerPoint([d.latitude, d.longitude]).y - markerSize / 2;
      });
}

//Detects when an urban area is hovered
function onEachFeature(feature, layer) {
    layer.on({
        mousemove: mousemove,
        mouseout: mouseout
    });
}

//Handler for the urban area
function mousemove(e) {
    var layer = e.target;
    layer.setStyle({
        fill: true,
        fillColor: '#000',
        fillOpacity: .1
    });
}

//Handler for the urban area
function mouseout(e) {
    urbanAreaFeature.resetStyle(e.target);
}

//Display the name of the hospital hovered
function displayPopup(d) {
    var popup = L.popup()
      .setLatLng([d.latitude, d.longitude])
      .setContent(d.name)
      .openOn(map);
    
    setTimeout(function() {
        map.closePopup(popup);
    }, 2000);
}

//Display the top communities for an hospital
function topCommunityFromHospital(d) {
    console.log("click");

    var popup = L.popup()
      .setLatLng([d.latitude, d.longitude])
      .setContent(d.name)
      .openOn(map);
}
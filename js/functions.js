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
//    layer.on({
//        mousemove: mousemove,
//        mouseout: mouseout
//    });
}

////Handler for the urban area
//function mousemove(e) {
//    var layer = e.target;
//    layer.setStyle({
//        fill: true,
//        fillColor: '#000',
//        fillOpacity: .1
//    });
//}
//
////Handler for the urban area
//function mouseout(e) {
//    urbanAreaFeature.resetStyle(e.target);
//}

//Display the name of the hospital hovered
function displayPopup(d) {
    var popup = L.popup({closeButton: false, className: 'noCloseButton'})
      .setLatLng([d.latitude, d.longitude])
      .setContent(d.name)
      .openOn(map);
    
    setTimeout(function() {
        map.closePopup(popup);
    }, 2000);
}

//Return the data from urbanAreaData from the name of the urban area
function getUrbanAreaData(communityName) {
    for(var j = 0; j < urbanAreaData.features.length; j++) {
        if(urbanAreaData.features[j].properties.TOWN.toLowerCase().trim() == communityName.toLowerCase().trim())
            return urbanAreaData.features[j].properties;
    }
    return null;
}

function displayUrbanArea(nb, total) {
    //We retrieve the data from urbanAreaFeature
    var layers = urbanAreaFeature.getLayers();
    for(var j = 0; j < layers.length; j++) {
        if(layers[j].feature.properties.TOWN.toLowerCase().trim() == communityName) {
            urbanAreaLayerID = layers[j]._leaflet_id;
        }
    }

    //We change the color of the layer
    var colorScale = chroma.scale(["#FFDEE3", "#590C19"]).domain([0, total]).out("hex");
    if(urbanAreaLayerID != null) {
        urbanAreaFeature.getLayer(urbanAreaLayerID).setStyle({
            fillColor: colorScale(nb),
            fillOpacity: .8
        });
    }
}

//Display the top communities for an hospital
function topCommunityFromHospital(d) {
    //We get the urban areas where the people come from
    var hospital = hospitalsData[d.id - 1];
    
    //We display a panel
    if(d3.select(".panel").length > 0) {
        d3.select(".panel")
          .remove();
        map.eachLayer(function(layer) {
            urbanAreaFeature.resetStyle(layer);
        });
    }
        
    var panel = d3.select("body")
      .append("div")
      .attr("class", "panel")
      .style("height", window.innerHeight+"px");
    
    var quitButton = panel.append("div")
         .attr("class", "quit");
    
    quitButton.on("click", function() {
        panel.remove();
        d3.select("#map")
          .style("width", window.innerWidth+"px");
        map.eachLayer(function(layer) {
            urbanAreaFeature.resetStyle(layer);
        });
    });
    
    d3.select("#map")
      .style("width", (window.innerWidth - 400)+"px");
    
    panel.append("h1")
         .text(d.name);
    
    for(var i = 0; i < 10; i++) {
        if(hospital["nameTopCommunity"+(i + 1)] == null)
            continue;
        
        var div = panel.append("div")
            .attr("class", "hospital");
        div.append("h2")
           .text(hospital["nameTopCommunity"+(i + 1)]+", "+hospital["stateTopCommunity"+(i + 1)])
        div.append("h3")
           .text(hospital["nbTopCommunity"+(i + 1)]+" pacients");
    }
    
//    var popup = L.popup({closeOnClick: false, closeButton: true})
//      .setLatLng([d.latitude, d.longitude])
//      .setContent(d.name)
//      .openOn(map);
//    
    
    
    //We calculate the number of patients of that hospital
    var totalHospital = 0;
    for(var i = 0; i < 10; i++)
        totalHospital += hospital["nbTopCommunity"+(i + 1)];
    
    for(var i = 0; i < 10; i++) {
        
        //Only in the case the city in inside MA
        if(hospital["nameTopCommunity"+(i + 1)] != null && hospital["stateTopCommunity"+(i + 1)] == "MA") {
            var nbHospital =  hospital["nbTopCommunity"+(i + 1)];
            communityName = hospital["nameTopCommunity"+(i + 1)].toLowerCase().trim();
            
            //We retrieve the data from urbanAreaData
            urbanAreaObject = getUrbanAreaData(communityName);
            
            if(urbanAreaObject != null)
                displayUrbanArea(nbHospital, totalHospital);
            
            //We couldn't find the urban area in the data, we use Nominatim to find it
            else {
                var dataFound = false;
                console.log(communityName);
                d3.json("http://nominatim.openstreetmap.org/search?q="+communityName+"&state=ma&format=json&addressdetails=1", (function(communityName, nbHospital, totalHospital) {
                    return function(error, json) {
                        if(json.length > 0) {
                            //We loop through the different results until we find the urban area
                            for(var j = 0; j < json.length; j++) {
                                //We first try to find the data with the city provided
                                if(json[j].address != null && json[j].address.city != null) {
                                    //We found it!
                                    if(getUrbanAreaData(json[j].address.city) != null) {
                                        dataFound = true;
                                        displayUrbanArea(nbHospital, totalHospital);
                                        return;
                                    } 
                                }

                                //We then try to find the data with the county
                                if(!dataFound && json[j].address != null && json[j].address.county != null) {
                                    var countyName = json[j].address.county;
                                    countyName = countyName.toLowerCase().replace("county", "");
                                    //We found it!
                                    if(getUrbanAreaData(countyName) != null) {
                                        dataFound = true;
                                        displayUrbanArea(nbHospital, totalHospital);
                                        return;
                                    } 
                                }
                            }

                            //In case, we couldn't find anything
                            console.log("Unable to retrieve the data for: "+communityName);
                        }

                        //Nominatim couldn't find the place
                        else
                            console.log("Unable to retrieve the data for: "+communityName);
                    }
                })(communityName, nbHospital, totalHospital));
            }
            
        }
    }
    
}
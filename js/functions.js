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

//Return the layer Id of the urban area
function getUrbanAreaLayerId(urbanAreaName) {
    var layers = urbanAreaFeature.getLayers();
    for(var j = 0; j < layers.length; j++) {
        if(layers[j].feature.properties.TOWN.toLowerCase().trim() == urbanAreaName) {
            return layers[j]._leaflet_id;
        }
    }
}

//Set the color and the opacity of the fill of a urban area
function setUrbanAreaLayerfillColor(urbanAreaLayerId, color, opacity) {
    urbanAreaFeature.getLayer(urbanAreaLayerId).setStyle({
        fillColor: color,
        fillOpacity: opacity
    });
}

//Set the color and the opacity of the stroke of a urban area
function setUrbanAreaLayerstrokeColor(urbanAreaLayerId, color, opacity, width) {
    urbanAreaFeature.getLayer(urbanAreaLayerId).setStyle({
        color: color,
        opacity: opacity,
        weight: width
    });
}

function displayUrbanArea(communityName, nb, total) {
    var urbanAreaLayerId = getUrbanAreaLayerId(communityName);

    //We change the color of the layer
    var colorScale = chroma.scale(["#61C280", "#C41212"]).domain([0, total]).out("hex");
    if(urbanAreaLayerId != null)
        setUrbanAreaLayerfillColor(urbanAreaLayerId, colorScale(nb), .8);
}

//Display a bubble next to the panel with the content of the string
function displayHospitalInfo(string) {
    if(d3.select(".bubble")[0][0])
        d3.select(".bubble").remove();
    
    d3.select("body")
      .append("div")
      .attr("class", "bubble")
      .text(string);
}

//Display the top communities for an hospital
function topCommunityFromHospital(d) {
    //We get the urban areas where the people come from
    var hospital = hospitalsData[d.id - 1];
    
    //We eventually remove the old panel and the old bubble
    if(d3.select(".panel")[0][0]) {
        d3.select(".panel")
          .remove();
        map.eachLayer(function(layer) {
            urbanAreaFeature.resetStyle(layer);
        });
        
        if(d3.select(".bubble")[0][0])
            d3.select(".bubble").remove();
    }
    
//    var popup = L.popup({closeOnClick: false, closeButton: true})
//      .setLatLng([d.latitude, d.longitude])
//      .setContent(d.name)
//      .openOn(map);
//    
    
    
    //We calculate the number of patients of that hospital
    var totalHospital = 0;
    var urbanAreasLayerId = [];
    for(var i = 0; i < hospital.topCommunities.length; i++)
        totalHospital += hospital.topCommunities[i].patients;
    
    for(var i = 0; i < hospital.topCommunities.length; i++) {
        
        //Only in the case the city in inside MA
        if(hospital.topCommunities[i].state == "MA") {
            var nbHospital =  hospital.topCommunities[i].patients;
            communityName = hospital.topCommunities[i].name.toLowerCase().trim();
            
            //We retrieve the data from urbanAreaData
            urbanAreaObject = getUrbanAreaData(communityName);
            urbanAreasLayerId.push(getUrbanAreaLayerId(communityName));
            displayUrbanArea(communityName, nbHospital, totalHospital);
            
            //We couldn't find the urban area in the data, we use Nominatim to find it
//            else {
//                var dataFound = false;
//                console.log(communityName);
//                d3.json("http://nominatim.openstreetmap.org/search?q="+communityName+"&state=ma&format=json&addressdetails=1", (function(communityName, nbHospital, totalHospital) {
//                    return function(error, json) {
//                        if(json.length > 0) {
//                            //We loop through the different results until we find the urban area
//                            for(var j = 0; j < json.length; j++) {
//                                //We first try to find the data with the city provided
//                                if(json[j].address != null && json[j].address.city != null) {
//                                    //We found it!
//                                    if(getUrbanAreaData(json[j].address.city) != null) {
//                                        displayUrbanArea(nbHospital, totalHospital);
//                                        return;
//                                    } 
//                                }
//
//                                //We then try to find the data with the county
//                                if(!dataFound && json[j].address != null && json[j].address.county != null) {
//                                    var countyName = json[j].address.county;
//                                    countyName = countyName.toLowerCase().replace("county", "");
//                                    //We found it!
//                                    if(getUrbanAreaData(countyName) != null) {
//                                        displayUrbanArea(nbHospital, totalHospital);
//                                        return;
//                                    } 
//                                }
//                            }
//
//                            //In case, we couldn't find anything
//                            console.log("Unable to retrieve the data for: "+communityName);
//                        }
//
//                        //Nominatim couldn't find the place
//                        else
//                            console.log("Unable to retrieve the data for: "+communityName);
//                    }
//                })(communityName, nbHospital, totalHospital));
//            }
        }
    }
    
    //We add a new panel we the data from the hospital
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
        if(d3.select(".bubble")[0][0])
            d3.select(".bubble").remove();
    });
    
    d3.select("#map")
      .style("width", (window.innerWidth - 400)+"px");
    
    panel.append("h1")
         .text(d.name);
    
    var hospitalList = panel.selectAll("div.hospital")
         .data(urbanAreasLayerId)
         .enter()
         .append("div")
         .attr("class", "hospital")
         .append("h2")
         .text(function(d, i) {
             return hospital.topCommunities[i].name+", "+hospital.topCommunities[i].state;
         })
         .append("h3")
         .text(function(d, i) {
             return hospital.topCommunities[i].patients+" patients";
         });
    
    panel.selectAll("div.hospital").on("mouseover", function(d) {
            setUrbanAreaLayerstrokeColor(d, "#C71467", .8, 2);
         })
         .on("mouseout", function(d) {
            setUrbanAreaLayerstrokeColor(d, "#C71467", 0, 2);
         })
         .on("click", function(d, i) {
             if(hospital.topCommunities[i].percentage != null)
                var content = Math.round(hospital.topCommunities[i].percentage * 100)+"% of the people of that community came to this hospital";
             else
                 var content = "No data for that community";
             displayHospitalInfo(content);
         });
}
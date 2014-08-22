var urbanAreaModule = (function() {
    var _config = {
        style: {
            fill: true,
            fillColor: '#fff',
            fillOpacity: 0,
            stroke: true,
            weight: 1,
            color: '#000',
            opacity: .1
        },
        linesContainerClass: "lines",
        svgContainer: "#map svg",
        hiddenLineOpacity: .2
    };
    
    var _feature; //Contains the mapbox object for the urban areas
    
    /*
        _getArea(urbanAreaName)
        Returns the layer whose name is urbanAreaName
    */
    var _getArea = function(urbanAreaName) {
        var layers = _feature.getLayers();
        var result = null;
        layers.forEach(function(layer) {
            if(layer.feature.properties.TOWN.toLowerCase().trim() == urbanAreaName) {
                result = layer;
            }
        });  
        return result;
    };
    
    /*
        _getAreaById(id)
       Returns the layer whose id is id
    */
    var _getAreaById = function(id) {
        var layers = _feature.getLayers();
        var result = null;
        for(var i = 0; i < layers.length; i++) {
            if(layers[i].feature.properties.id === id) {
                result = layers[i];
                break;
            }
        } 
        return result;
    };
    
    /*
        displayTopHospitals(layer)
        Displays the hospitals the most visited by the people from the selected area  with a pane
        center is an object containing the latitude and the longitude of the center of the clicked area
    */
    var displayTopHospitals = function(layer, center) {
        //We reset the menu
        menuModule
            .resetContent(1)
            .setTitle(1, layer.town)
            .close(2);
        
        //Remove the heatmap of the map and reset the style of the markers
        reset();
        
        //We hide all the markers
        markerModule.hideMarkers();
        
        //We delete all the lines
        deleteLines();
        
        var menuContent = d3.select(document.createElement("table"));
        var currentRow = menuContent.append("tr");
        currentRow.append("th")
            .classed("w50", true)
            .text("Hospital of destination");
        currentRow.append("th")
            .classed("w25", true)
            .text("Patients");
        currentRow.append("th")
            .html("% of patients/hospital<sup>1</sup>");
        
        var totalPatients = 0;
        layer.topHospitals.forEach(function(topHospital) {
            totalPatients += topHospital.patients;
        });
        
        layer.topHospitals.forEach(function(topHospital) {
            var percentage = (topHospital.percentage === null) ? "–" : ((topHospital.percentage * 100 <= 1) ? "<1" : Math.round(topHospital.percentage * 100));
            currentRow = menuContent.append("tr")
                .data([{id: topHospital.id_hospital}])
                .on("mouseover", function(d) {
                    markerModule.hideMarkers();
                    d3.select(markerModule.getMarker(d.id))
                        .style("opacity", 1);
                    
                    var id = d.id;
                    d3.selectAll(_config.svgContainer+" ."+_config.linesContainerClass+" line")
                        .style("opacity", function(d) {
                            if(d.id != id)
                                return _config.hiddenLineOpacity;
                            return 1;
                        });

                    d3.select(this)
                        .style("background-color", "#dc254f");
                })
                .on("mouseout", function() {
                    markerModule.restoreSelectedMarkers();
                    
                    d3.select(this)
                        .attr("style", null);
                    
                    d3.selectAll(_config.svgContainer+" ."+_config.linesContainerClass+" line")
                        .style("opacity", 1);
                })
                .on("click", function(d) {
                    markerModule.displayTopCommunities(getHospital(d.id), markerModule.getMarker(d.id));
                });
            
            var hospital = getHospital(topHospital.id_hospital);
            if(hospital === undefined)
                console.log("shit on "+topHospital.id_hospital);
            
            currentRow.append("td")
                .text(hospital.name);
            currentRow.append("td")
                .text(topHospital.patients);
            currentRow.append("td")
                .text((percentage !== "–") ? percentage+"%" : percentage);
            
            //We highlight the marker of the current hospital
            var marker = markerModule.getMarker(topHospital.id_hospital);
            d3.select(marker)
                .style("opacity", 1);
            markerModule.addSelectedMarker(marker);
            
            //We add the line
            var originCoords = mapModule.getMap().latLngToLayerPoint([center.lat, center.lng]);
            var destinationCoords = mapModule.getMap().latLngToLayerPoint([getHospital(topHospital.id_hospital).latitude, getHospital(topHospital.id_hospital).longitude]);
            
            d3.select(_config.svgContainer+" ."+_config.linesContainerClass)
                .data([{
                    id: topHospital.id_hospital,
                    origin: {
                        latitude: center.lat,
                        longitude: center.lng
                    },
                    destination: {
                        latitude: getHospital(topHospital.id_hospital).latitude,
                        longitude: getHospital(topHospital.id_hospital).longitude
                    }
                }])
                .append("line")
                .style("stroke-width", function() {
                    var ratio = topHospital.patients / totalPatients;
                    var thickness;
                    if(ratio > .6)
                        thickness = 6;
                    else if(ratio > .5)
                        thickness = 5;
                    else if(ratio > .3)
                        thickness = 4;
                    else if(ratio > .1)
                        thickness = 3;
                    else
                        thickness = 2;
                    return thickness+"px";
                })
                .attr("x1", originCoords.x)
                .attr("y1", originCoords.y)
                .attr("x2", destinationCoords.x)
                .attr("y2", destinationCoords.y);
            
        });
        
        //No data for the hospital
        if(menuContent.selectAll("tr")[0].length == 1) {
            currentRow = menuContent.append("tr");
            currentRow.append("td")
                .text("No data");
            currentRow.append("td");
            currentRow.append("td");
        }

        menuModule.addContent(1, menuContent);
        
        menuModule.setNote(1, "<sup>1</sup> These data only take into account the patients coming from the top 10<sup>-</sup> communities<br/>Data from the <a href='http://www.mass.gov/chia/researcher/hcf-data-resources/massachusetts-hospital-profiles/overiew-and-current-reports.html' target='_blank'>Center for Health Information and Analysis</a>");

        menuModule.open(1, {
            onQuit: urbanAreaModule.deleteLines,
            onQuitArguments: null
        });
    };
    
    /*
        deleteLines
        Deletes all the lines
    */
    var deleteLines = function() {
        d3.selectAll(_config.svgContainer+" ."+_config.linesContainerClass+" line")
            .remove();
    };
    
    /*
        init
        Displays the urban areas on the map
    */
    var init = function() {
        mapModule.getMap()._initPathRoot();
        _feature = L.geoJson(_urbanAreaData, {style: _config.style, onEachFeature: function(feature, layer) {
                layer.on("click", function(e) {
                    app.areaClicked(e.target.feature.properties, this.getBounds().getCenter());
//                    displayTopHospitals(e.target.feature.properties, this.getBounds().getCenter());
                
                });
            }})
            .addTo(mapModule.getMap());
        
        d3.select(_config.svgContainer)
            .append("g")
            .classed(_config.linesContainerClass, true);

    };
    
    /*
        reset
        Resets the style of the layers to _config.style and removes the event listenners
    */
    var reset = function() {
        _feature.getLayers().forEach(function(layer) {
            layer.setStyle(_config.style);
            layer["dataId"] = null;
            layer.removeEventListener("mouseover");
            layer.removeEventListener("mouseout");
        });
    };
    
    /*
        update
        Updates the lines' position when the zoom changes
    */
    var update = function() {
       d3.selectAll(_config.svgContainer+" ."+_config.linesContainerClass+" line")
            .attr("x1", function(d) {
                return mapModule.getMap().latLngToLayerPoint([d.origin.latitude, d.origin.longitude]).x;
            })
            .attr("y1", function(d) {
                return mapModule.getMap().latLngToLayerPoint([d.origin.latitude, d.origin.longitude]).y;
            })
            .attr("x2", function(d) {
                return mapModule.getMap().latLngToLayerPoint([d.destination.latitude, d.destination.longitude]).x;
            })
            .attr("y2", function(d) {
                return mapModule.getMap().latLngToLayerPoint([d.destination.latitude, d.destination.longitude]).y;
            });  
    };
    
    /*
        setFillOpacity(opacity)
        Sets the fill opacity of all the layers
        If the fill color is white, the method has no effect
    */
    var setFillOpacity = function(opacity) {
        _feature.getLayers().forEach(function(layer) {
            
            //The area is made of only one layer
            if(layer.options !== undefined && layer.options.fillColor !== "#fff" && layer.options.fillColor !== "#ffffff")
                layer.setStyle({fillOpacity: opacity});
            
            //The area is made of various sub-layers
            if(layer._layers !== undefined) {
                for(var key in layer._layers) {
                    var subLayer = layer._layers[key];
                    if(subLayer.options !== undefined && subLayer.options.fillColor !== "#fff" && subLayer.options.fillColor !== "#fffff")
                        subLayer.setStyle({fillOpacity: opacity});
                }
            }
        });
    };
    
    /*
        setAreaStyle(id, style)
        Sets the style of the area whose id is id to style
    */
    var setAreaStyle = function(id, style) {
        var layer = _getAreaById(id);
        if(layer === null || layer === undefined) {
            console.log("urbanAreaModule.setAreaStyle: layer shouldn't be null or undefined");
            return;
        }

        layer.setStyle(style);
    };
    
    /*
        resetArea(urbanAreaName)
        Resets the style of the area named urbanAreaName to _config.style
    */
    var resetArea = function(urbanAreaName) {
        (function() {
            var layer = _getArea(urbanAreaName);
            if(layer === null || layer === undefined) {
                console.log("urbanAreaModule.resetArea: layer shouldn't be null or undefined");
                return;
            }
            
            layer.setStyle(_config.style);
        })();
    };
    
    /*
        getDefaultStyle
        Returns the default style of the layers (ie areas)
    */
    var getDefaultStyle = function() {
        return _config.style;  
    };
    
    /*
        setAreaMouseover(id, callback, args)
        Sets for the area whose id is id the callback function "callback" when the event mouseover is caught
        args is the an array of the arguments that are passed to the callback function
        If one of the arguments is actually a function, it is executed passing it as first and only parameter the event caught
    */
    var setAreaMouseover = function(id, callback, args) {
        var layer = _getAreaById(id);
        if(layer === null || layer === undefined) {
            console.log("urbanAreaModule.setAreaMouseover: layer shouldn't be null or undefined");
            return;
        }

        layer.on("mouseover", function(e) {
            //If args contains functions, we execute them before
            var newArgs = [];
            if(args !== null && args !== undefined) {
                args.forEach(function(arg) {
                    if(typeof arg === "function") { 
                        newArgs.push(arg.apply(null, [e]));
                    }
                    else {
                        newArgs.push(arg);
                    }
                });
            }

            callback.apply(null, newArgs) ;
        });
    };
    
    /*
        setAreaMouseout(id, callback, args)
        Sets for the area whose id is id the callback function "callback" when the event mouseout is caught
        args is the an array of the arguments that are passed to the callback function
        If one of the arguments is actually a function, it is executed passing it as first and only parameter the event caught
    */
    var setAreaMouseout = function(id, callback, args) {
        var layer = _getAreaById(id);
        if(layer === null || layer === undefined) {
            console.log("urbanAreaModule.setAreaMouseout: layer shouldn't be null or undefined");
            return;
        }

        layer.on("mouseout", function(e) {
            //If args contains functions, we exexute them before
            var newArgs = [];
            if(args !== null && args !== undefined) {
                args.forEach(function(arg) {
                    if(typeof arg === "function") { 
                        newArgs.push(arg.apply(null, [e]));
                    }
                    else {
                        newArgs.push(arg);
                    }
                });
            }

            callback.apply(null, newArgs) ;
        });
    };
    
    /*
        getAreaData(urbanArea)
        Returns the data binded to the layer getAreaData
    */
    var getAreaData = function(urbanArea) {
        //The object returned depends on the object given
        if(urbanArea.feature !== null && urbanArea.feature !== undefined)
            return urbanArea.feature.properties;
        else if(urbanArea.properties !== null && urbanArea.properties !== undefined)
            return urbanArea.properties;
        else
            console.log("urbanAreaModule.getAreaData: urbanArea not recognized");
    };
    
    /*
        getId(urbanAreaName)
        Returns the id of the layer urbanArea
    */
    var getId = function(urbanArea) {
        if(urbanArea === null || urbanArea === undefined) {
            console.log("urbanAreaModule.getId: urbanArea shouldn't be null or undefined");
            return;
        }

        if(urbanArea.feature.properties.id === null || urbanArea.feature.properties.id === undefined) {
            console.log("urbanAreaModule.getId: returning a null or undefined value");
        }
        
        return urbanArea.feature.properties.id;
    };
    
    return {
        init: init,
        reset: reset,
        update: update,
        displayTopHospitals: displayTopHospitals,
        setFillOpacity: setFillOpacity,
        setAreaStyle: setAreaStyle,
        resetArea: resetArea,
        getDefaultStyle: getDefaultStyle,
        setAreaMouseover: setAreaMouseover,
        setAreaMouseout: setAreaMouseout,
        getAreaData: getAreaData,
        getId: getId,
        deleteLines: deleteLines
    };
})();
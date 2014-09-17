var views = (function() {
    var _config = {
        heatmapColorSchmeme: ["#565756", "#777877", "#999999", "#B8B8B8", "#D6D6D6"], //Color of the heat map, the strongest is the first one
        heatlineColorSchmeme: ["#141414", "#3D3D3D", "#5E5E5E", "#808080", "#999999"], //Color of the heat map, the strongest is the first one
        hiddenLineOpacity: .2, //Opacity of the lines when hidden
        linesContainerClass: "lines", //Container of the lines displayed when a community is clicked
        svgContainer: "#map svg",
        markerClass: "marker" //Class of the markers on the map
    },
        _chartColorPattern = ["#3D7399", "#FF5F40", "#3D998E", "#FF4094", "#994C3D", "#8DCC14"];
    
    /*
        _heatmapColor(ratio)
        Returns the heatmap color for the ratio given as argument
    */
    var _heatmapColor = function(ratio) {
        var color;
        if(ratio > .6)
            color = _config.heatmapColorSchmeme[0];
        else if(ratio > .5)
            color = _config.heatmapColorSchmeme[1];
        else if(ratio > .3)
            color = _config.heatmapColorSchmeme[2];
        else if(ratio > .1)
            color = _config.heatmapColorSchmeme[3];
        else
            color = _config.heatmapColorSchmeme[4];
        return color;
    };
    
    /*
        neighbors
        Returns the methods related to the view "What hospitals do your neighbors go to?"
    */
    var neighbors = function() {
        /*
            init
            Initializes the view
        */
        var init = function() {
            sidebar.searchPlaceholder("ZIP code");
            sidebar.focusOnSearch();
            
            if(!navigator.geolocation)
                return;

            //We locate the user inside a community
            if(window.mozInnerScreenX === undefined)
                app.displayMessage("Retrieving your position...");
            navigator.geolocation.getCurrentPosition(function(position) {
                var latlngPoint = new L.LatLng(position.coords.latitude, position.coords.longitude);
                d3.json("http://nominatim.openstreetmap.org/reverse?format=json&lat="+position.coords.latitude+"&lon="+position.coords.longitude+"&addressdetails=0",function(error, data) {
                    try {
                        if(error) throw error;
                        app.hideMessage();
                        var postalCode = data.display_name.match(/[0-9]{5}/)[0];
                        var urbanAreaId = app.getUrbanAreaIdByZipCode(postalCode);
                        if(urbanAreaId.length === 0 || urbanAreaId.length > 1)
                            throw "Error";
                        else
                            urbanAreaId = urbanAreaId[0];
                        var mapboxObject = urbanAreas.getAreaById(urbanAreaId);
                        var dataObject = urbanAreas.getAreaData(urbanAreas.getAreaById(urbanAreaId));
                        app.view().areaClicked(dataObject, mapboxObject.getBounds().getCenter());
                    }
                    catch(e) {
                        app.displayMessage("Your position couldn't be determined. Enter you ZIP code in the sidebar's search box.");
                        setTimeout(function() {app.hideMessage()}, 8000);
                        if(!(e instanceof TypeError)) {
                            console.log("views module: the call to Nominatim returned an error");
                            console.log(error);
                        }
                    }
                });
            }, function() {
                app.hideMessage();
            });
        };
        
        /*
            searchValueChanged(value)
            Searches the postal code and offers an autocomplete form
        */
        var searchValueChanged = function(value) {
            if(value === "")
                return sidebar.resetAutocomplete();
            
            var zipCodes = app.getZipCodesStartingWith(value);
            sidebar.resetAutocomplete();
            var alreadyDisplayedZipCodes = [];
            zipCodes.forEach(function(zipCode) {
                try {
                    if(alreadyDisplayedZipCodes.indexOf(zipCode) === -1) {
                        alreadyDisplayedZipCodes.push(zipCode);
                        var urbanAreaIds = app.getUrbanAreaIdByZipCode(zipCode);
                        urbanAreaIds.forEach(function(urbanAreaId) {
                            var urbanArea = app.getUrbanArea(urbanAreaId);
                            var urbanAreaCity = urbanArea.properties.town;
                            var urbanAreaState = urbanArea.properties.state;
                            var content = "<span>"+value+"</span>"+((value.length - zipCode.length !== 0) ? zipCode.slice(value.length - zipCode.length) : "")+" "+urbanAreaCity+", "+urbanAreaState;

                            sidebar.addAutocomplete(content, urbanAreaId, {
                                onclick: function() {
                                    app.view().areaClicked(urbanArea.properties, urbanAreas.getAreaById(urbanAreaId).getBounds().getCenter());
                                    sidebar.resetAutocomplete();
                                    sidebar.searchValue("");
                                }
                            });
                        });
                    }
                } catch(e) {}
            });
        };
        
        /*
            searchValueSelected(value)
            Using value as a community's id, launches the corresponding handler
        */
        var searchValueSelected = function(value) {
            try {
                var urbanArea = app.getUrbanArea(value);
                app.view().areaClicked(urbanArea.properties, urbanAreas.getAreaById(value).getBounds().getCenter());
                sidebar.resetAutocomplete();
            }
            catch(e) {
                console.log("views module: the value doesn't match any id");
                console.log(e);
            }
        };
        
        /*
            hospitalClicked(d, marker)
            Displays a heat map based on patients' origin
            d is the data of the selected hospital, and marker the one which was clicked
        */
        var hospitalClicked = function(d, marker) {
            var target = "sidebar";
            var savedState = app.getSavedState();
            if(app.isCompareModeActive()) {
                if(app.getSelection().type !== "hospital" || app.getSelection().ids.indexOf(d.id) != -1)
                    return;
                
                app.hideMessage();
                target = "panel";
                sidebar.resetCardsOffset();

                //We remove the last element selected from the array of the selected elements
                if(app.getSelection().ids.length !== 1)
                    app.popSelectedIds();
            }
            else
                app.resetSelectedIds();

            app.setSelectedType("hospital");
            app.pushSelectedIds(d.id);

            if(!app.isCompareModeActive()) {
                urbanAreas.reset();
                app.saveState("hospital", {
                    areasToRestore: [],
                    markerToRestore: d.id
                });
                savedState = app.getSavedState();
            }
            else {
                urbanAreas.reset(savedState.hospital.areasToReset);

                //We restore some others
                for(var i = 0; i < savedState.hospital.areasToRestore.length; i++) {
                    urbanAreas
                        .setAreaStyle(savedState.hospital.areasToRestore[i].id, {
                            fillColor: savedState.hospital.areasToRestore[i].fillColor,
                            fillOpacity: .8
                        });
                }
            }

            savedState.hospital.areasToReset = [];

            //We highlight the marker
            markers.reset();
            markers.highlightMarker(savedState.hospital.markerToRestore);
            markers.highlightMarker(d.id);

            //We delete the lines
            urbanAreas.deleteLines();

            //We change the opacity of the markers
            d3.selectAll("."+_config.markerClass)
                .style("opacity", function(d) {
                    if(this === marker)
                        return 1;
                    return _config.hiddenMarkerOpacity;
                });

            app.displayGeneralCard(d, target);

            /* Patients' origin */
            var node = d3.select(document.createElement("div"));
            node.append("h1").text("Patients' origin");
            var table = node.append("table")

            var currentRow = table.append("tr");
            currentRow.append("th").classed("w40", true).html("Community<sup>1</sup>");
            currentRow.append("th").classed("w30", true).style("text-align", "center").text("Patients");
            currentRow.append("th").style("text-align", "center").html("% of discharges<sup>2</sup>");

            var totalPatients = 0;
            d.topCommunities.forEach(function(topCommunity) {
                totalPatients += topCommunity.patients;
            });

            d.topCommunities.forEach(function(topCommunity) {
                var defaultStyle = urbanAreas.getDefaultStyle();
                var percentage = (topCommunity.percentage === null) ? "–" : ((topCommunity.percentage * 100 <= 1) ? "<1" : Math.round(topCommunity.percentage * 100));

                currentRow = table.append("tr")
                    .data([{id: topCommunity.id_town}])
                    .on("mouseover", function() {
                        var color = _heatmapColor(topCommunity.patients / totalPatients);
                        d3.select(urbanAreas.getAreaById(topCommunity.id_town)._path).classed("hovered", true);
                        d3.select(this).classed("hovered", true);
                    })
                    .on("mouseout", function() {
                        urbanAreas.setFillOpacity(1);
                        d3.select(urbanAreas.getAreaById(topCommunity.id_town)._path).classed("hovered", false);
                        d3.select(this).classed("hovered", false);
                    });
                currentRow.append("td").text(app.getUrbanArea(topCommunity.id_town).properties.town);
                currentRow.append("td").classed("number", true).text(topCommunity.patients);
                currentRow.append("td")
                    .classed("number", true)
                    .text((percentage !== "–") ? percentage+"%" : percentage);

                if(!app.isCompareModeActive()) {
                    (function() {
                        var areasToReset = savedState.hospital.areasToReset;
                        areasToReset.push({id: topCommunity.id_town, fillColor: _heatmapColor(topCommunity.patients / totalPatients)});
                        app.saveState("hospital", {
                            areasToReset: areasToReset 
                        });
                    })();
                }
                else if(app.isCompareModeActive() && savedState.hospital.areasToRestore.indexOf(topCommunity.id_town) === -1) {
                    (function() {
                        var areasToReset = savedState.hospital.areasToReset;
                        areasToReset.push(topCommunity.id_town);
                        app.saveState("hospital", {
                            areasToReset: areasToReset 
                        });
                    })();
                }

                //We're displaying the heat map
                var indexAreasToRestore = app.getAreasToRestoreIndex(topCommunity.id_town);
                if(app.isCompareModeActive() || indexAreasToRestore === -1 || _config.heatmapColorSchmeme.indexOf(savedState.hospital.areasToRestore[indexAreasToRestore].fillColor) > _config.heatmapColorSchmeme.indexOf(_heatmapColor(topCommunity.patients / totalPatients))) {
                    urbanAreas
                        .setAreaStyle(topCommunity.id_town, {
                            fillColor: _heatmapColor(topCommunity.patients / totalPatients),
                            fillOpacity: .8
                        });
                }
            });

            //No data for the hospital
            if(node.selectAll("tr").size() == 1) {
                currentRow = table.append("tr");
                currentRow.append("td").text("No data");
                currentRow.append("td");
                currentRow.append("td");
            }

            node.append("div")
                .classed("footnote", true)
                .html("<sup>1</sup> Only the top 10<sup>-</sup> communities are represented<br><sup>2</sup> Percentage of the community discharges");

            sidebar.addcard(node, true, target);

            /* DRGs */
            node = d3.select(document.createElement("div"));
            node.append("h1").text("DRGs");
            var table = node.append("table");

            var currentRow = table.append("tr");
            currentRow.append("th").classed("w40", true).html("Name<sup>1</sup>");
            currentRow.append("th").classed("w30", true).style("text-align", "center").text("Patients");
            currentRow.append("th").style("text-align", "center").text("% of community");

            d.topDRGs.forEach(function(topDRG) {
                var percentage = (topDRG.percentage === null) ? "–" : ((topDRG.percentage * 100 <= 1) ? "<1" : Math.round(topDRG.percentage * 100));
                currentRow = table.append("tr");
                currentRow.append("td").text(topDRG.name);
                currentRow.append("td").classed("number", true).text(topDRG.patients);
                currentRow.append("td")
                    .classed("number", true)
                    .text((percentage !== "–") ? percentage+"%" : percentage);
            });

            //No data for the hospital
            if(node.selectAll("tr").size() == 1) {
                currentRow = table.append("tr");
                currentRow.append("td").text("No data");
                currentRow.append("td");
                currentRow.append("td");
            }

            node.append("div")
                .classed("footnote", true)
                .html("<sup>1</sup> Only the top 10<sup>-</sup> DRGs are represented");

            sidebar.addcard(node, true, target);
        };
        
        /*
        areaClicked(layerClicked, center)
        Displays all the cards related to the selected community, and display a lines based on the patients' destination hospitals
        layerClicked is the data of the selected community, and center is the calculated center of the community
        */
        var areaClicked = function(layerClicked, center) {
            var target = "sidebar";
            if(app.isCompareModeActive()) {
                if(app.getSelection().type !== "community" || app.getSelection().ids.indexOf(layerClicked.id) !== -1)
                    return;
                
                app.hideMessage();
                target = "panel";
                sidebar.resetCardsOffset();

                //We remove the last element selected from the array of the selected elements
                if(app.getSelection().ids.length !== 1)
                    app.popSelectedIds();
            }
            else {
                app.resetSelectedIds();
                app.setSelectedType("community");
            }

            app.pushSelectedIds(layerClicked.id);
            urbanAreas.reset();
            markers.reset();
            markers.hideMarkers();

            var savedState = app.getSavedState();
            
            if(!app.isCompareModeActive()) {
                urbanAreas.deleteLines();
                app.saveState("community", {
                    areaToRestore: layerClicked.id,
                    markersToRestore: []
                });
            }
            else {

                //We delete the lines
                for(var i = 0; i < savedState.community.linesToDelete.length; i++) {
                    savedState.community.linesToDelete[i].remove();
                }

                //We restore the first clicked area
                if(urbanAreas.getAreaById(savedState.community.areaToRestore)._path !== undefined)
                    d3.select(urbanAreas.getAreaById(savedState.community.areaToRestore)._path).classed("hovered", true);
                else {
                    var layers = urbanAreas.getAreaById(savedState.community.areaToRestore)._layers;
                    for(var key in layers) {
                        d3.select(layers[key]._path).classed("hovered", true);
                    }
                }

                //We restore the markers
                for(var i = 0; i < savedState.community.markersToRestore.length; i++) {
                    markers.addSelectedMarker(savedState.community.markersToRestore[i]);
                    markers.restoreSelectedMarkers();
                    markers.highlightMarker(savedState.community.markersToRestore[i]);
                }
            }

            app.displayGeneralCard(layerClicked, target);

            var isBorderCommunity = urbanAreas.isBorderCommunity(layerClicked.id);

            /* Patients' origin */
            var node = d3.select(document.createElement("div"));
            node.append("h1").text("Patients' destination hospitals");
            node.append("div").classed("chart-destination-"+target, true).style("height", "150px");
            var table = node.append("table")
            var currentRow = table.append("tr");
            currentRow.append("th").classed("w50", true).html("Hospital<sup>1</sup>"+((isBorderCommunity) ? "<sup>2</sup>" : ""));
            currentRow.append("th").classed("w25", true).style("text-align", "center").text("Patients");
            currentRow.append("th").style("text-align", "center").text("% of patients /hospital");

            var totalPatients = 0;
            layerClicked.topHospitals.forEach(function(topHospital) {
                totalPatients += topHospital.patients;
            });

            //We highlight the community
            if(urbanAreas.getAreaById(layerClicked.id)._path !== undefined)
                d3.select(urbanAreas.getAreaById(layerClicked.id)._path).classed("hovered", true);
            else {
                var layers = urbanAreas.getAreaById(layerClicked.id)._layers;
                for(var key in layers) {
                    d3.select(layers[key]._path).classed("hovered", true);
                }
            }
            
            var chartData = [];
            var originCoords = mapModule.getMap().latLngToLayerPoint([center.lat, center.lng]);
            var maxThickness = 0;

            layerClicked.topHospitals.forEach(function(topHospital) {
                var percentage = (topHospital.percentage === null) ? "–" : ((topHospital.percentage * 100 <= 1) ? "<1" : Math.round(topHospital.percentage * 100));
                var hospital = app.getHospital(topHospital.id_hospital);
                chartData.push([hospital.name, topHospital.patients]);

                currentRow = table.append("tr")
                    .data([{id: topHospital.id_hospital}])
                    .on("mouseover", function(d) {
                        markers.hideMarkers();
                        d3.select(markers.getMarker(d.id)).style("opacity", 1);

                        var id = d.id;
                        d3.selectAll(_config.svgContainer+" ."+_config.linesContainerClass+" line")
                            .style("opacity", function(d) {
                                if(d.id != id)
                                    return _config.hiddenLineOpacity;
                                return 1;
                            });

                        d3.select(this).classed("hovered", true);
                        d3.select(this).selectAll("td").each(function() {d3.select(this).style('background-color', chart.color(hospital.name));});
                    
                        //We highlight the data in the chart
                        chart.focus(hospital.name);
                    })
                    .on("mouseout", function() {
                        markers.restoreSelectedMarkers();

                        d3.select(this).classed("hovered", false);
                        d3.select(this).selectAll("td").style("background-color", null);

                        d3.selectAll(_config.svgContainer+" ."+_config.linesContainerClass+" line")
                            .style("opacity", 1);
                    
                        //We un-highlight the data in the chart
                        chart.revert();
                    });
                currentRow.append("td").classed("legend", true).html("<span data-id=\""+hospital.name+"\"></span>"+hospital.name);
                currentRow.append("td").classed("number", true).text(topHospital.patients);
                currentRow.append("td").classed("number", true).text((percentage !== "–") ? percentage+"%" : percentage);

                //We highlight the marker of the current hospital
                var marker = markers.getMarker(topHospital.id_hospital);
                d3.select(marker).style("opacity", 1);
                markers.addSelectedMarker(marker);
                markers.highlightMarker(topHospital.id_hospital);

                //We save the markers linked to the first clicked area
                if(!app.isCompareModeActive()) {
                    (function() {
                        var markersToRestore = savedState.community.markersToRestore;
                        markersToRestore.push(topHospital.id_hospital);
                        app.saveState("community", {
                            markersToRestore: markersToRestore
                        });
                    })();
                }

                //We add the line
                var destinationCoords = mapModule.getMap().latLngToLayerPoint([app.getHospital(topHospital.id_hospital).latitude, app.getHospital(topHospital.id_hospital).longitude]);

                var line = d3.select(_config.svgContainer+" ."+_config.linesContainerClass)
                    .data([{
                        id: topHospital.id_hospital,
                        origin: {
                            latitude: center.lat,
                            longitude: center.lng
                        },
                        destination: {
                            latitude: app.getHospital(topHospital.id_hospital).latitude,
                            longitude: app.getHospital(topHospital.id_hospital).longitude
                        }
                    }])
                    .append("path")
                    .style("stroke", function() {
                        var ratio = topHospital.patients / totalPatients;
                        if(ratio > .5)
                            return _config.heatlineColorSchmeme[0];
                        if(ratio > .5)
                             return _config.heatlineColorSchmeme[1];
                        if(ratio > .3)
                             return _config.heatlineColorSchmeme[2];
                        if(ratio > .1)
                             return _config.heatlineColorSchmeme[3];
                        return _config.heatlineColorSchmeme[4];
                    })
                    .style("stroke-width", function() {
                        var ratio = topHospital.patients / totalPatients;
                        var thickness;
                        if(ratio > .6)
                            thickness = 7;
                        else if(ratio > .5)
                            thickness = 6;
                        else if(ratio > .3)
                            thickness = 5;
                        else if(ratio > .1)
                            thickness = 4;
                        else
                            thickness = 3;
                        
                        if(thickness > maxThickness)
                            maxThickness = thickness;
                        
                        return thickness+"px";
                    })
                    .attr("d", function(d) {
                        var dx = destinationCoords.x - originCoords.x,
                            dy = destinationCoords.y - originCoords.y,
                            dr = Math.sqrt(dx * dx + dy * dy);
                        
                        return "M"+originCoords.x+","+originCoords.y+"A"+dr+","+dr+" 0 0,1 "+destinationCoords.x+","+destinationCoords.y;
                    });
//                    .attr("x1", originCoords.x)
//                    .attr("y1", originCoords.y)
//                    .attr("x2", destinationCoords.x)
//                    .attr("y2", destinationCoords.y);

                if(app.isCompareModeActive()) {
                    (function() {
                        var linesToDelete = savedState.community.linesToDelete;
                        linesToDelete.push(line);
                        app.saveState("community", {
                            linesToDelete: linesToDelete
                        });
                    })();
                }
            });
            
            //We add a circle in the center
            var circle = d3.select(_config.svgContainer+" ."+_config.linesContainerClass)
                .append("circle")
                .data([{
                    origin: {
                        latitude: center.lat,
                        longitude: center.lng
                    }
                }])
                .classed("highlighted", true)
                .attr("cx", originCoords.x)
                .attr("cy", originCoords.y)
                .attr("r", maxThickness+"px");

            //No data for the community
            if(node.selectAll("tr").size() == 1) {
                currentRow = table.append("tr");
                currentRow.append("td").text("No data");
                currentRow.append("td");
                currentRow.append("td");
            }

            node.append("div")
                .classed("footnote", true)
                .html("<sup>1</sup> These data only take into account the patients coming from the top 10<sup>-</sup> communities"+((isBorderCommunity) ? "<br/><sup>2</sup> No relevant data for people going to out-of-state hospitals": ""));

            sidebar.addcard(node, true, target);
            
            if(chartData.length === 0)
                return node.select(".chart-destination-"+target).remove();
            
            //We add the chart
            var chart = c3.generate({
                bindto: ".chart-destination-"+target,
                data: {
                    columns: chartData,
                    type : 'pie'
                },
                pie: {
                    label: {
                        show: false
                    },
                    
                },
                legend: {
                    show: false
                },
                size: {
                    width: 310,
                    height: 150
                },
                padding: {
                    top: 10,
                    left: 35
                },
                color: {
                    pattern: _chartColorPattern
                }
            });
            
                        
            //We give the colors to the squares in the table
            node.selectAll('tr span').each(function () {
                var id = d3.select(this).attr('data-id');
                d3.select(this).style('background-color', chart.color(id));
            });
        };
        
        return {
            init: init,
            searchValueChanged: searchValueChanged,
            searchValueSelected: searchValueSelected,
            hospitalClicked: hospitalClicked,
            areaClicked: areaClicked
        };
    };
    
    return {
        neighbors: neighbors  
    };
})();
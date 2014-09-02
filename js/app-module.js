var app = (function() {
    var _config = {
        messageElem: "#message", //The container of the message below the questions' div (at the top of the window)
        heatmapColorSchmeme: ["#565756", "#777877", "#999999", "#B8B8B8", "#D6D6D6"], //Color of the heat map, the strongest is the first one
        heatlineColorSchmeme: ["#141414", "#3D3D3D", "#5E5E5E", "#808080", "#999999"], //Color of the heat map, the strongest is the first one
        hiddenLineOpacity: .2, //Opacity of the lines when hidden
        linesContainerClass: "lines", //Container of the lines displayed when a community is clicked
        svgContainer: "#map svg",
        markerClass: "marker" //Class of the markers on the map
    },
        _elementPicked, //Contains "hospital" or "community" depending on what has been clicked on the map
        _idElementPicked = [], //Contains the ids of the chosen elements
        _compareMode = false, //Indicates if the compare mode is active
        _borderCommunities = [1,8,28,30,31,37,47,50,53,55,63,65,66,75,86,101,102,104,107,109,115,116,132,138,142,150,157,167,168,169,170,181,183,185,198,199,210,216,230,240,241,245,256,257,259,261,263,272,276,281,285,297,302,304,307,309,315,322,330,336,340,342,343,343,366,367],
        _savedState = { //Contains information about the state before the compare mode was active in order to restore it
            hospital: { //The labels correspond to _elementPicked
                areasToReset: [],
                areasToRestore: [],
                markerToRestore: null
            },
            community: {
                linesToDelete: [],
                areaToRestore: null,
                markersToRestore: []
            }
        };
    
    /*
        init
        Calls the the init functions of the modules which need an initialization
    */
    var init = function() {
        sidebar.init();
    };
    
    /*
        toDollar(number)
        Converts a number to the US currency format ie 130868 to $130,868
        Doesn't take the decimals into account
    */
    var _toDollar = function(number) {
        var res = "";
        var stringifyNb = String(number);
        var mod = stringifyNb.length % 3;
        
        for(var i = 0; i < stringifyNb.length; i++) {
            if(stringifyNb.length > 3 && i + 1 === mod)
                res = stringifyNb.slice(0, (i + 1 <= stringifyNb.length) ? i + 1 : undefined)+",";
            else if(stringifyNb.length > 3 && i !== stringifyNb.length - 1 && (i + 1 - mod) % 3 === 0)
                res = res+stringifyNb[i]+",";
            else
                res = res+stringifyNb[i];
        }
        
        return "$"+res;
    };

    /*
        _displayGeneralCard(d, target)
        Displays the top card which contains general information about the element clicked
        d contains the data to display and target the column in which the card will be
    */
    var _displayGeneralCard = function(d, target) {
        var node = d3.select(document.createElement("div"));
        
        node.data([{id: 0}]);
        
        if(_elementPicked === "hospital") {
            var beds = (d.staffedBeds !== null) ? d.staffedBeds : "–";
            var occupancy = (Math.round(d.occupancy * 100) > 1) ? Math.round(d.occupancy * 100)+"%" : "<1%";
            var revenue = d.revenues.fy12;
            
            node.append("h1").html(d.name+" <a href='#' target='_blank'><i class='fa fa-external-link'></i></a>");
            node.append("div")
                .classed("two-columns", true)
                .html("Staffed bed<sup>1</sup><br/>Total occupancy<sup>1</sup><br/>Total revenue<sup>1</sup><br/><span>"+beds+"</span><br/><span>"+occupancy+"</span><br/><span>"+_toDollar(revenue)+"</span>");
            
            node.append("div").classed("chart", true);
            
            node.append("div")
                .classed("footnote", true)
                .html("<sup>1</sup> For the 2012 fiscal year<br/>Data from the <a href=\"http://www.mass.gov/chia/researcher/hcf-data-resources/massachusetts-hospital-profiles/overiew-and-current-reports.html\" target=\"_blank\">Center for Health Information and Analysis <i class='fa fa-external-link'></i></a>");
            
            sidebar.reset(target);
            sidebar.addcard(node, true, target);
            
            //We add the chart
            var chart = c3.generate({
                bindto: ".chart",
                data: {
                    x: "x",
                    columns: [
                        ["data", d.revenues.fy08, d.revenues.fy09, d.revenues.fy10, d.revenues.fy11, d.revenues.fy12],
                        ["x", 2008, 2009, 2010, 2011, 2012]
                    ]
                },
                axis: {
                    y: {
                        tick: {
                            culling: {
                                max: 4  
                            },
                            format: function(d) {return _toDollar(Math.round(d / 1000000))+"m";}
                        },
                        ticks: 4
                    }
                },
                legend: {
                    show: false
                },
                interaction: {
                    enabled: false
                },
                size: {
                    width: 310,
                    height: 150
                },
                padding: {
                    top: 10,
                    left: (revenue > 999999999) ? 49 : ((revenue > 99999999) ? 41 : 35)
                }
            });
        }
        else {
            node.append("h1").html(d.town);
            node.append("div")
                .classed("two-columns", true)
                .html("Some stuffs here<br/><span>...</span>");
            
            node.append("div")
                .classed("footnote", true)
                .html("Data from the <a href=\"http://www.mass.gov/chia/researcher/hcf-data-resources/massachusetts-hospital-profiles/overiew-and-current-reports.html\" target=\"_blank\">Center for Health Information and Analysis <i class='fa fa-external-link'></i></a>");
            
            sidebar.reset(target);
            sidebar.addcard(node, true, target);
        }
    };
    
    /*
        getUrbanArea(id)
        Returns the record which id is id from the _urbanAreaData object
    */
    var getUrbanArea = function(id) {
            return _urbanAreasData.features[id];  
    };

    /*
        getHospital(id)
        Returns the record which id is id from the _hospitalData object
    */
    var getHospital = function(id) {
            return _hospitalsData.hospitals[id];  
    };
    
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
        _indexAreasToRestore(id, type)
        Returns the position of the object whose id is id from the array _savedState.[type].areasToRestore if exists, otherwise returns -1
        type should be "hospital" or "community"
    */
    var _indexAreasToRestore = function(id, type) {
        for(var i = 0; i < _savedState[type].areasToRestore.length; i++) {
            if(_savedState[type].areasToRestore[i].id === id) {
                return i;
            }
        }
        return -1;
    };
    
    /*
        hospitalClicked(d, marker)
        Displays all the cards related to the selected hospital, and display a heat map based on patients' origin
        d is the data of the selected hospital, and marker the one which was clicked
    */
    var hospitalClicked = function(d, marker) {
        var target = "sidebar";
        if(_compareMode) {
            if(_elementPicked !== "hospital" || _idElementPicked.indexOf(d.id) != -1)
                return;
            hideMessage();
            target = "panel";
            
            //We reset the margin-top of the sidebar's cards
            sidebar.resetCardsOffset();
            
            //We remove the last element selected from the array of the selected elements
            if(_idElementPicked.length !== 1)
                _idElementPicked.pop();
        }
        else
            _idElementPicked = []; //We reset the elements chosen
        
        _elementPicked = "hospital";
        _idElementPicked.push(d.id);
        
        if(!_compareMode) {
            urbanAreas.reset();
            _savedState.hospital.areasToRestore = [];
            _savedState.hospital.markerToRestore = d.id;
        }
        else {
            //We reset some areas
            urbanAreas.reset(_savedState.hospital.areasToReset);
            
            //We restore some others
            for(var i = 0; i < _savedState.hospital.areasToRestore.length; i++) {
                urbanAreas
                    .setAreaStyle(_savedState.hospital.areasToRestore[i].id, {
                        fillColor: _savedState.hospital.areasToRestore[i].fillColor,
                        fillOpacity: .8
                    });
            }
        }
        
        _savedState.hospital.areasToReset = [];
        
        //We highlight the marker
        markers.reset();
        markers.highlightMarker(_savedState.hospital.markerToRestore);
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
        
        _displayGeneralCard(d, target);
        
        /* Patients' origin */
        var node = d3.select(document.createElement("div"));
        node.append("h1")
            .text("Patients' origin");
        var table = node.append("table")
        
        var currentRow = table.append("tr");
        currentRow.append("th")
            .classed("w40", true)
            .html("Community<sup>1</sup>");
        currentRow.append("th")
            .classed("w30", true)
            .style("text-align", "center")
            .text("Patients");
        currentRow.append("th")
            .style("text-align", "center")
            .html("% of discharges<sup>2</sup>");
        
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
            currentRow.append("td")
                .text(getUrbanArea(topCommunity.id_town).properties.town);
            currentRow.append("td")
                .classed("number", true)
                .text(topCommunity.patients);
            currentRow.append("td")
                .classed("number", true)
                .text((percentage !== "–") ? percentage+"%" : percentage);
            
            if(_compareMode && _savedState.hospital.areasToRestore.indexOf(topCommunity.id_town) === -1)
                _savedState.hospital.areasToReset.push(topCommunity.id_town);
            
            if(!_compareMode)
                _savedState.hospital.areasToRestore.push({id: topCommunity.id_town, fillColor: _heatmapColor(topCommunity.patients / totalPatients)});
            
            //We're displaying the heat map
            var indexAreasToRestore = _indexAreasToRestore(topCommunity.id_town, "hospital");
            if(!_compareMode || indexAreasToRestore === -1 || _config.heatmapColorSchmeme.indexOf(_savedState.hospital.areasToRestore[indexAreasToRestore].fillColor) > _config.heatmapColorSchmeme.indexOf(_heatmapColor(topCommunity.patients / totalPatients))) {
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
            currentRow.append("td")
                .text("No data");
            currentRow.append("td");
            currentRow.append("td");
        }
        
        node.append("div")
            .classed("footnote", true)
            .html("<sup>1</sup> Only the top 10<sup>-</sup> communities are represented<br><sup>2</sup> Percentage of the community discharges");
        
        sidebar.addcard(node, true, target);
        
        /* DRGs */
        node = d3.select(document.createElement("div"));
        node.append("h1")
            .text("DRGs");
        var table = node.append("table");
        
        var currentRow = table.append("tr");
        currentRow.append("th")
            .classed("w40", true)
            .html("Name<sup>1</sup>");
        currentRow.append("th")
            .classed("w30", true)
            .style("text-align", "center")
            .text("Patients");
        currentRow.append("th")
            .style("text-align", "center")
            .text("% of community");

        d.topDRGs.forEach(function(topDRG) {
            var percentage = (topDRG.percentage === null) ? "–" : ((topDRG.percentage * 100 <= 1) ? "<1" : Math.round(topDRG.percentage * 100));
            currentRow = table.append("tr");
            currentRow.append("td")
                .text(topDRG.name);
            currentRow.append("td")
                .classed("number", true)
                .text(topDRG.patients);
            currentRow.append("td")
                .classed("number", true)
                .text((percentage !== "–") ? percentage+"%" : percentage);
        });
        
        //No data for the hospital
        if(node.selectAll("tr").size() == 1) {
            currentRow = table.append("tr");
            currentRow.append("td")
                .text("No data");
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
        if(_compareMode) {
            if(_elementPicked !== "community" || _idElementPicked.indexOf(layerClicked.id) !== -1)
                return;
            hideMessage();
            target = "panel";
            
            //We reset the margin-top of the sidebar's cards
            sidebar.resetCardsOffset();
            
            //We remove the last element selected from the array of the selected elements
            if(_idElementPicked.length !== 1)
                _idElementPicked.pop();
        }
        else
            _idElementPicked = []; //We reset the chosen elements
        
        _elementPicked = "community";
        _idElementPicked.push(layerClicked.id);
        
        urbanAreas.reset();
                
        markers.reset();
        
        //We hide all the markers
        markers.hideMarkers();
        
        if(!_compareMode) {
            //We delete all the lines
            urbanAreas.deleteLines();
            
            //We save the sate of the first clicked area
            _savedState.community.areaToRestore= layerClicked.id;
            
            //We reset the saved markers
            _savedState.community.markersToRestore = [];
        }
        else {
            //We delete the lines
            for(var i = 0; i < _savedState.community.linesToDelete.length; i++) {
                _savedState.community.linesToDelete[i].remove();
            }
            
            //We restore the first clicked area
            if(urbanAreas.getAreaById(_savedState.community.areaToRestore)._path !== undefined)
                d3.select(urbanAreas.getAreaById(_savedState.community.areaToRestore)._path).classed("hovered", true);
            else {
                var layers = urbanAreas.getAreaById(_savedState.community.areaToRestore)._layers;
                for(var key in layers) {
                    d3.select(layers[key]._path).classed("hovered", true);
                }
            }
            
            //We restore the markers
            for(var i = 0; i < _savedState.community.markersToRestore.length; i++) {
                markers.addSelectedMarker(_savedState.community.markersToRestore[i]);
                markers.restoreSelectedMarkers();
                markers.highlightMarker(_savedState.community.markersToRestore[i]);
            }
        }
            
        _displayGeneralCard(layerClicked, target);
                
        var isBorderCommunity = (_borderCommunities.indexOf(layerClicked.id) !== -1) ? true : false;
        
        /* Patients' origin */
        var node = d3.select(document.createElement("div"));
        node.append("h1")
            .text("Patients' destination hospitals");
        var table = node.append("table")
        
        var currentRow = table.append("tr");
        currentRow.append("th")
            .classed("w50", true)
            .html("Hospital<sup>1</sup>"+((isBorderCommunity) ? "<sup>2</sup>" : ""));
        currentRow.append("th")
            .classed("w25", true)
            .style("text-align", "center")
            .text("Patients");
        currentRow.append("th")
            .style("text-align", "center")
            .text("% of patients /hospital");
        
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
        
        layerClicked.topHospitals.forEach(function(topHospital) {
            var percentage = (topHospital.percentage === null) ? "–" : ((topHospital.percentage * 100 <= 1) ? "<1" : Math.round(topHospital.percentage * 100));
            var hospital = getHospital(topHospital.id_hospital);

            currentRow = table.append("tr")
                .data([{id: topHospital.id_hospital}])
                .on("mouseover", function(d) {
                    markers.hideMarkers();
                    d3.select(markers.getMarker(d.id))
                        .style("opacity", 1);
                    
                    var id = d.id;
                    d3.selectAll(_config.svgContainer+" ."+_config.linesContainerClass+" line")
                        .style("opacity", function(d) {
                            if(d.id != id)
                                return _config.hiddenLineOpacity;
                            return 1;
                        });

                    d3.select(this)
                        .classed("hovered", true);
                })
                .on("mouseout", function() {
                    markers.restoreSelectedMarkers();
                    
                    d3.select(this)
                        .classed("hovered", false);
                    
                    d3.selectAll(_config.svgContainer+" ."+_config.linesContainerClass+" line")
                        .style("opacity", 1);
                });
            currentRow.append("td")
                .text(hospital.name);
            currentRow.append("td")
                .classed("number", true)
                .text(topHospital.patients);
            currentRow.append("td")
                .classed("number", true)
                .text((percentage !== "–") ? percentage+"%" : percentage);
            
            //We highlight the marker of the current hospital
            var marker = markers.getMarker(topHospital.id_hospital);
            d3.select(marker)
                .style("opacity", 1);
            markers.addSelectedMarker(marker);
            markers.highlightMarker(topHospital.id_hospital);
            
            //We save the markers linked to the first clicked area
            if(!_compareMode)
                _savedState.community.markersToRestore.push(topHospital.id_hospital);
            
            //We add the line
            var originCoords = mapModule.getMap().latLngToLayerPoint([center.lat, center.lng]);
            var destinationCoords = mapModule.getMap().latLngToLayerPoint([getHospital(topHospital.id_hospital).latitude, getHospital(topHospital.id_hospital).longitude]);
            
            var line = d3.select(_config.svgContainer+" ."+_config.linesContainerClass)
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
                    return thickness+"px";
                })
                .attr("x1", originCoords.x)
                .attr("y1", originCoords.y)
                .attr("x2", destinationCoords.x)
                .attr("y2", destinationCoords.y);
            
            if(_compareMode)
                _savedState.community.linesToDelete.push(line);
        });
        
        //No data for the community
        if(node.selectAll("tr").size() == 1) {
            currentRow = table.append("tr");
            currentRow.append("td")
                .text("No data");
            currentRow.append("td");
            currentRow.append("td");
        }
        
        node.append("div")
            .classed("footnote", true)
            .html("<sup>1</sup> These data only take into account the patients coming from the top 10<sup>-</sup> communities"+((isBorderCommunity) ? "<br/><sup>2</sup> No relevant data for people going to out-of-state hospitals": ""));
        
        sidebar.addcard(node, true, target);
    };
    
    /*
        displayMessage
        Displays the html content content below the questions selector, at the top of the window
    */
    var displayMessage = function(content) {
        _isMessageDisplayed = true;
        
        d3.select(_config.messageElem)
            .style("visibility", "visible")
            .classed("fadeInDown", true)
            .classed("fadeOutUp", false)
            .html(content);
        
        //We center the message in the available width
        var sidebarWidth = sidebar.getSidebarWidth();
        d3.select(_config.messageElem).style({"width": "calc(100% - "+sidebarWidth+"px)", "padding-right": sidebarWidth+"px"});
        
//        if(_compareMode)
//            d3.select(_config.messageElem).style({"width": "calc(100% - 700px)", "padding-right": "700px"});
//        else
//            d3.select(_config.messageElem).style({"width": "calc(100% - 350px)", "padding-right": "350px"});
    };
    
    /*
        hideMessage
        Hides the message which is at the top of the window
    */
    var hideMessage = function() {
        _isMessageDisplayed = false;
        
        d3.select(_config.messageElem)
            .classed("fadeInDown", false)
            .classed("fadeOutUp", true);
    };
    
    /*
        getMode
        Returns "hospital" or "community" depending on the item which has been clicked on the map
    */
    var getMode = function() {
        return _elementPicked;  
    };
    
    /*
        compareMode(isActivated)
        Sets _compareMode to true if isActivated is true, false if isActivated is false
        Useful to tell the module if the user is currently using the compare mode
    */
    var compareMode = function(isActivated) {
        _compareMode = isActivated;
        
        if(isActivated === false) {
            if(_elementPicked === "hospital") {
                //We reset some areas
                urbanAreas.reset(_savedState.hospital.areasToReset);

                //We restore some others
                for(var i = 0; i < _savedState.hospital.areasToRestore.length; i++) {
                    urbanAreas
                        .setAreaStyle(_savedState.hospital.areasToRestore[i].id, {
                            fillColor: _savedState.hospital.areasToRestore[i].fillColor,
                            fillOpacity: .8
                        });
                }
                
                _savedState.hospital.areasToReset = [];
        
                //We highlight the marker
                markers.reset();
                markers.highlightMarker(_savedState.hospital.markerToRestore);
            }
            else {
                urbanAreas.reset();
                markers.reset();

                //We hide all the markers
                markers.hideMarkers();
                
                //We delete the lines
                for(var i = 0; i < _savedState.community.linesToDelete.length; i++) {
                    _savedState.community.linesToDelete[i].remove();
                }

                //We restore the first clicked area
                if(urbanAreas.getAreaById(_savedState.community.areaToRestore)._path !== undefined)
                    d3.select(urbanAreas.getAreaById(_savedState.community.areaToRestore)._path).classed("hovered", true);
                else {
                    var layers = urbanAreas.getAreaById(_savedState.community.areaToRestore)._layers;
                    for(var key in layers) {
                        d3.select(layers[key]._path).classed("hovered", true);
                    }
                }

                //We restore the markers
                for(var i = 0; i < _savedState.community.markersToRestore.length; i++) {
                    markers.addSelectedMarker(_savedState.community.markersToRestore[i]);
                    markers.restoreSelectedMarkers();
                    markers.highlightMarker(_savedState.community.markersToRestore[i]);
                }
            }
        }
    };
    
    /*
        isCompareModeActive
        Returns true is the compare mode is active
    */
    var isCompareModeActive = function() {
        return _compareMode;  
    };
    
    return {
        init: init,
        getUrbanArea: getUrbanArea,
        getHospital: getHospital,
        hospitalClicked: hospitalClicked,
        areaClicked: areaClicked,
        displayMessage: displayMessage,
        hideMessage: hideMessage,
        getMode: getMode,
        compareMode: compareMode,
        isCompareModeActive: isCompareModeActive
    };
})();
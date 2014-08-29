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
        _idElementPicked, //Contains the id of the chosen element
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
                areasToReset: [],
                markerToReset: []
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
        _displayGeneralCard(d, target)
        Displays the top card which contains general information about the element clicked
        d contains the data to display and target the column in which the card will be
    */
    var _displayGeneralCard = function(d, target) {
        var node = d3.select(document.createElement("div"));
        
        node.data([{id: 0}]);
        
        if(_elementPicked === "hospital") {
            node.append("h1").html(d.name+" <a href='#' target='_blank'><i class='fa fa-external-link'></i></a>");
            node.append("div")
                .classed("two-columns", true)
                .html("Staffed bed<br/>Total occupancy<br/>Total revenue<br/><span>0</span><br/><span>0%</span><br/><span>$0</span>");
        }
        else {
            node.append("h1").html(d.town);
            node.append("div")
                .classed("two-columns", true)
                .html("Some stuffs here<br/><span>...</span>");
        }
        
        node.append("div")
            .classed("footnote", true)
            .html("Data from the <a href=\"http://www.mass.gov/chia/researcher/hcf-data-resources/massachusetts-hospital-profiles/overiew-and-current-reports.html\" target=\"_blank\">Center for Health Information and Analysis <i class='fa fa-external-link'></i></a>");
        
        sidebar.reset(target);
        sidebar.addcard(node, true, target);
    };
    
    /*
        getUrbanArea(id)
        Returns the record which id is id from the _urbanAreaData object
    */
    var getUrbanArea = function(id) {
            return _urbanAreaData.features[id];  
    };

    /*
        getHospital(id)
        Returns the record which id is id from the _hospitalData object
    */
    var getHospital = function(id) {
            return _hospitalData.hospitals[id];  
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
            if(_elementPicked !== "hospital" || d.id === _idElementPicked)
                return;
            hideMessage();
            target = "panel";
            
            //We reset the margin-top of the sidebar's cards
            sidebar.resetCardsOffset();
        }
        
        _elementPicked = "hospital";
        _idElementPicked = d.id;
        
        if(!_compareMode) {
            urbanAreaModule.reset();
            _savedState.hospital.areasToRestore = [];
            _savedState.hospital.markerToRestore = d.id;
        }
        else {
            //We reset some areas
            urbanAreaModule.reset(_savedState.hospital.areasToReset);
            
            //We restore some others
            for(var i = 0; i < _savedState.hospital.areasToRestore.length; i++) {
                urbanAreaModule
                    .setAreaStyle(_savedState.hospital.areasToRestore[i].id, {
                        fillColor: _savedState.hospital.areasToRestore[i].fillColor,
                        fillOpacity: .8
                    });
            }
        }
        
        _savedState.hospital.areasToReset = [];
        
        //We highlight the marker
        markerModule.reset();
        markerModule.highlightMarker(_savedState.hospital.markerToRestore);
        markerModule.highlightMarker(d.id);
        
        //We delete the lines
        urbanAreaModule.deleteLines();
        
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
            var defaultStyle = urbanAreaModule.getDefaultStyle();
            var percentage = (topCommunity.percentage === null) ? "–" : ((topCommunity.percentage * 100 <= 1) ? "<1" : Math.round(topCommunity.percentage * 100));

            currentRow = table.append("tr")
                .data([{id: topCommunity.id_town}])
                .on("mouseover", function() {
                    var color = _heatmapColor(topCommunity.patients / totalPatients);
                    d3.select(urbanAreaModule.getAreaById(topCommunity.id_town)._path).classed("hovered", true);
                    d3.select(this).classed("hovered", true);
                })
                .on("mouseout", function() {
                    urbanAreaModule.setFillOpacity(1);
                    d3.select(urbanAreaModule.getAreaById(topCommunity.id_town)._path).classed("hovered", false);
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
                urbanAreaModule
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
            if(_elementPicked !== "community" || layerClicked.id === _idElementPicked)
                return;
            hideMessage();
            target = "panel";
            
            //We reset the margin-top of the sidebar's cards
            sidebar.resetCardsOffset();
        }
        
        _elementPicked = "community";
        _idElementPicked = layerClicked.id;
        
        urbanAreaModule.reset();
        markerModule.reset();
        
        //We hide all the markers
        markerModule.hideMarkers();
        
        //We delete all the lines
        urbanAreaModule.deleteLines();
            
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
        if(urbanAreaModule.getAreaById(layerClicked.id)._path !== undefined)
            d3.select(urbanAreaModule.getAreaById(layerClicked.id)._path).classed("hovered", true);
        else {
            var layers = urbanAreaModule.getAreaById(layerClicked.id)._layers;
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
                        .classed("hovered", true);
                })
                .on("mouseout", function() {
                    markerModule.restoreSelectedMarkers();
                    
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
            var marker = markerModule.getMarker(topHospital.id_hospital);
            d3.select(marker)
                .style("opacity", 1);
            markerModule.addSelectedMarker(marker);
            markerModule.highlightMarker(topHospital.id_hospital);
            
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
                urbanAreaModule.reset(_savedState.hospital.areasToReset);

                //We restore some others
                for(var i = 0; i < _savedState.hospital.areasToRestore.length; i++) {
                    urbanAreaModule
                        .setAreaStyle(_savedState.hospital.areasToRestore[i].id, {
                            fillColor: _savedState.hospital.areasToRestore[i].fillColor,
                            fillOpacity: .8
                        });
                }
                
                _savedState.hospital.areasToReset = [];
        
                //We highlight the marker
                markerModule.reset();
                markerModule.highlightMarker(_savedState.hospital.markerToRestore);
            }
        }
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
        compareMode: compareMode
    };
})();
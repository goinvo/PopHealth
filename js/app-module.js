var app = (function() {
    var _config = {
        titleElem: "nav #title",
        messageElem: "#message",
        heatmapColorSchmeme: ["#565756", "#777877", "#999999", "#B8B8B8", "#D6D6D6"],
        linesContainerClass: "lines",
        svgContainer: "#map svg",
        hiddenLineOpacity: .2,
        markerClass: "marker"
    },
        _elementPicked,
        _compareMode = false;
    
    var init = function() {
        sidebar.init();
    };
    
    var setTitle = function(title) {
        d3.select(_config.titleElem)
            .html(title);
    };
    
    var _displayGeneralHospitalCard = function(d, target) {
        sidebar.reset(target);
        
        var node = d3.select(document.createElement("div"));

        node.append("h1")
            .html(d.name+" <a href='#' target='_blank'><i class='fa fa-external-link'></i></a>");
        node.append("div")
            .classed("two-columns", true)
            .html("Staffed bed<br/>Total occupancy<br/>Total revenue<br/><span>0</span><br/><span>0%</span><br/><span>$0</span>");
        node.append("div")
            .classed("footnote", true)
            .html("Data from the <a href=\"http://www.mass.gov/chia/researcher/hcf-data-resources/massachusetts-hospital-profiles/overiew-and-current-reports.html\" target=\"_blank\">Center for Health Information and Analysis <i class='fa fa-external-link'></i></a>");
        
        sidebar.addcard(node, true, target);
    };
    
    var _displayGeneralAreaCard = function(d, target) {
        sidebar.reset(target);
        
        var node = d3.select(document.createElement("div"));
        
        node.append("h1")
            .html(d.town);
        node.append("div")
            .classed("two-columns", true)
            .html("Some stuffs here<br/><span>...</span>");
        node.append("div")
            .classed("footnote", true)
            .html("Data from the <a href=\"http://www.mass.gov/chia/researcher/hcf-data-resources/massachusetts-hospital-profiles/overiew-and-current-reports.html\" target=\"_blank\">Center for Health Information and Analysis <i class='fa fa-external-link'></i></a>");
        
        sidebar.addcard(node, true, target);
    };
    
    var getUrbanArea = function(id) {
            return _urbanAreaData.features[id];  
    };

    var getHospital = function(id) {
            return _hospitalData.hospitals[id];  
    };
    
    /*
        _heatmapColor(ratio)
        Returns the heatmap color for the ratio
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
    
    var hospitalClicked = function(d, marker) {
        var target = "sidebar";
        if(_compareMode) {
            if(_elementPicked !== "hospital")
                return;
            hideMessage();
            target = "panel";
            
            //We reset the margin-top of the sidebar's cards
            sidebar.resetCardsOffset();
        }
        
        _elementPicked = "hospital";
        
        urbanAreaModule.reset();
        
        //We delete the lines
        urbanAreaModule.deleteLines();
        
        //We change the opacity of the markers
        d3.selectAll("."+_config.markerClass)
            .style("opacity", function(d) {
                if(this === marker)
                    return 1;
                return _config.hiddenMarkerOpacity;
            });
        
        _displayGeneralHospitalCard(d, target);
        
        /* Patients' origin */
        var node = d3.select(document.createElement("div"));
        node.append("h1")
            .text("Patients' origin");
        var table = node.append("table")
        
        var currentRow = table.append("tr");
        currentRow.append("th")
            .classed("w40", true)
            .html("Community");
        currentRow.append("th")
            .classed("w30", true)
            .style("text-align", "center")
            .text("Patients");
        currentRow.append("th")
            .style("text-align", "center")
            .text("% of discharges");
        
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
                    urbanAreaModule.setFillOpacity(.3);
                    urbanAreaModule.setAreaStyle(topCommunity.id_town, {
                        color: color,
                        fillOpacity: 1
                    });
                    
                    d3.select(this)
                        .classed("hovered", true);
                })
                .on("mouseout", function() {
                    urbanAreaModule.setFillOpacity(1);
                    urbanAreaModule.setAreaStyle(topCommunity.id_town, {
                        color: defaultStyle.color,
                        opacity: defaultStyle.opacity,
                        weight: defaultStyle.weight
                    });
                    
                    d3.select(this)
                        .classed("hovered", false);
                });
            currentRow.append("td")
                .text(getUrbanArea(topCommunity.id_town).properties.town);
            currentRow.append("td")
                .classed("number", true)
                .text(topCommunity.patients);
            currentRow.append("td")
                .classed("number", true)
                .text((percentage !== "–") ? percentage+"%" : percentage);
            
            //We're displaying the heat map
            urbanAreaModule
                .setAreaStyle(topCommunity.id_town, {
                    fillColor: _heatmapColor(topCommunity.patients / totalPatients),
                    fillOpacity: .8
                });
        });
        
        //No data for the hospital
        if(node.selectAll("tr").size() == 1) {
            currentRow = table.append("tr");
            currentRow.append("td")
                .text("No data");
            currentRow.append("td");
            currentRow.append("td");
        }
        
        sidebar.addcard(node, true, target);
        
        /* DRGs */
        node = d3.select(document.createElement("div"));
        node.append("h1")
            .text("DRGs");
        var table = node.append("table");
        
        var currentRow = table.append("tr");
        currentRow.append("th")
            .classed("w40", true)
            .html("Name");
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
        
        sidebar.addcard(node, false, target);
    };
    
    var displayTopCommunities = function(d, marker) {
        
    };
    
    var areaClicked = function(layerClicked, center) {
        var target = "sidebar";
        if(_compareMode) {
            if(_elementPicked !== "community")
                return;
            hideMessage();
            target = "panel";
            
            //We reset the margin-top of the sidebar's cards
            sidebar.resetCardsOffset();
        }
        
        _elementPicked = "community";
        
        urbanAreaModule.reset();
        
        //We hide all the markers
        markerModule.hideMarkers();
        
        //We delete all the lines
        urbanAreaModule.deleteLines();
            
        _displayGeneralAreaCard(layerClicked, target);
        
        /* Patients' origin */
        var node = d3.select(document.createElement("div"));
        node.append("h1")
            .text("Patients' destination hospitals");
        var table = node.append("table")
        
        var currentRow = table.append("tr");
        currentRow.append("th")
            .classed("w50", true)
            .html("Hospital");
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
        if(node.selectAll("tr").size() == 1) {
            currentRow = table.append("tr");
            currentRow.append("td")
                .text("No data");
            currentRow.append("td");
            currentRow.append("td");
        }
        
        sidebar.addcard(node, true, target);
    };
    
    var displayMessage = function(content) {
        _isMessageDisplayed = true;
        
        d3.select(_config.messageElem)
            .style("visibility", "visible")
            .classed("fadeInDown", true)
            .classed("fadeOutUp", false)
            .html(content);
    };
    
    var hideMessage = function() {
        _isMessageDisplayed = false;
        
        d3.select(_config.messageElem)
            .classed("fadeInDown", false)
            .classed("fadeOutUp", true);
    };
    
    var getMode = function() {
        return _elementPicked;  
    };
    
    var compareMode = function(isActivated) {
        _compareMode = isActivated;
    };
    
    return {
        init: init,
        setTitle: setTitle,
        getUrbanArea: getUrbanArea,
        getHospital: getHospital,
        hospitalClicked: hospitalClicked,
        areaClicked: areaClicked,
        displayTopCommunities: displayTopCommunities,
        displayMessage: displayMessage,
        hideMessage: hideMessage,
        getMode: getMode,
        compareMode: compareMode
    };
})();
var markerModule = (function() {
    var _config = {
        wrapper: "#map svg",
        icon: "icons/hospital.svg",
        containerClass: "markers",
        markerClass: "marker",
        heatmapColorSchmeme: ["#c9181b", "#fdae61", "#ebc036", "#53a348", "#2b83ba"],
        hiddenMarkerOpacity: .3
    };
    
    var _markers,
        _markerSelected = null,
        _popup = null;
    
    /*
        _getMarkerSize
        Returns the size of the markers
    */
    var _getMarkerSize = function() {
        return Math.round(mapModule.getMap().getZoom() * 30 / 14);
    };
    
    /*
        _displayBuble(data)
        Displays a bubble at the position data.latitude and data.longitude, with the content data.name
    */
    var _displayBubble = function(data) {
        _popup = L.popup({closeButton: false, className: 'noCloseButton'})
            .setLatLng([data.latitude, data.longitude])
            .setContent(data.name)
            .openOn(mapModule.getMap());
        
        var markerSize = _getMarkerSize();
        d3.select(".leaflet-popup-pane")
            .style("transform", "translateY(-"+markerSize+"px)")
            .style("-webkit-transform", "translateY(-"+markerSize+"px)")
            .style("-moz-transform", "translateY(-"+markerSize+"px)")
            .style("-ms-transform", "translateY(-"+markerSize+"px)");
    
//        setTimeout(function() {
//            mapModule.getMap().closePopup(popup);
//        }, 2000);
    };
    
    /*
        _closeBubble
        Closes the bubble
    */
    var _closeBubble = function() {
        if(_popup !== null) {
            mapModule.getMap().closePopup(_popup);
            _popup = null;
        }
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
    
    /*
        _displayTopCommunities(data, marker)
        For a selected hospital, displays where people comes from with a heat map and a pane
    */
    var _displayTopCommunities = function(data, marker) {
        //We reset the menu
        menuModule
            .resetContent()
            .setTitle(data.name);
        urbanAreaModule
            .reset();
        
        //We change the opacity of the markers
        d3.selectAll("."+_config.markerClass)
            .style("opacity", function(d) {
                if(this === marker)
                    return 1;
                return _config.hiddenMarkerOpacity;
            });

        var totalPatients = 0;
        data.topCommunities.forEach(function(topCommunity) {
            totalPatients += topCommunity.patients;
        });

        var menuContent = d3.select(document.createElement("table"));
        var currentRow = menuContent.append("tr");
        currentRow.append("th")
            .classed("w50", true)
            .html("Community of origin<sup>1</sup>");
        currentRow.append("th")
            .classed("w25", true)
            .text("Patients");
        currentRow.append("th")
            .text("% of community");

        data.topCommunities.forEach(function(topCommunity) {
            var defaultStyle = urbanAreaModule.getDefaultStyle();
            var percentage = (topCommunity.percentage === null) ? "–" : ((topCommunity.percentage * 100 <= 1) ? "<1" : Math.round(topCommunity.percentage * 100));

            currentRow = menuContent.append("tr")
                .data([{id: topCommunity.id_town}])
                .on("mouseover", function() {
                    var color = _heatmapColor(topCommunity.patients / totalPatients);
                    urbanAreaModule.setFillOpacity(.3);
                    urbanAreaModule.setAreaStyle(topCommunity.id_town, {
                        color: color,
                        fillOpacity: 1
                    });
                    
                    d3.select(this)
                        .style("background-color", color);
                })
                .on("mouseout", function() {
                    urbanAreaModule.setFillOpacity(1);
                    urbanAreaModule.setAreaStyle(topCommunity.id_town, {
                        color: defaultStyle.color,
                        opacity: defaultStyle.opacity,
                        weight: defaultStyle.weight
                    });
                    
                    d3.select(this)
                        .attr("style", null);
                });

            currentRow.append("td")
                .text(getUrbanArea(topCommunity.id_town).properties.town+", "+getUrbanArea(topCommunity.id_town).properties.state);
            currentRow.append("td")
                .text(topCommunity.patients);
            currentRow.append("td")
                .text((percentage !== "–") ? percentage+"%" : percentage);

            //The community in the menu is hovered if the layer is hovered
            urbanAreaModule.setAreaMouseover(topCommunity.id_town, menuModule.highlightItem, ["tr", _heatmapColor(topCommunity.patients / totalPatients), function(e) {
                return urbanAreaModule.getId(e.target);
            }]);

            urbanAreaModule.setAreaMouseout(topCommunity.id_town, menuModule.resetItem, ["tr", function(e) {
                return urbanAreaModule.getId(e.target);
            }]);

            //We're displaying the heat map
            urbanAreaModule
                .setAreaStyle(topCommunity.id_town, {
                    fillColor: _heatmapColor(topCommunity.patients / totalPatients),
                    fillOpacity: .8
                });
        });

        //No data for the hospital
        if(menuContent.selectAll("tr")[0].length == 1) {
            currentRow = menuContent.append("tr");
            currentRow.append("td")
                .text("No data");
            currentRow.append("td");
            currentRow.append("td");
        }

        menuModule.addContent(menuContent);
        
        menuModule.setNote("<sup>1</sup> Only the top 10<sup>-</sup> communities are represented<br/>Data from the <a href='http://www.mass.gov/chia/researcher/hcf-data-resources/massachusetts-hospital-profiles/overiew-and-current-reports.html' target='_blank'>Center for Health Information and Analysis</a>");

        menuModule.open({
            onQuit: urbanAreaModule.reset,
            onQuitArguments: null
        });
    }
    
    /*
        init
        Displays the hospitals' markers on the map
    */
    var init = function() {
        mapModule.getMap()._initPathRoot();
            
        _markers = d3.select(_config.wrapper)
            .append("g")
            .attr("class", _config.containerClass)
            .selectAll("image")
            .data(_hospitalData.hospitals)
            .enter()
            .append("image")
            .attr("class", _config.markerClass)
            .attr("xlink:href", _config.icon)
            .on("mouseover", function(d) {
                d3.select(this)
                    .style("opacity", 1);
                _displayBubble(d);
            })
            .on("mouseout", function() {
                if(menuModule.isOpened() && this !== _markerSelected) {
                    d3.select(this)
                        .style("opacity", _config.hiddenMarkerOpacity);
                }
                _closeBubble();
            })
            .on("click", function(d) {
                _markerSelected = this;
                _displayTopCommunities(d, this);
            });
        
        updateMarkers();
    };
    
    /*
        reset
        Resets the style of the makers
    */
    var reset = function() {
        d3.selectAll("."+_config.markerClass)
            .style("opacity", 1);
    };
    
    /*
        updateMarkers
        Updates the size and the position of each of the markers depending on the zoom of the map
    */
    var updateMarkers = function() {
        var markerSize = _getMarkerSize();
        _markers
            .attr("width", markerSize)
            .attr("height", markerSize)
            .attr("x", function(d) { 
                return mapModule.getMap().latLngToLayerPoint([d.latitude, d.longitude]).x - markerSize / 2;
            })
            .attr("y", function(d) { 
                return mapModule.getMap().latLngToLayerPoint([d.latitude, d.longitude]).y - markerSize;
            });
    }
    
    return {
        init: init,
        reset: reset,
        updateMarkers: updateMarkers
    };
})();
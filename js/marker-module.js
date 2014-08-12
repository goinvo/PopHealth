var markerModule = (function() {
    var _config = {
        wrapper: "#map svg",
        icon: "icons/hospital.svg",
        containerClass: "markers",
        markerClass: "marker",
        heatmapColorSchmeme: ["#d7191c", "#fdae61", "#ffffbf", "#abdda4", "#2b83ba"]
    };
    
    var _markers;
    
    /*
        _displayBuble(data)
        Desc:   Display a bubble at the position data.latitude and data.longitude, with the content data.name
                The bubble disappears after 2000ms
    */
    var _displayBubble = function(data) {
        var popup = L.popup({closeButton: false, className: 'noCloseButton'})
            .setLatLng([data.latitude, data.longitude])
            .setContent(data.name)
            .openOn(mapModule.getMap());
    
        setTimeout(function() {
            mapModule.getMap().closePopup(popup);
        }, 2000);
    };
    
    /*
        _displayTopCommunities(data)
        Desc:   Main algorithm which manage the user's interaction
    */
    var _displayTopCommunities = function(data) {
        (function() {
            //We reset the menu
            menuModule
                .resetContent()
                .setTitle(data.name);
            urbanAreaModule
                .reset();
        
            var totalPatients = 0;
            data.topCommunities.forEach(function(topCommunity) {
                totalPatients += topCommunity.patients;
            });
            
            var menuContent = d3.select(document.createElement("table"));
            var currentRow = menuContent.append("tr");
            currentRow.append("th")
                .classed("w50", true)
                .text("Community of origin");
            currentRow.append("th")
                .classed("w25", true)
                .text("Patients");
            currentRow.append("th")
                .text("% of community");
            
            data.topCommunities.forEach(function(topCommunity) {
                //Case where the community is within MA
                var defaultStyle = urbanAreaModule.getDefaultStyle();
                var percentage = (topCommunity.percentage === null) ? "–" : ((topCommunity.percentage * 100 <= 1) ? "<1" : Math.round(topCommunity.percentage * 100));

                currentRow = menuContent.append("tr")
                    .data([{id: topCommunity.id_town}])
                    .on("mouseover", function() {
                        urbanAreaModule.setAreaStyle(topCommunity.id_town, {
                            color: "#d61a51",
                            opacity: .8,
                            weight: 2
                        });
                    })
                    .on("mouseout", function() {
                        urbanAreaModule.setAreaStyle(topCommunity.id_town, {
                            color: defaultStyle.color,
                            opacity: defaultStyle.opacity,
                            weight: defaultStyle.weight
                        });
                    });

                currentRow.append("td")
                    .text(getUrbanArea(topCommunity.id_town).properties.town+", "+getUrbanArea(topCommunity.id_town).properties.state);
                currentRow.append("td")
                    .text(topCommunity.patients);
                currentRow.append("td")
                    .text((percentage !== "–") ? percentage+"%" : percentage);
//
                //The community in the menu is hovered if the layer is hovered
                urbanAreaModule.setAreaMouseover(topCommunity.id_town, menuModule.highlightItem, ["tr", function(e) {
                    //We highlight the urban area on the map too
                    urbanAreaModule.setAreaStyle(urbanAreaModule.getId(e.target), {
                        color: "#d61a51",
                        opacity: .8,
                        weight: 2
                    });

                    return urbanAreaModule.getId(e.target);
                }]);
//
                urbanAreaModule.setAreaMouseout(topCommunity.id_town, menuModule.resetItem, ["tr", function(e) {
                    //We highlight the urban area on the map too
                    urbanAreaModule.setAreaStyle(urbanAreaModule.getId(e.target), {
                        color: defaultStyle.color,
                        opacity: defaultStyle.opacity,
                        weight: defaultStyle.weight
                    });

                    return urbanAreaModule.getId(e.target);
                }]);

                //We're displaying the heat map
                var color;
                var ratio = topCommunity.patients / totalPatients;
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
                urbanAreaModule
                    .setAreaStyle(topCommunity.id_town, {
                        fillColor: color,
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

            menuModule.open({
                onQuit: urbanAreaModule.reset,
                onQuitArguments: null
            });
        })();
    }
    
    /*
        init
        Desc:   Display the hospitals' markers on the map
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
            .on("mouseover", function(d) {_displayBubble(d);})
            .on("click", function(d) {_displayTopCommunities(d);});
        
        updateMarkers();
    };
    
    /*
        updateMarkers
        Desc:   Update the size and the position of each of the markers depending on the zoom of the map
    */
    var updateMarkers = function() {
        var markerSize = Math.round(mapModule.getMap().getZoom() * 30 / 14);
        _markers
            .attr("width", markerSize)
            .attr("height", markerSize)
            .attr("x", function(d) { 
                return mapModule.getMap().latLngToLayerPoint([d.latitude, d.longitude]).x - markerSize / 2;
            })
            .attr("y", function(d) { 
                return mapModule.getMap().latLngToLayerPoint([d.latitude, d.longitude]).y - markerSize / 2;
            });
    }
    
    return {
        init: init,
        updateMarkers: updateMarkers
    };
})();
var markerModule = (function() {
    var _config = {
        wrapper: "#map svg",
        icon: "icons/hospital.svg",
        containerClass: "markers",
        markerClass: "marker"
    };
    
    var _markers;
    
    var _displayBubble = function(data) {
        var popup = L.popup({closeButton: false, className: 'noCloseButton'})
            .setLatLng([data.latitude, data.longitude])
            .setContent(data.name)
            .openOn(map);
    
        setTimeout(function() {
            map.closePopup(popup);
        }, 2000);
    };
    
    var _displayTopCommunities = function(data) {
        (function() {
            menuModule
                .setTitle(data.name)
                .resetItemContent();
        
            var totalPatients = 0;
            data.topCommunities.forEach(function(topCommunity) {
                totalPatients += topCommunity.patients;
            });
            
            urbanAreaModule.reset();

            data.topCommunities.forEach(function(topCommunity) {
                (function() {
                    var title = topCommunity.name+", "+topCommunity.state;
                    var percentage = (topCommunity.percentage === null) ? "" : ((topCommunity.percentage * 100 <= 1) ? "<1" : Math.round(topCommunity.percentage * 100));
                    var subtitle = topCommunity.patients+" patients";
                    var defaultStyle = urbanAreaModule.getDefaultStyle();
                    subtitle += (percentage == "") ? "" : " - "+percentage+"% of the community";
                    menuModule
                        .addItemContent({
                            title: title,
                            subtitle: subtitle,
                            mouseover: urbanAreaModule.setAreaStyle,
                            mouseoverArguments: [topCommunity.name.toLocaleLowerCase().trim(), {
                                color: "#C71467",
                                opacity: .8,
                                weight: 2
                            }],
                            mouseout: urbanAreaModule.setAreaStyle,
                            mouseoutArguments: [topCommunity.name.toLocaleLowerCase().trim(), {
                                color: defaultStyle.color,
                                opacity: defaultStyle.opacity,
                                weight: defaultStyle.weight
                            }]
                        });

                    //We're displaying the heat map
                    var colorScale = chroma.scale(["#61C280", "#C41212"]).domain([0, totalPatients]).out("hex");
                    urbanAreaModule
                        .setAreaStyle(topCommunity.name.toLocaleLowerCase().trim(), {
                            fillColor: colorScale(topCommunity.patients),
                            fillOpacity: .8
                        });
                })();
            });

            menuModule.open({
                onQuit: urbanAreaModule.reset,
                onQuitArguments: null
            });
        })();
    }
    
    var init = function(data) {
        map._initPathRoot();
        if(data === undefined) {
            console.log("markerModule: init should be called with an argument");
            return;
        }
            
        _markers = d3.select(_config.wrapper)
            .append("g")
            .attr("class", _config.containerClass)
            .selectAll("image")
            .data(data)
            .enter()
            .append("image")
            .attr("class", _config.markerClass)
            .attr("xlink:href", _config.icon)
            .on("mouseover", function(d) {_displayBubble(d);})
            .on("click", function(d) {_displayTopCommunities(d);});
        
        updateMarkers();
    };
    
    var updateMarkers = function() {
        var markerSize = Math.round(map.getZoom() * 20 / 14);
        _markers
            .attr("width", markerSize)
            .attr("height", markerSize)
            .attr("x", function(d) { 
                return map.latLngToLayerPoint([d.latitude, d.longitude]).x - markerSize / 2;
            })
            .attr("y", function(d) { 
                return map.latLngToLayerPoint([d.latitude, d.longitude]).y - markerSize / 2;
            });
    }
    
    return {
        init: init,
        updateMarkers: updateMarkers
    };
})();

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
        }
    };
    
    var _feature;
    
    var _getArea = function(urbanAreaName) {
        return (function() {
            var layers = _feature.getLayers();
            var result = null;
            layers.forEach(function(layer) {
                if(layer.feature.properties.TOWN.toLowerCase().trim() == urbanAreaName) {
                    result = layer;
                }
            });  
            return result;
        })();
    };
    
    var init = function() {
        _feature = L.geoJson(urbanAreaData, {
            style: _config.style
        })
        .addTo(map);
    };
    
    var reset = function() {
        _feature.getLayers().forEach(function(layer) {layer.setStyle(_config.style);});
    };
    
    var setAreaStyle = function(urbanAreaName, style) {
        (function() {
            var layer = _getArea(urbanAreaName);
            if(layer === null || layer === undefined) {
                console.log("urbanAreaModule: layer shouldn't be null or undefined");
                return;
            }
            
            layer.setStyle(style);
        })();
    };
    
    var resetArea = function(urbanAreaName) {
        (function() {
            var layer = _getArea(urbanAreaName);
            if(layer === null || layer === undefined) {
                console.log("urbanAreaModule: layer shouldn't be null or undefined");
                return;
            }
            
            layer.setStyle(_config.style);
        })();
    };
    
    var getDefaultStyle = function() {
        return _config.style;  
    };
    
    return {
        init: init,
        reset: reset,
        setAreaStyle: setAreaStyle,
        resetArea: resetArea,
        getDefaultStyle: getDefaultStyle
    };
})();

var menuModule = (function() {
    var _config = {
        wrapper: "body",
        menuClass: "panel",
        titleElement: "h1",
        itemElement: "div",
        itemClass: "hospital",
        itemTitleElement: "h2",
        itemSubtitleElement: "h3",
        quitButtonClass: "quit"
    };
    
    var _menu;
    
    var open = function(options) {
        _menu
            .style("height", window.innerHeight+"px")
            .style("display", "block");
        
        _menu.select("."+_config.quitButtonClass)
            .on("click", function() {
                if(options !== null && options !== undefined) {
                    if(options.onQuit !== null && options.onQuit !== undefined) {
                        options.onQuit.apply(null, options.onQuitArguments);
                    }
                }
                close();
            });
    };
    
    var close = function () {
        _menu.style("display", "none");
        _reset();
    };
    
    var _reset = function() {
        _menu.selectAll("*")
            .filter(function() {return !d3.select(this).classed(_config.quitButtonClass);})
            .remove();
    };
    
    var setTitle = function(title) {
        if(!_menu.select(_config.titleElement).empty()) { //In case a title already exists
            _menu.select(_config.titleElement)
                .text(title);
        }
        else {
            _menu.append(_config.titleElement)
                .text(title);
        }
        
        return this;
    };
    
    var addItemContent = function(content) {
        (function() {
            var item = _menu.append(_config.itemElement);
            item.append(_config.itemTitleElement)
                .text(content.title)
                .append(_config.itemSubtitleElement)
                .text(content.subtitle);
            
            if(content.mouseover !== null && content.mouseover !== undefined) {
                item.on("mouseover", function() {
                    content.mouseover.apply(null, content.mouseoverArguments)
                });
            }
            
            if(content.mouseout !== null && content.mouseout !== undefined) {
                item.on("mouseout", function() {
                    content.mouseout.apply(null, content.mouseoutArguments)
                });
            }

            return this;
        })();
    };
    
    var resetItemContent = function() {
        _menu.selectAll(_config.itemElement)
            .filter(function() {return !d3.select(this).classed(_config.quitButtonClass);})
            .remove();
        
        return this;  
    };
    
    var init = function() {
        _menu = d3.select(_config.wrapper)
            .append("div")
            .attr("class", _config.menuClass)
            .style("display", "none");
        
        _menu.append("div")
            .attr("class", _config.quitButtonClass);
    };
    
    return {
        open: open,
        close: close,
        setTitle: setTitle,
        addItemContent: addItemContent,
        resetItemContent: resetItemContent,
        init: init
    };
})();
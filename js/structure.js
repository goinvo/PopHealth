var markerModule = (function() {
    var _config = {
        wrapper: "#map svg",
        icon: "icons/hospital.svg",
        containerClass: "markers",
        markerClass: "marker"
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
            .openOn(map);
    
        setTimeout(function() {
            map.closePopup(popup);
        }, 2000);
    };
    
    /*
        _displayTopCommunities(data)
        Desc:   Main algorithm which manage the user's interaction
    */
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
                    
                    //Case where the community is within MA
                    if(topCommunity.state === "MA") {
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
                        
                        //The community in the menu is hovered if the layer is hovered
                        urbanAreaModule.setAreaMouseover(topCommunity.name.toLocaleLowerCase().trim(), menuModule.highlightItem, [function(e) {
                            return (function() {
                                //We highlight the urban area on the map too
                                urbanAreaModule.setAreaStyle(topCommunity.name.toLocaleLowerCase().trim(), {
                                    color: "#C71467",
                                    opacity: .8,
                                    weight: 2
                                });
                                
                                return urbanAreaModule.getAreaData(e.target).TOWN.toLowerCase().trim();
                            })();
                        }]);
                        
                        urbanAreaModule.setAreaMouseout(topCommunity.name.toLocaleLowerCase().trim(), menuModule.resetItem, [function(e) {
                            return (function() {
                                //We highlight the urban area on the map too
                                urbanAreaModule.setAreaStyle(topCommunity.name.toLocaleLowerCase().trim(), {
                                    color: defaultStyle.color,
                                    opacity: defaultStyle.opacity,
                                    weight: defaultStyle.weight
                                });
                                
                                return urbanAreaModule.getAreaData(e.target).TOWN.toLowerCase().trim();
                            })();
                        }]);

                        //We're displaying the heat map
                        var colorScale = chroma.scale(["#61C280", "#C41212"]).domain([0, totalPatients]).out("hex");
                        urbanAreaModule
                            .setAreaStyle(topCommunity.name.toLocaleLowerCase().trim(), {
                                fillColor: colorScale(topCommunity.patients),
                                fillOpacity: .8
                            });
                    }
                    
                    //Case where the community is outside MA
                    else {
                        menuModule
                            .addItemContent({
                                title: title,
                                subtitle: subtitle
                            });
                    }
                })();
            });

            menuModule.open({
                onQuit: urbanAreaModule.reset,
                onQuitArguments: null
            });
        })();
    }
    
    /*
        init(data)
        Desc:   Display the hospitals' markers on the map from data
    */
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
    
    /*
        updateMarkers
        Desc:   Update the size and the position of each of the markers depending on the zoom of the map
    */
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
    
    var _feature; //Contains the mapbox object for the urban areas
    
    /*
        _getArea(urbanAreaName)
        Desc:   Return the layer whose name is urbanAreaName
    */
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
    
    /*
        init
        Desc:   Display the urban areas on the map
    */
    var init = function() {
        _feature = L.geoJson(urbanAreaData, {
            style: _config.style
        })
        .addTo(map);
    };
    
    
    /*
        reset
        Desc:   Reset the style of the layers to _config.style
    */
    var reset = function() {
        _feature.getLayers().forEach(function(layer) {layer.setStyle(_config.style);});
    };
    
    /*
        setAreaStyle(urbanAreaName, style)
        Desc:   Set the style of the area named urbanAreaName to style
    */
    var setAreaStyle = function(urbanAreaName, style) {
        (function() {
            var layer = _getArea(urbanAreaName);
            if(layer === null || layer === undefined) {
                console.log("urbanAreaModule.setAreaStyle: layer shouldn't be null or undefined");
                return;
            }
            
            layer.setStyle(style);
        })();
    };
    
    /*
        resetArea(urbanAreaName)
        Desc:   Reset the style of the area named urbanAreaName to _config.style
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
        Desc:   Return the default style of the layers (ie areas)
    */
    var getDefaultStyle = function() {
        return _config.style;  
    };
    
    /*
        setAreaMouseover(urbanAreaName, callback, args)
        Desc:   Set for the area named urbanAreaName the callback function "callback" when the event mouseover is caught
                args is the an array of the arguments that are passed to the callback function
                If one of the arguments is actually a function, it is executed passing it as first and only parameter the event caught
    */
    var setAreaMouseover = function(urbanAreaName, callback, args) {
        (function() {
            var layer = _getArea(urbanAreaName);
            
            layer.on("mouseover", function(e) {
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
        })();
    };
    
    /*
        setAreaMouseout(urbanAreaName, callback, args)
        Desc:   Set for the area named urbanAreaName the callback function "callback" when the event mouseout is caught
                args is the an array of the arguments that are passed to the callback function
                If one of the arguments is actually a function, it is executed passing it as first and only parameter the event caught
    */
    var setAreaMouseout = function(urbanAreaName, callback, args) {
        (function() {
            var layer = _getArea(urbanAreaName);
            
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
        })();
    };
    
    /*
        getAreaData(urbanArea)
        Desc:   Return the data binded to the layer getAreaData
    */
    var getAreaData = function(urbanArea) {
        return urbanArea.feature.properties;
    };
    
    return {
        init: init,
        reset: reset,
        setAreaStyle: setAreaStyle,
        resetArea: resetArea,
        getDefaultStyle: getDefaultStyle,
        setAreaMouseover: setAreaMouseover,
        setAreaMouseout: setAreaMouseout,
        getAreaData : getAreaData
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
        quitButtonClass: "quit",
        activeItemClass: "active"
    };
    
    var _menu;
    
    /*
        open(options)
        Desc:   Display the menu
                options is an object that can contain the onQuit and onQuitArguments properties
                If so, when the menu is closed, it calls the callback function onQuit with the array of arguments onQuitArguments
    */
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
    
    /*
        close
        Desc:   Close the menu and clean (remove) its content
    */
    var close = function () {
        _menu.style("display", "none");
        _reset();
    };
    
    
    /*
        _reset
        Desc:   Remove the content of the menu
    */
    var _reset = function() {
        _menu.selectAll("*")
            .filter(function() {return !d3.select(this).classed(_config.quitButtonClass);})
            .remove();
    };
    
    /*
        setTitle(title)
        Desc:   Append the title "title" to the menu using the element _config.titleElement
                If it already existed, it is just replaced
                It returns the menu itself so it could be chained with other function of the menu
    */
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
    
    /*
        addItemContent(content)
        Desc:   Append an item _config.itemElement formed of a _config.itemTitleElement and a _config.itemSubtitleElement with their associated classes
                content is made of content.title, content.subtitle, content.mousover, content.mouseoverArguments, content.mouseover, and content.mouseoverArguments
                The four last properties are two callback functions associated with their respective arrays of arguments that are called when the event they designate is caught
                It returns the menu itself so it could be chained with other function of the menu
    */
    var addItemContent = function(content) {
        (function() {
            var item = _menu.append(_config.itemElement)
                .attr("class", _config.itemClass);
            item.append(_config.itemTitleElement)
                .text(content.title)
            item.append(_config.itemSubtitleElement)
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
    
    /*
        resetItemContent
        Desc:   Remove all the _config.itemElement from the menu
                It returns the menu itself so it could be chained with other function of the menu
    */
    var resetItemContent = function() {
        _menu.selectAll(_config.itemElement)
            .filter(function() {return !d3.select(this).classed(_config.quitButtonClass);})
            .remove();
        
        return this;  
    };
    
    /*
        highlightItem(itemName)
        Desc:   Apply to the item whose title begins with itemName the class _config.activeClass
                It returns the menu itself so it could be chained with other function of the menu
    */
    var highlightItem = function(itemName) {
        _menu.selectAll("."+_config.itemClass)
            .filter(function(d) {
                return d3.select(this).select(_config.itemTitleElement).text().substring(0, itemName.length).toLowerCase() == itemName;
            })
            .classed(_config.activeItemClass, true);
        
        return this;
    };
    
    /*
        resetItem(itemName)
        Desc:   Remove the class _config.activeClass of the item whose title begins with itemName
                It returns the menu itself so it could be chained with other function of the menu
    */
    var resetItem = function(itemName) {
        _menu.selectAll("."+_config.itemClass)
            .filter(function(d) {
                return d3.select(this).select(_config.itemTitleElement).text().substring(0, itemName.length).toLowerCase() == itemName;
            })
            .classed(_config.activeItemClass, false);
        
        return this;
    };
    
    
    /*
        init
        Desc:   Append the menu to the DOM as of its quitButton
    */
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
        highlightItem: highlightItem,
        resetItem: resetItem,
        init: init
    };
})();
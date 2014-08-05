var mapModule = (function() {
    var _config = {
        mapElement: "#map",
        mapName: "clementp.ipg3giee",
        defaultLatitude: 42.2,
        defaultLongitude: -71.7,
        defaultZoom: 9
    };
    
    var _map;
    
    /*
        init
        Desc:   Initialize the map
    */
    var init = function() {
        d3.select(_config.mapElement)
            .style("height", window.innerHeight+"px");
        
        _map = L.mapbox
            .map("map", _config.mapName)
            .setView([_config.defaultLatitude, _config.defaultLongitude], _config.defaultZoom)
            .on("viewreset", function() {markerModule.updateMarkers();});
    };
    
    /*
        updateSize
        Desc:   Resize the map depending on the size of the window
    */
    var updateSize = function() {
        d3.select(_config.mapElement)
            .style("height", window.innerHeight+"px");  
    };
    
    /*
        getMap
        Desc: Return the mapbox object for the map
    */
    var getMap = function() {
        return _map;  
    };
    
    return {
        init: init,
        updateSize: updateSize,
        getMap: getMap
    };
})();


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
            menuModule
                .setTitle(data.name)
                .resetItemContent();
            
            urbanAreaModule
                .reset();
        
            var totalPatients = 0;
            data.topCommunities.forEach(function(topCommunity) {
                totalPatients += topCommunity.patients;
            });
            
            var counter = 0;
            data.topCommunities.forEach(function(topCommunity) {
                (function() {
                    var title = topCommunity.name+", "+topCommunity.state;
                    var percentage = (topCommunity.percentage === null) ? "" : ((topCommunity.percentage * 100 <= 1) ? "<1" : Math.round(topCommunity.percentage * 100));
                    var subtitle = topCommunity.patients+" patients";
                    var defaultStyle = urbanAreaModule.getDefaultStyle();
                    subtitle += (percentage == "") ? "" : " - "+percentage+"% of the community";
                    
                    //Case where the community is within MA
                    if(topCommunity.state === "MA") {
                        
                        //We set an id to the urban area
                        urbanAreaModule.setId(topCommunity.name.toLocaleLowerCase().trim(), counter);
                        
                        menuModule
                            .addItemContent({
                                id: counter,
                                title: title,
                                subtitle: subtitle,
                                mouseover: urbanAreaModule.setAreaStyle,
                                mouseoverArguments: [counter, {
                                    color: "#C71467",
                                    opacity: .8,
                                    weight: 2
                                }],
                                mouseout: urbanAreaModule.setAreaStyle,
                                mouseoutArguments: [counter, {
                                    color: defaultStyle.color,
                                    opacity: defaultStyle.opacity,
                                    weight: defaultStyle.weight
                                }]
                            });
                        
                        //The community in the menu is hovered if the layer is hovered
                        urbanAreaModule.setAreaMouseover(counter, menuModule.highlightItem, [function(e) {
                            return (function() {
                                //We highlight the urban area on the map too
                                urbanAreaModule.setAreaStyle(urbanAreaModule.getId(e.target), {
                                    color: "#C71467",
                                    opacity: .8,
                                    weight: 2
                                });
                                
                                return urbanAreaModule.getId(e.target);
                            })();
                        }]);
                        
                        urbanAreaModule.setAreaMouseout(counter, menuModule.resetItem, [function(e) {
                            return (function() {
                                //We highlight the urban area on the map too
                                urbanAreaModule.setAreaStyle(urbanAreaModule.getId(e.target), {
                                    color: defaultStyle.color,
                                    opacity: defaultStyle.opacity,
                                    weight: defaultStyle.weight
                                });
                                
                                return urbanAreaModule.getId(e.target);
                            })();
                        }]);

                        //We're displaying the heat map
                        var colorScale = chroma.scale(["#61C280", "#C41212"]).domain([0, totalPatients]).out("hex");
                        urbanAreaModule
                            .setAreaStyle(counter, {
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
                    
                    counter++;
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
        mapModule.getMap()._initPathRoot();
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
        var markerSize = Math.round(mapModule.getMap().getZoom() * 20 / 14);
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
        _getAreaById(id)
        Desc:   Return the layer whose id is id
    */
    var _getAreaById = function(id) {
        return (function() {
            var layers = _feature.getLayers();
            var result = null;
            layers.forEach(function(layer) {
                if(layer.dataId !== null && layer.dataId !== undefined && layer.dataId === id) {
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
        mapModule.getMap()._initPathRoot();
        _feature = L.geoJson(urbanAreaData, {
            style: _config.style
        })
        .addTo(mapModule.getMap());
    };
    
    
    /*
        reset
        Desc:   Reset the style of the layers to _config.style
    */
    var reset = function() {
        _feature.getLayers().forEach(function(layer) {
            layer.setStyle(_config.style);
            layer["dataId"] = null;
            layer.removeEventListener();
        });
    };
    
    /*
        setAreaStyle(id, style)
        Desc:   Set the style of the area whose id is id to style
    */
    var setAreaStyle = function(id, style) {
        (function() {
            var layer = _getAreaById(id);
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
        setAreaMouseover(id, callback, args)
        Desc:   Set for the area whose id is id the callback function "callback" when the event mouseover is caught
                args is the an array of the arguments that are passed to the callback function
                If one of the arguments is actually a function, it is executed passing it as first and only parameter the event caught
    */
    var setAreaMouseover = function(id, callback, args) {
        (function() {
            var layer = _getAreaById(id);
            if(layer === null || layer === undefined) {
                console.log("urbanAreaModule.setAreaMouseover: layer shouldn't be null or undefined");
                return;
            }
            
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
        setAreaMouseout(id, callback, args)
        Desc:   Set for the area whose id is id the callback function "callback" when the event mouseout is caught
                args is the an array of the arguments that are passed to the callback function
                If one of the arguments is actually a function, it is executed passing it as first and only parameter the event caught
    */
    var setAreaMouseout = function(id, callback, args) {
        (function() {
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
        })();
    };
    
    /*
        getAreaData(urbanArea)
        Desc:   Return the data binded to the layer getAreaData
    */
    var getAreaData = function(urbanArea) {
        return urbanArea.feature.properties;
    };
    
    /*
        setId(urbanAreaName, id)
        Desc:   Set the id to the layer named urbanAreaName
    */
    var setId = function(urbanAreaName, id) {
        (function() {
            var layer = _getArea(urbanAreaName);
            if(layer === null || layer === undefined) {
                console.log("urbanAreaModule.setId: layer shouldn't be null or undefined");
                return;
            }
            
            layer["dataId"] = id;
        })();
    };
    
    /*
        getId(urbanAreaName)
        Desc:   Return the id of the layer urbanArea
    */
    var getId = function(urbanArea) {
        if(urbanArea === null || urbanArea === undefined) {
            console.log("urbanAreaModule.getId: urbanArea shouldn't be null or undefined");
            return;
        }

        if(urbanArea.dataId === null || urbanArea.dataId === undefined) {
            console.log("urbanAreaModule.getId: returning a null or undefined value");
        }
        
        return urbanArea.dataId;
    };
    
    return {
        init: init,
        reset: reset,
        setAreaStyle: setAreaStyle,
        resetArea: resetArea,
        getDefaultStyle: getDefaultStyle,
        setAreaMouseover: setAreaMouseover,
        setAreaMouseout: setAreaMouseout,
        getAreaData: getAreaData,
        setId: setId,
        getId: getId
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
                .data([{
                    id: content.id,
                    title: content.title,
                    subtitle: content.subtitle
                }])
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
        Desc:   Apply to the item whose id is id the class _config.activeClass
                It returns the menu itself so it could be chained with other function of the menu
    */
    var highlightItem = function(id) {
        _menu.selectAll("."+_config.itemClass)
            .filter(function(d) {
                return d.id == id;
            })
            .classed(_config.activeItemClass, true);
        
        return this;
    };
    
    /*
        resetItem(itemName)
        Desc:   Remove the class _config.activeClass of the item whose id is id
                It returns the menu itself so it could be chained with other function of the menu
    */
    var resetItem = function(id) {
        _menu.selectAll("."+_config.itemClass)
            .filter(function(d) {
                return d.id == id;
            })
            .classed(_config.activeItemClass, false);
        
        return this;
    };
    
    /*
        updateSize
        Desc:   Resize the menu depending on the size of the window
    */
    var updateSize = function() {
        d3.select("."+_config.menuClass)
            .style("height", window.innerHeight+"px");  
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
        updateSize: updateSize,
        resetItem: resetItem,
        init: init
    };
})();
var urbanAreas = (function() {
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
    },
    _borderCommunities =  [1, 8, 28, 30, 31, 37, 47, 50, 53, 55, 63, 65, 66, 75, 86, 101, 102, 104, 107, 109, 115, 116, 132, 138, 142, 150, 157, 167, 168, 169, 170, 181, 183, 185, 198, 199, 210, 216, 230, 240, 241, 245, 256, 257, 259, 261, 263, 272, 276, 281, 285, 297, 302, 304, 307, 309, 315, 322, 330, 336, 340, 342, 343, 343, 366, 367];
    
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
        getAreaById(id)
       Returns the layer whose id is id
    */
    var getAreaById = function(id) {
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
        _feature = L.geoJson(_urbanAreasData, {style: _config.style, onEachFeature: function(feature, layer) {
                layer.on("click", function(e) {
                    //If the Ctrl or Cmd key is pressed, we lauch the compare mode
                    if(!app.isCompareModeActive() && (e.originalEvent.ctrlKey || e.originalEvent.metaKey))
                        sidebar.compare();
                    
                    app.view().areaClicked(e.target.feature.properties, this.getBounds().getCenter());
                });
            }})
            .addTo(mapModule.getMap());
        
        d3.select(_config.svgContainer)
            .append("g")
            .classed(_config.linesContainerClass, true);

    };
    
    /*
        reset(ids)
        If ids is undefined, resets the style of all the layers to _config.style and removes the event listenners
        Else, resets the style of the layers whose ids are inside the array ids to _config.style and removes their event listenners
    */
    var reset = function(ids) {
        if(ids === undefined) {
            _feature.getLayers().forEach(function(layer) {
                layer.setStyle(_config.style);
                layer["dataId"] = null;
                layer.removeEventListener("mouseover");
                layer.removeEventListener("mouseout");

                if(layer._path !== undefined)
                    d3.select(layer._path).classed("hovered", false);
                else {
                    var layers = layer._layers;
                    for(var key in layers) {
                        d3.select(layers[key]._path).classed("hovered", false);
                    }
                }
            });
        }
        else {
            for(var i = 0; i < ids.length; i++) {
                _feature.getLayers().forEach(function(layer) {
                    if(layer.feature.properties.id === ids[i]) {
                        layer.setStyle(_config.style);
                        layer["dataId"] = null;
                        layer.removeEventListener("mouseover");
                        layer.removeEventListener("mouseout");

                        if(layer._path !== undefined)
                            d3.select(layer._path).classed("hovered", false);
                        else {
                            var layers = layer._layers;
                            for(var key in layers) {
                                d3.select(layers[key]._path).classed("hovered", false);
                            }
                        }
                    }
                });
            }
        }
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
        var layer = getAreaById(id);
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
    
    /*
        isBorderCommunity(id)
        Returns true is the community is a at the border of another state, false otherwise
        id is the community id
    */
    var isBorderCommunity = function(id) {
        return (_borderCommunities.indexOf(id) === -1);
    };
    
    return {
        init: init,
        reset: reset,
        update: update,
        setFillOpacity: setFillOpacity,
        setAreaStyle: setAreaStyle,
        resetArea: resetArea,
        getDefaultStyle: getDefaultStyle,
        getAreaData: getAreaData,
        getId: getId,
        deleteLines: deleteLines,
        getAreaById: getAreaById,
        isBorderCommunity: isBorderCommunity
    };
})();
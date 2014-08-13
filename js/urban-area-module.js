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
        _getAreaById(id)
       Returns the layer whose id is id
    */
    var _getAreaById = function(id) {
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
        _topHospitals(layer)
        Displays the hospitals the most visited by the people from the selected area  with a pane
    */
    var _topHospitals = function(layer) {
        //We reset the menu
        menuModule
            .resetContent()
            .setTitle(layer.town);
        
        menuModule.open({
            onQuit: null,
            onQuitArguments: null
        });
    };
    
    /*
        init
        Displays the urban areas on the map
    */
    var init = function() {
        mapModule.getMap()._initPathRoot();
        _feature = L.geoJson(_urbanAreaData, {style: _config.style, onEachFeature: function(feature, layer) {
                layer.on("click", function(e) {_topHospitals(e.target.feature.properties);});
            }})
            .addTo(mapModule.getMap());

    };
    
    /*
        reset
        Resets the style of the layers to _config.style and removes the event listenners
    */
    var reset = function() {
        _feature.getLayers().forEach(function(layer) {
            layer.setStyle(_config.style);
            layer["dataId"] = null;
            layer.removeEventListener("mouseover");
            layer.removeEventListener("mouseout");
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
        var layer = _getAreaById(id);
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
        setAreaMouseover(id, callback, args)
        Sets for the area whose id is id the callback function "callback" when the event mouseover is caught
        args is the an array of the arguments that are passed to the callback function
        If one of the arguments is actually a function, it is executed passing it as first and only parameter the event caught
    */
    var setAreaMouseover = function(id, callback, args) {
        var layer = _getAreaById(id);
        if(layer === null || layer === undefined) {
            console.log("urbanAreaModule.setAreaMouseover: layer shouldn't be null or undefined");
            return;
        }

        layer.on("mouseover", function(e) {
            //If args contains functions, we execute them before
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
    };
    
    /*
        setAreaMouseout(id, callback, args)
        Sets for the area whose id is id the callback function "callback" when the event mouseout is caught
        args is the an array of the arguments that are passed to the callback function
        If one of the arguments is actually a function, it is executed passing it as first and only parameter the event caught
    */
    var setAreaMouseout = function(id, callback, args) {
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
    };
    
    /*
        getAreaData(urbanArea)
        Returns the data binded to the layer getAreaData
    */
    var getAreaData = function(urbanArea) {
        return urbanArea.feature.properties;
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
    
    return {
        init: init,
        reset: reset,
        setFillOpacity: setFillOpacity,
        setAreaStyle: setAreaStyle,
        resetArea: resetArea,
        getDefaultStyle: getDefaultStyle,
        setAreaMouseover: setAreaMouseover,
        setAreaMouseout: setAreaMouseout,
        getAreaData: getAreaData,
        getId: getId
    };
})();
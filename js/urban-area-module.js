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
        _feature = L.geoJson(_urbanAreaData, {
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
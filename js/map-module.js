var mapModule = (function() {
    var _config = {
        mapElement: "#map",
        mapName: "juhan.jd76mnn6",
        defaultLatitude: 42.2,
        defaultLongitude: -71.7,
        defaultZoom: 9
    };
    
    var _map;
    
    /*
        init
        Initializes the map
    */
    var init = function() {
        d3.select(_config.mapElement)
            .style("height", window.innerHeight+"px");
        
        _map = L.mapbox
            .map("map", _config.mapName, {zoomControl: false, attributionControl: false})
            .setView([_config.defaultLatitude, _config.defaultLongitude], _config.defaultZoom)
            .on("viewreset", function() {
                markers.updateMarkers();
                urbanAreas.update();
            });
    };
    
    /*
        update
        Resizes the map depending on the size of the window
    */
    var update = function() {
        d3.select(_config.mapElement)
            .style("height", window.innerHeight+"px") 
            .style("width", window.innerWidth+"px");  
    };
    
    /*
        getMap
        Returns the mapbox object of the map
    */
    var getMap = function() {
        return _map;  
    };
    
    return {
        init: init,
        update: update,
        getMap: getMap
    };
})();
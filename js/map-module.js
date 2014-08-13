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
        Initializes the map
    */
    var init = function() {
        d3.select(_config.mapElement)
            .style("height", window.innerHeight+"px");
        
        _map = L.mapbox
            .map("map", _config.mapName, {zoomControl: false, attributionControl: false})
            .setView([_config.defaultLatitude, _config.defaultLongitude], _config.defaultZoom)
            .on("viewreset", function() {markerModule.updateMarkers();});
        
        _map.addControl(L.control.attribution().setPrefix("By <a href='http://www.goinvo.com' target='_blank'>Involution Stutios</a> and <a href='http://www.macadamian.com' target='_blank'>Macadamian</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href='https://github.com/goinvo/pophealth' target='_blank'>Open Data + Code</a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href='mailto:pophealth-internal@goinvo.com'>Feedback</a>"))
            .addControl(L.control.zoom({position: "bottomright"}));
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
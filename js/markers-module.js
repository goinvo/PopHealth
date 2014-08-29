var markers = (function() {
    var _config = {
        wrapper: "#map svg",
        icon: "icons/hospital.svg",
        iconHovered: "icons/hospital-hovered.svg",
        containerClass: "markers",
        markerClass: "marker",
        hiddenMarkerOpacity: .5
    };
    
    var _markers,
        _markersSelected = [],
        _popup = null;
    
    /*
        _getMarkerSize
        Returns the size of the markers
    */
    var _getMarkerSize = function() {
        return Math.round(mapModule.getMap().getZoom() * 30 / (12 + (9 - mapModule.getMap().getZoom())));
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
        init
        Displays the hospitals' markers on the map
    */
    var init = function() {
        mapModule.getMap()._initPathRoot();
            
        _markers = d3.select(_config.wrapper)
            .append("g")
            .attr("class", _config.containerClass)
            .selectAll("image")
            .data(_hospitalsData.hospitals)
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
                if(_markersSelected.indexOf(this) === -1) {
                    d3.select(this)
                        .style("opacity", _config.hiddenMarkerOpacity);
                }
                _closeBubble();
            })
            .on("click", function(d) {
                app.hospitalClicked(d, this);
                _markersSelected.push(this);
            });
        
        updateMarkers();
    };
    
    /*
        reset
        Resets the style of the makers
    */
    var reset = function() {
        d3.selectAll("."+_config.markerClass)
            .attr("xlink:href", _config.icon)
            .style("opacity", 1);
        
        _markersSelected = [];
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
    
    /*
        getMarker(id)
        Returns the marker whose id matched the arg
    */
    var getMarker = function(id) {
        return _markers[0][id];
    };
    
    /*
        hideMarkers
        Changes the opacity of all the markers to _config.hiddenMarkerOpacity
    */
    var hideMarkers = function() {
        d3.selectAll("."+_config.markerClass)
            .style("opacity", _config.hiddenMarkerOpacity);
    };
    
    /*
        restoreSelectedMarkers
        Puts the opacity to 1 for all the selected markers
    */
    var restoreSelectedMarkers = function() {
        _markersSelected.forEach(function(selectedMarker) {
            d3.select(selectedMarker)
                .style("opacity", 1);
        });
    };
    
    /*
        addSelectedMarker(marker)
        Adds the marker to the one selected so they won't react to the mouseover/mouseout events
    */
    var addSelectedMarker = function(marker) {
        if(typeof marker !== "number")
            _markersSelected.push(marker);
        else {
            var domElement = d3.selectAll("."+_config.markerClass)
                .filter(function(d) {return d.id === marker})
                .node();
            
            _markersSelected.push(domElement);
        }
    };
    
    /*
        highlightMaker(id)
        Changes the icon of the marker whose id is id to the hover icon
    */
    var highlightMarker = function(id) {
         d3.selectAll("."+_config.markerClass)
            .filter(function(d) {return d.id === id;})
            .attr("xlink:href", _config.iconHovered);
    };
    
    return {
        init: init,
        reset: reset,
        updateMarkers: updateMarkers,
        getMarker: getMarker,
        hideMarkers: hideMarkers,
        restoreSelectedMarkers: restoreSelectedMarkers,
        addSelectedMarker: addSelectedMarker,
        highlightMarker: highlightMarker
    };
})();
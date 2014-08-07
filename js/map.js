var mapModule = (function() {
    var _svg = "body svg",
        _markers,
        _markersSize,
        _bubbleWidth = 200,
        _bubbleHeight = 50,
        _projection,
        _path,
        _svg,
        _mapWidth,
        _mapHeight,
        _mapLeftOffset,
        _mapTopOffset,
        _bubbleTimer;
    
    var init = function() {
        _projection = d3.geo.mercator()
                .center([-71.7, 42.08])
                .scale(_scale())
                .translate([app.width() / 2, app.height() / 2]);

        _path = d3.geo.path().projection(_projection);

        _svg = d3.select(_svg)
            .attr("width", app.width())
            .attr("height", app.height());
        
        _mapLeftOffset = _path.bounds(app.urbanAreaData())[0][0];
        _mapTopOffset = _path.bounds(app.urbanAreaData())[0][1];
        _mapWidth = _path.bounds(app.urbanAreaData())[1][0] - _mapLeftOffset;
        _mapHeight = _path.bounds(app.urbanAreaData())[1][1] - _mapTopOffset;
        
        move(0, 0, false);

        _svg.selectAll("path")
            .data(app.urbanAreaData().features)
            .enter()
            .append("path")
            .attr("d", _path);
        
        _markers = _svg.append("g")
            .attr("class", "markers")
            .selectAll("image")
            .data(app.hospitalData().hospitals)
            .enter()
            .append("image")
            .attr("class", "marker")
            .attr("xlink:href", "icons/hospital.svg");
    };
    
    /*
        center
        Centers the map on the screen
        If animated, the transition lasts 1s
    */
    var center = function(animated) {
        move("auto", "auto", animated);
    };
    
    /*
        move
        Sets the absolute distance of the map from the left and the top of the screen
        left and top are pixel values or the string "auto" in which case the map will be horizontally or vertically centered, or both
        If animated, the transition lasts 1s
    */
    var move = function(left, top, animated) {
        var x,
            y;
        
        if(typeof left === "number")
            x = left - _mapLeftOffset;
        else if(left === "auto")
            x = (app.width() - _mapWidth) / 2 - _mapLeftOffset;
        
        if(typeof top === "number")
            y = top - _mapTopOffset;
        else if(top === "auto")
            y = (app.height() - _mapHeight) / 2 - _mapTopOffset;
        
        if(animated) {
            _svg.style("transform", "translate("+x+"px, "+y+"px)")
                .style("-webkit-transform", "translate("+x+"px, "+y+"px)")
                .style("-moz-transform", "translate("+x+"px, "+y+"px)")
                .style("-ms-transform", "translate("+x+"px, "+y+"px)")
                .style("transition", "1s ease")
                .style("-webkit-transition", "1s ease")
                .style("-moz-transition", "1s ease")
                .style("-ms-transition", "1s ease");
        }
        else {
            _svg.style("transform", "translate("+x+"px, "+y+"px)")
                .style("-webkit-transform", "translate("+x+"px, "+y+"px)")
                .style("-moz-transform", "translate("+x+"px, "+y+"px)")
                .style("-ms-transform", "translate("+x+"px, "+y+"px)");
        }
    };
    
    /*
        width
        Returns the width of the map with the current scale
    */
    var width = function() {
        return _mapWidth;
    };
    
    /*
        height
        Returns the height of the map with the current scale
    */
    var height = function() {
        return _mapHeight;
    };
    
    /*
        _scale
        Returns the scale of the map depending on the minimum of the scales calculated from the width and the height
    */
    var _scale = function() {
        return (function() {
            var scaleFromWidth = app.width() / 1440 * 20000; //This is based on the render on a 1440x900 screen
            var scaleFromHeight = app.height() / 900 * 20000;
            return (scaleFromHeight < scaleFromWidth) ? scaleFromHeight : scaleFromWidth;
        })();
    };
    
    /*
        displayMarkers
        Displays the hospitals' markers with an animation on the map
    */
    var displayMarkers = function() {
        _markersSize = 10;
        
        _markers
            .attr("width", 0)
            .attr("height", 0)
            .attr("x", function(d) { 
                return _projection([d.longitude, d.latitude])[0] - _markersSize / 2;
            })
            .attr("y", function(d) {
                return _projection([d.longitude, d.latitude])[1] - _markersSize / 2;
            })
            .on("mouseover", function(d) {_displayBubble(d);})
            .on("click", function(d) {_displayTopCommunities(d);})
            .transition()
            .duration(800)
            .delay(function(d, i) {return 10 * i;})
            .attr("width", _markersSize)
            .attr("height", _markersSize);
    };
    
    /*
        hideMarkers
        Hides the hospitals' markers with an animation on the map
    */
    var hideMarkers = function() {
        _markers
            .transition()
            .duration(800)
            .delay(function(d, i) {return 10 * i;})
            .attr("width", 0)
            .attr("height", 0);
    };
    
    /*
        _displayBubble(d)
        Displays a bubble for the maker whose data is d
    */
    var _displayBubble = function(d) {
        if(d3.select("#bubble").empty()) {
            var bubble = d3.select("body")
                .append("div")
                .attr("id", "bubble")
                .style("width", _bubbleWidth+"px")
                .style("height", _bubbleHeight+"px")
                .style("top", (_projection([d.longitude, d.latitude])[1] - _bubbleHeight - 5 - _markersSize / 2)+"px")
                .style("left", (_projection([d.longitude, d.latitude])[0] - _bubbleWidth / 2)+"px");
            bubble
                .append("div")
                .style("width", (_bubbleWidth - 20)+"px")
                .style("height", _bubbleHeight+"px")
                .style("padding", "0 10px")
                .append("p")
                .text(d.name);
        }
        else {
            clearTimeout(_bubbleTimer);
            
            var bubble = d3.select("#bubble")
                .style("top", (_projection([d.longitude, d.latitude])[1] - _bubbleHeight - 5 - _markersSize / 2)+"px")
                .style("left", (_projection([d.longitude, d.latitude])[0] - _bubbleWidth / 2)+"px");
            bubble.select("p")
                .text(d.name);
        }

        _bubbleTimer = setTimeout(function() {
            bubble.remove();
        }, 2000);
    };
    
    /*
        _displayTopCommunities(d)
        Displays the heat map and information about the hospital the user clicked
    */
    var _displayTopCommunities = function(d) {
        var totalPatients = 0;
        d.topCommunities.forEach(function(topCommunity) {
            totalPatients += topCommunity.patients;
        });
        
        var counter = 0;
        d.topCommunities.forEach(function(topCommunity) {
            //Case where the community is within MA
            if(topCommunity.state === "MA") {
            }
            //Case where the community is outside MA
            else {
                
            }
        });
    };
    
    /*
        resize
        Calls all the methods resize of the sub-modules
    */
    var resize = function() {
        _svg.attr("width", app.width())
            .attr("height", app.height());

        _projection.scale(_scale())
            .translate([app.width() / 2, app.height() / 2]);
        _path = d3.geo.path().projection(_projection);
        _svg.selectAll("path")
            .attr("d", _path);
        
        _mapLeftOffset = _path.bounds(app.urbanAreaData())[0][0];
        _mapTopOffset = _path.bounds(app.urbanAreaData())[0][1];
        _mapWidth = _path.bounds(app.urbanAreaData())[1][0] - _mapLeftOffset;
        _mapHeight = _path.bounds(app.urbanAreaData())[1][1] - _mapTopOffset;
    };
    
    return {
        init: init,
        resize: resize,
        center: center,
        move: move,
        width: width,
        height: height,
        displayMarkers: displayMarkers,
        hideMarkers: hideMarkers
    };
})();
var mapModule = (function() {
    var _svg = "body svg",
        _markers,
        _markersSize,
        _bubbleWidth = 200,
        _bubbleHeight = 50,
        _projection,
        _path,
        _svg,
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
        
        top(app.height(), false);

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
        if(animated) {
            _svg.style("transform", "translateY(0px)")
                .style("-webkit-transform", "translateY(0px)")
                .style("-moz-transform", "translateY(0px)")
                .style("-ms-transform", "translateY(0px)")
                .style("transform", "translateX(0px)")
                .style("-webkit-transform", "translateX(0px)")
                .style("-moz-transform", "translateX(0px)")
                .style("-ms-transform", "translateX(0px)")
                .style("transition", "1s ease")
                .style("-webkit-transition", "1s ease")
                .style("-moz-transition", "1s ease")
                .style("-ms-transition", "1s ease");
        }
        else {
            _svg.style("transform", "translateY(0px)")
                .style("-webkit-transform", "translateY(0px)")
                .style("-moz-transform", "translateY(0px)")
                .style("-ms-transform", "translateY(0px)")
                .style("transform", "translateX(0px)")
                .style("-webkit-transform", "translateX(0px)")
                .style("-moz-transform", "translateX(0px)")
                .style("-ms-transform", "translateX(0px)");
        }
    };
    
    /*
        top
        Sets the absolute distance of the map from the top of the screen
        If animated, the transition lasts 1s
    */
    var top = function(top, animated) {
        if(animated) {
            _svg.style("transform", "translateY("+top+"px)")
                .style("-webkit-transform", "translateY("+top+"px)")
                .style("-moz-transform", "translateY("+top+"px)")
                .style("-ms-transform", "translateY("+top+"px)")
                .style("transition", "1s ease")
                .style("-webkit-transition", "1s ease")
                .style("-moz-transition", "1s ease")
                .style("-ms-transition", "1s ease");
        }
        else {
            _svg.style("transform", "translateY("+top+"px)")
                .style("-webkit-transform", "translateY("+top+"px)")
                .style("-moz-transform", "translateY("+top+"px)")
                .style("-ms-transform", "translateY("+top+"px)");
        }
    };
    
    /*
        left
        Sets the absolute distance of the map from the left of the screen
        If animated, the transition lasts 1s
    */
    var left = function(left, animated) {
        if(animated) {
            _svg.style("transform", "translateX("+left+"px)")
                .style("-webkit-transform", "translateX("+left+"px)")
                .style("-moz-transform", "translateX("+left+"px)")
                .style("-ms-transform", "translateX("+left+"px)")
                .style("transition", "1s ease")
                .style("-webkit-transition", "1s ease")
                .style("-moz-transition", "1s ease")
                .style("-ms-transition", "1s ease");
        }
        else {
            _svg.style("transform", "translateX("+left+"px)")
                .style("-webkit-transform", "translateX("+left+"px)")
                .style("-moz-transform", "translateX("+left+"px)")
                .style("-ms-transform", "translateX("+left+"px)");
        }
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
        svg.attr("width", app.width())
            .attr("height", app.height());

        _projection.scale(_scale())
            .translate([app.width() / 2, app.height() / 2]);
        _path = d3.geo.path().projection(_projection);
        svg.selectAll("path")
            .attr("d", _path); 
    };
    
    return {
        init: init,
        resize: resize,
        center: center,
        top: top,
        left: left,
        displayMarkers: displayMarkers,
        hideMarkers: hideMarkers
    };
})();
var mapModule = (function() {
    var _svg = "body svg",
        _svgContainer = "#svg",
        _markers,
        _markersSize,
        _bubbleWidth = 200,
        _bubbleHeight = 50,
        _projection,
        _path,
        _mapLastPosition = [0, 0],
        _bubbleTimer;
    
    var init = function() {
        _projection = d3.geo.mercator()
                .center([-71.7, 42.08])
                .scale(_scale())
                .translate([app.width() / 2, app.height() / 2]);

        _path = d3.geo.path().projection(_projection);

        _svg = d3.select(_svg)
            .attr("width", app.width())
            .attr("height", app.height())
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", "0 0 "+app.width()+" "+app.height());
        
        _svg
            .style("-webkit-transform-origin", "center center")
            .style("-moz-transform-origin", "center center")
            .style("-ms-transform-origin", "center center")
            .style("transform-origin", "center center");

        _svg.append("g")
            .classed("features", true)
            .selectAll("path")
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
        move(0, 0, animated);
    };
    
    /*
        move
        Sets the distance of the map from the top and left of the screen based on a percentage of its size
        If animated, the transition lasts 1s
    */
    var move = function(left, top, animated) {
        var x = left * app.width();
        var y = top * app.height();
        
        _mapLastPosition = [left, top];
        
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
        _svg
            .attr("width", app.width())
            .attr("height", app.height())
        
        move(_mapLastPosition[0], _mapLastPosition[1], false);
    };
    
    return {
        init: init,
        resize: resize,
        center: center,
        move: move,
        displayMarkers: displayMarkers,
        hideMarkers: hideMarkers
    };
})();
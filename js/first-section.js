var firstSectionModule = (function() {
    var _wrapper = "section:first-of-type",
        _textContainer = "#intro",
        _recipientContainer = "#intro p:nth-of-type(2)",
        _textContainerWidth = 761,
        _textContainerFontSize = 50,
        _textContainerHeight = 488,
        _textContainerPadding = {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
        },
        _inputContainer = "#intro form",
        _loaderContainer = "#intro p.loader",
        _mapTopOffset = 280;
    
    var init = function() {
        if(!app.touchDevice())
            d3.select("body").on("mousemove", function() {_changeRecipient(d3.mouse(this));});
        else
            _changeRecipient();
        
        d3.selectAll(_textContainer)
            .style("width", _textContainerWidth+"px")
            .style("height", _textContainerHeight+"px")
            .style("padding-top", _textContainerPadding.top+"px")
            .style("padding-right", _textContainerPadding.right+"px")
            .style("padding-bottom", _textContainerPadding.bottom+"px")
            .style("padding-left", _textContainerPadding.left+"px")
            .style("font-size", _textContainerFontSize+"px")
            .style("transform-origin", "center center")
            .style("-webkit-transform-origin", "center center")
            .style("-moz-transform-origin", "center center")
            .style("-ms-transform-origin", "center center");
        
        mapModule.move(0.06, .6, false);
        
        d3.selectAll(_inputContainer+" input, "+_inputContainer+" button")
            .style("font-size", _textContainerFontSize+"px");
        
        d3.select(_inputContainer).on("submit", function() {
            //HTML5 validation
            if(d3.select(this).select("input").node().checkValidity() === true) {
                if (this.checkValidity())
                    _validateForm();
            }
            
            //Old browser
            else {
                var input = d3.select(this).select("input");
                var pattern = /^[1-9]{5}$/;
                
                if(pattern.test(input.attr("value")))
                    _validateForm();
            }
        });
        
        //Geolocalization
        if(navigator.geolocation && !_isFirefox()) {
            d3.select(_textContainer+" form")
                .style("display", "none");
            
            d3.select(_loaderContainer)
                .style("display", "block")
                .append("button")
                .style("font-size", _textContainerFontSize+"px")
                .text("Locate me!")
                .on("click", _findPostalCode);
        }
        
        resize();
    };
    
    /*
        _isFirefox
        Returns true if the browser is Firefox
    */
    var _isFirefox = function() {
        return false;
    };
    
    /*
        resize
        Rescales the text on the screen to fit it, and the map too
    */
    var resize = function() {
        var heightScale = 1;
        var widthScale = 1;
        
        if(app.width() < _textContainerWidth + _textContainerPadding.left + _textContainerPadding.right)
            widthScale = app.width() / (_textContainerWidth + _textContainerPadding.left + _textContainerPadding.right);
        if(app.height() < _textContainerHeight + _textContainerPadding.top + _textContainerPadding.bottom)
            heightScale = app.height() / (_textContainerHeight + _textContainerPadding.top + _textContainerPadding.bottom);
        
        var scale = 1;
        
        //The text needs to be rescaled
        if(widthScale !== 1 || heightScale !== 1) {
            scale = (widthScale < heightScale) ? widthScale : heightScale;
            var leftMargin = (widthScale !== 1) ? (_textContainerWidth + _textContainerPadding.left + _textContainerPadding.right - app.width()) / (2 * scale) : 0;
            //iPhone needs a top margin of 0 (bug)
            if((navigator.userAgent.match(/(iPod|iPhone)/) !== null) && (navigator.userAgent.match(/AppleWebKit/) !== null))
                var topMargin = 0;
            else
                var topMargin = (heightScale !== 1) ? (_textContainerHeight + _textContainerPadding.top + _textContainerPadding.bottom - app.height()) / (2 * scale) : 0;
            
            d3.selectAll(_textContainer)
                .style("-webkit-transform", "scale("+scale+") translate(-"+leftMargin+"px, -"+topMargin+"px)")
                .style("-moz-transform", "scale("+scale+") translate(-"+leftMargin+"px, -"+topMargin+"px)")
                .style("-ms-transform", "scale("+scale+") translate(-"+leftMargin+"px, -"+topMargin+"px)")
                .style("transform", "scale("+scale+") translate(-"+leftMargin+"px, -"+topMargin+"px)");
        }
        else {
            d3.select(_textContainer)
                .style("-webkit-transform", "scale(1) translate(0, 0)")
                .style("-moz-transform", "scale(1) translate(0, 0)")
                .style("-ms-transform", "scale(1) translate(0, 0)")
                .style("transform", "scale(1) translate(0, 0)");
        }
    };
    
    /*
        _findPostalCode(position)
    */
    var _findPostalCode = function(position) {
        _displayLoader();
        navigator.geolocation.getCurrentPosition(function(position) {
            d3.json("http://nominatim.openstreetmap.org/reverse?format=json&lat="+position.coords.latitude+"&lon="+position.coords.longitude+"&addressdetails=0", function(error, data) {
                console.log(data);
            });
        }, function() { //In case of an error or if the user doesn't wan to share his location
            console.log("eeee");
            _hideLoader();
        });
    };
    
    /*
        _validateForm
    */
    var _validateForm = function() {
       _displayLoader();
    };
    
    /*
        _displayLoader
        Displays the loader and hides the form
    */
    var _displayLoader = function() {
        d3.select(_loaderContainer)
            .selectAll("*")
            .remove();
        
        var svg = d3.select(_loaderContainer)
            .style("display", "block")
            .append("svg")
            .attr("width", _textContainerFontSize)
            .attr("height", _textContainerFontSize);
        
        var circle = svg.append("circle")
            .attr("cx", _textContainerFontSize / 2)
            .attr("cy", _textContainerFontSize / 2)
            .attr("r", _textContainerFontSize / 2);
        
        (function repeat() {
            circle.transition()
                .duration(900)
                .attr("r", _textContainerFontSize / 4)
                .transition()
                .duration(900)
                .attr("r", _textContainerFontSize / 2)
                .each("end", repeat);
        })();
    };
    
    /*
        _hideLoader
        Hides the loader and displays the form
    */
    var _hideLoader = function() {
        d3.select(_loaderContainer)
            .style("display", "none");
        
        d3.select(_textContainer+" form")
            .style("display", "block");
    };
        
    /*
        pageEntered
        Positions the map, hides its markers and display the name of the recipient
    */
    var pageEntered = function() {
        mapModule.move(0.06, .6, false);
        
        mapModule.hideMarkers();
    };
    
    /*
        pageLeft
    */
    var pageLeft = function() {
    }
    
    /*
        pageLoaded
        Appends the hospitals' markers to the map with an animation when the page is displayed (at the end of the animation)
    */
    var pageLoaded = function() {
//        mapModule.displayMarkers();
    };
    
    /*
        _changeRecipient
        Changes the name of the recipient in the catchy sentence depending on the position of the cursor or randomly if the device isn't a touch one
    */
    var _changeRecipient = function(coordinates) {
        var recipients = [
            ["you", "your husband", "your sister", "your daugther", "your father"],
            ["your mother", "your son", "your brother", "your wife", "your partner"]
        ];
        
        if(!app.touchDevice()) {
            var column = Math.round(coordinates[0] / app.width() * 4);
            var line = Math.round(coordinates[1] / app.height());
            
            d3.select(_recipientContainer+" span")
                .text(recipients[line][column]+"?");
        }
        else {
            var index = 0;
            if(coordinates !== null && coordinates !== undefined)
                index = coordinates;
            
            var line = ((index % 10) > 4) ? 1 : 0;
            var column = index % 5;
            
            d3.select(_recipientContainer+" span")
                .text(recipients[line][column]+"?");
            
            setTimeout(function() {_changeRecipient(index + 1);}, 1500);
        }
    };
    
    return {
        init: init,
        resize: resize,
        pageEntered: pageEntered,
        pageLeft: pageLeft,
        pageLoaded: pageLoaded
    };
})();
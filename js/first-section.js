var firstSectionModule = (function() {
    var _wrapper = ".main section:first-of-type",
        _textContainer = "#intro",
        _recipientContainer = "#recipient",
        _textContainerWidth = 761,
        _textContainerFontSize = 52,
        _textContainerHeight = 488 - 17 + 3 * _textContainerFontSize, //Space needed for the last line of text
        _textContainerPadding = {                                     //17px due to the two lines text (the two lines height /= _textContainerFontSize)
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
        },
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
            .style("font-size", _textContainerFontSize+"px");
        
        d3.select(_recipientContainer+" p")
            .style("font-size", _textContainerFontSize+"px");
        
        resize();
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
        
        if(app.width() >= app.height()) {
            mapModule.move((app.width() - mapModule.width() * .8) / 2, 2 / 3 * app.height(), true);
            
            d3.select(_recipientContainer+" p")
            .style("font-size", (_textContainerFontSize * scale)+"px");
            
            d3.select(_recipientContainer)
                .style("bottom", (1 / 6 * app.height() - _textContainerFontSize * scale / 2)+"px")
                .style("width", app.width()+"px");
        }
    };
        
    /*
        pageEntered
        Positions the map, hides its markers and display the name of the recipient
    */
    var pageEntered = function() {
        if(app.width() >= app.height())
            mapModule.move((app.width() - mapModule.width() * .8) / 2, 2 / 3 * app.height(), true);
        
            mapModule.hideMarkers();
        
        d3.select(_recipientContainer)
            .style("transform", "translateY(0)")
            .style("-webkit-transform", "translateY(0)")
            .style("-moz-transform", "translateY(0")
            .style("-ms-transform", "translateY(0)")
            .style("transition", "1s ease")
            .style("-webkit-transition", "1s ease")
            .style("-moz-transition", "1s ease")
            .style("-ms-transition", "1s ease");
    };
    
    /*
        pageLeft
        Hides the name of the recipients
    */
    var pageLeft = function() {
        d3.select(_recipientContainer)
            .style("transform", "translateY(-"+app.height()+"px)")
            .style("-webkit-transform", "translateY(-"+app.height()+"px)")
            .style("-moz-transform", "translateY(-"+app.height()+"px)")
            .style("-ms-transform", "translateY(-"+app.height()+"px)")
            .style("transition", ".5s ease")
            .style("-webkit-transition", "1s ease")
            .style("-moz-transition", "1s ease")
            .style("-ms-transition", "1s ease");
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
            
            d3.select(_recipientContainer+" p")
                .text(recipients[line][column]+"?");
        }
        else {
            var index = 0;
            if(coordinates !== null && coordinates !== undefined)
                index = coordinates;
            
            var line = ((index % 10) > 4) ? 1 : 0;
            var column = index % 5;
            
            d3.select(_recipientContainer+" p")
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
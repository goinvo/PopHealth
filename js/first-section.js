var firstSectionModule = (function() {
    var _wrapper = ".main section:first-of-type",
        _textContainer = "#intro",
        _textContainerWidth = 812,
        _textContainerPadding = 20;
    
    var init = function() {
        d3.select("body").on("mousemove", function() {_changeRecipient(d3.mouse(this));});
        mapModule.top(app.height() - 300, true);
        
        d3.select(_textContainer)
            .style("width", _textContainerWidth+"px")
            .style("padding", _textContainerPadding+"px");
        
        resize();
    };
    
    /*
        resize
        Rescales the text on the screen to fit it
    */
    var resize = function() {
        if(app.width() < _textContainerWidth + 2 * _textContainerPadding) {
            var scale = app.width() / (_textContainerWidth + 2 * _textContainerPadding);
            var leftMargin = (_textContainerWidth + 2 * _textContainerPadding - app.width()) / (2 * scale);
            d3.select(_textContainer)
                .style("-webkit-transform", "scale("+scale+") translateX(-"+leftMargin+"px)")
                .style("-moz-transform", "scale("+scale+") translateX(-"+leftMargin+"px)")
                .style("-ms-transform", "scale("+scale+") translateX(-"+leftMargin+"px)")
                .style("transform", "scale("+scale+") translateX(-"+leftMargin+"px)");
        }
        else {
            d3.select(_textContainer)
                .style("-webkit-transform", "scale(1) translateX(0px)")
                .style("-moz-transform", "scale(1) translateX(0px)")
                .style("-ms-transform", "scale(1) translateX(0px)")
                .style("transform", "scale(1) translateX(0px)");
        }
    };
        
    /*
        pageEntered
    */
    var pageEntered = function() {
        mapModule.top(app.height() - 300, true);
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
        mapModule.displayMarkers();
    };
    
    /*
        _changeRecipient
        Changes the name of the recipient in the catchy sentence depending on the position of the cursor
    */
    var _changeRecipient = function(coordinates) {
        (function() {
            var recipients = [
                ["you", "your husband", "your sister", "your daugther", "your father"],
                ["your mother", "your son", "your brother", "your wife", "your partner"]
            ];

            var column = Math.round(coordinates[0] / app.width() * 4);
            var line = Math.round(coordinates[1] / app.height());
            
            d3.select(_wrapper+" p:last-of-type")
                .text(recipients[line][column]+"?");
        })();
    };
    
    return {
        init: init,
        resize: resize,
        pageEntered: pageEntered,
        pageLeft: pageLeft,
        pageLoaded: pageLoaded
    };
})();
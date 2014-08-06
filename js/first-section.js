var firstSectionModule = (function() {
    var _wrapper = ".main section:first-of-type",
        _textContainer = "#intro",
        _textContainerWidth = 812,
        _textContainerHeight = 613,
        _textContainerPadding = 20;
    
    var init = function() {
        d3.select("body").on("mousemove", function() {_changeRecipient(d3.mouse(this));});
        mapModule.top(app.height() - 300, true);
        
        d3.select(_textContainer)
            .style("width", _textContainerWidth+"px")
            .style("height", _textContainerHeight+"px")
            .style("padding", _textContainerPadding+"px");
        
        resize();
    };
    
    /*
        resize
        Rescales the text on the screen to fit it
    */
    var resize = function() {
        var heightScale = 1;
        var widthScale = 1;
        
        if(app.width() < _textContainerWidth + 2 * _textContainerPadding)
            widthScale = app.width() / (_textContainerWidth + 2 * _textContainerPadding);
        if(app.height() < _textContainerHeight + 2 * _textContainerPadding)
            heightScale = app.height() / (_textContainerHeight + 2 * _textContainerPadding);
        
        //The text needs to be rescaled
        if(widthScale !== 1 || heightScale !== 1) {
            var scale = (widthScale < heightScale) ? widthScale : heightScale;
            var leftMargin = (widthScale !== 1) ? (_textContainerWidth + 2 * _textContainerPadding - app.width()) / (2 * scale) : 0;
            var topMargin = (heightScale !== 1) ? (_textContainerHeight + 2 * _textContainerPadding - app.height()) / (2 * scale) : 0;
            
            d3.select(_textContainer)
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
var firstSectionModule = (function() {
    var _wrapper = ".main section:first-of-type";
    
    var init = function() {
        d3.select("body").on("mousemove", function() {_changeRecipient(d3.mouse(this));});
        mapModule.top(app.height() - 300, true);
    };
    
    /*
        resize
        Calls all the methods resize of the sub-modules
    */
    var resize = function() { 
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
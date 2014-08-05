var secondSectionModule = (function() {
    var wrapper = ".main section:nth-of-type(2)";
    
    var init = function() {
    };
    
    /*
        resize
        Call all the methods resize of the sub-modules
    */
    var resize = function() {
        
    };
    
    /*
        pageEntered
    */
    var pageEntered = function() {
        mapModule.center(true);
    };
    
    /*
        pageLeft
    */
    var pageLeft = function() {
        
    }
    
    /*
        pageLoaded
    */
    var pageLoaded = function() {
        
    }
    
    return {
        init: init,
        resize: resize,
        pageEntered: pageEntered,
        pageLeft: pageLeft,
        pageLoaded: pageLoaded
    };
})();
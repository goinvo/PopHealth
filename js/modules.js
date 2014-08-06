var app = (function() {
    var _urbanAreaData = {},
        _hospitalData = {},
        _width = window.innerWidth,
        _height = window.innerHeight,
        _pageIndex = 1;
    
    var init = function() {
        //We load the data
        d3.json("data/urban_areas.json", function(error, urbanAreaData) { //TODO in case of error
            _urbanAreaData = urbanAreaData;

            //We load the hospitals' data
            d3.json("data/hospitals.json", function(error, hospitalData) {
                _hospitalData = hospitalData;
                
                //We load the js files corresponding to each section and the map
                _require("js/map.js", function(){
                    mapModule.init();
                    _require("js/first-section.js", function(){firstSectionModule.init();});
                    _require("js/second-section.js", function(){secondSectionModule.init();});
                });
            });
        });
        
        //We initialize onepagescroll
        onePageScroll(".main", {
            sectionContainer: "section",
            easing: "ease",
            animationTime: 1000,
            pagination: true,
            updateURL: false,
            beforeMove: function(index, next_el) {_pageIndexUpdate(index, true);},
            afterMove: function(index, next_el) {_pageIndexUpdate(index, false);},
            loop: false,
            keyboard: true,
            responsiveFallback: false
        });
    };
    
    var resize = function() {
        _width = window.innerWidth;
        _height = window.innerHeight;
        
        firstSectionModule.resize();
        secondSectionModule.resize();
    };
    
    /*
        _require(url, callback)
        Loads the javascript file located at the url url and executes the callback function when ready
    */
    var _require = function(url, callback) {
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement('script');
        script.type = "text/javascript";
        script.src = url;
        head.appendChild(script);

        script.onreadystatechange = callback;
        script.onload = callback;
    };
    
    /*
        _pageIndexUpdate
        Tells the concerned modules corresponding to the pages if they are about to get left or entered;
    */
    var _pageIndexUpdate = function(index, beforeMove) {
        if(beforeMove) {
            if(index == 1) {
                firstSectionModule.pageEntered();
                secondSectionModule.pageLeft();
            }
            else if(index == 2) {
                firstSectionModule.pageLeft();
                secondSectionModule.pageEntered();
            }
            else {
                secondSectionModule.pageLeft();
            }
        }
        else {
            if(index == 1)
                secondSectionModule.pageLoaded();
            else if(index == 2)
                firstSectionModule.pageLoaded();
//            else
//                thirdSectionModule.pageLeft();
        } 
    };
    
    /*
        getWidth
        Returns the width of the window
    */
    var getWidth = function() {
        return _width; 
    };
    
    /*
        getHeight
        Returns the height of the window
    */
    var getHeight = function() {
        return _height; 
    };
    
    /*
        getPageIndex
        Returns the page index
    */
    var getPageIndex = function() {
        return _pageIndex;
    };
    
    /*
        getUrbanAreaData
        Returns the _urbanAreaData object
    */
    var getUrbanAreaData = function() {
        return _urbanAreaData; 
    };
    
    /*
        getHospitalData
        Returns the _hospitalData object
    */
    var getHospitalData = function() {
        return _hospitalData; 
    };
    
    /*
        isTouchDevice
        Returns true if the device is a touch one
    */
    var isTouchDevice = function() {
        return (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
    };
    
    return {
        init: init,
        resize: resize,
        width: getWidth,
        height: getHeight,
        urbanAreaData: getUrbanAreaData,
        hospitalData: getHospitalData,
        touchDevice: isTouchDevice
    };
})();
var menuModule = (function() {
    var _config = {
        wrapper: "body",
        menuClass: "pane",
        titleElement: "h1",
        itemElement: "div",
        itemClass: "hospital",
        itemTitleElement: "h2",
        itemSubtitleElement: "h3",
        quitButtonClass: "quit",
        activeItemClass: "active"
    };
    
    var _menu;
    
    /*
        open(options)
        Desc:   Display the menu
                options is an object that can contain the onQuit and onQuitArguments properties
                If so, when the menu is closed, it calls the callback function onQuit with the array of arguments onQuitArguments
    */
    var open = function(options) {
        _menu
            .style("display", "block")
            .classed("animated fadeInUp", true);
        
        _menu.select("."+_config.quitButtonClass)
            .on("click", function() {
                if(options !== null && options !== undefined) {
                    if(options.onQuit !== null && options.onQuit !== undefined) {
                        options.onQuit.apply(null, options.onQuitArguments);
                    }
                }
                close();
            });
    };
    
    /*
        close
        Desc:   Close the menu and clean (remove) its content
    */
    var close = function () {
        _menu.classed("fadeInUp", false)
            .classed("fadeOutDown", true);
        _reset();
    };
    
    
    /*
        _reset
        Desc:   Remove the content of the menu
    */
    var _reset = function() {
        _menu.selectAll("*")
            .filter(function() {return !d3.select(this).classed(_config.quitButtonClass);})
            .remove();
    };
    
    /*
        setTitle(title)
        Desc:   Append the title "title" to the menu using the element _config.titleElement
                If it already existed, it is just replaced
                It returns the menu itself so it could be chained with other function of the menu
    */
    var setTitle = function(title) {
        if(!_menu.select(_config.titleElement).empty()) { //In case a title already exists
            _menu.select(_config.titleElement)
                .text(title);
        }
        else {
            _menu.append(_config.titleElement)
                .text(title);
        }
        
        return this;
    };
    
    /*
        addItemContent(content)
        Desc:   Append an item _config.itemElement formed of a _config.itemTitleElement and a _config.itemSubtitleElement with their associated classes
                content is made of content.title, content.subtitle, content.mousover, content.mouseoverArguments, content.mouseover, and content.mouseoverArguments
                The four last properties are two callback functions associated with their respective arrays of arguments that are called when the event they designate is caught
                It returns the menu itself so it could be chained with other function of the menu
    */
    var addContent = function(content) {
        _menu.node().appendChild(content.node());
        _menu.classed("fadeOutDown", false)
            .classed("fadeInUp", true);
        
//        var item = _menu.append(_config.itemElement)
//            .data([{
//                id: content.id,
//                title: content.title,
//                subtitle: content.subtitle
//            }])
//            .attr("class", _config.itemClass);
//        item.append(_config.itemTitleElement)
//            .text(content.title)
//        item.append(_config.itemSubtitleElement)
//            .text(content.subtitle);
//
//        if(content.mouseover !== null && content.mouseover !== undefined) {
//            item.on("mouseover", function() {
//                content.mouseover.apply(null, content.mouseoverArguments)
//            });
//        }
//
//        if(content.mouseout !== null && content.mouseout !== undefined) {
//            item.on("mouseout", function() {
//                content.mouseout.apply(null, content.mouseoutArguments)
//            });
//        }
//
//        return this;
    };
    
    /*
        resetItemContent
        Desc:   Remove all the _config.itemElement from the menu
                It returns the menu itself so it could be chained with other function of the menu
    */
    var resetContent = function() {
        _menu.selectAll("*")
            .filter(function() {return !d3.select(this).classed(_config.quitButtonClass);})
            .remove();
        
        return this;  
    };
    
    /*
        highlightItem(itemName)
        Desc:   Apply to the item whose id is id the class _config.activeClass
                It returns the menu itself so it could be chained with other function of the menu
    */
    var highlightItem = function(element, id) {
        _menu.selectAll(element)
            .filter(function(d) {
                if(d !== null && d !== undefined)
                    return d.id == id;
                return false;
            })
            .classed(_config.activeItemClass, true);
        
        return this;
    };
    
    /*
        resetItem(itemName)
        Desc:   Remove the class _config.activeClass of the item whose id is id
                It returns the menu itself so it could be chained with other function of the menu
    */
    var resetItem = function(element, id) {
        _menu.selectAll(element)
            .filter(function(d) {
                if(d !== null && d !== undefined)
                    return d.id == id;
                return false;
            })
            .classed(_config.activeItemClass, false);
        
        return this;
    };
    
    /*
        update
        Desc:   Resize the menu depending on the size of the window
    */
    var update = function() {
    };
    
    
    /*
        init
        Desc:   Append the menu to the DOM as of its quitButton
    */
    var init = function() {
        _menu = d3.select(_config.wrapper)
            .append("div")
            .attr("class", _config.menuClass)
            .style("display", "none");
        
        _menu.append("i")
            .classed("fa fa-times "+_config.quitButtonClass, true);
    };
    
    return {
        open: open,
        close: close,
        setTitle: setTitle,
        addContent: addContent,
        resetContent: resetContent,
        highlightItem: highlightItem,
        update: update,
        resetItem: resetItem,
        init: init
    };
})();
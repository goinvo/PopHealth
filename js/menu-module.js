var menuModule = (function() {
    var _config = {
        wrapper: "body",
        menuClass: "pane",
        titleElement: "h1",
        noteElement: "caption",
        itemElement: "div",
        itemClass: "hospital",
        itemTitleElement: "h2",
        itemSubtitleElement: "h3",
        quitButtonClass: "quit",
        activeItemClass: "active"
    };
    
    var _menu,
        _menuOpened = false;
    
    /*
        open(options)
        Displays the menu
        options is an object that can contain the onQuit and onQuitArguments properties
        If so, when the menu is closed, it calls the callback function onQuit with the array of arguments onQuitArguments
    */
    var open = function(options) {
        _menu
            .style("display", "block")
            .classed("fadeOutDown", false)
            .classed("animated fadeInUp", true);
        
        _menuOpened = true;
        
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
        Closes the menu and clean (remove) its content
    */
    var close = function () {
        _menu.classed("fadeInUp", false)
            .classed("fadeOutDown", true);
        _reset();
        _menuOpened = false;
        markerModule.reset();
    };
    
    /*
        isOpened
        Returns true is the menu is opened
    */
    var isOpened = function() {
        return _menuOpened;  
    };
    
    
    /*
        _reset
        Removes the content of the menu
    */
    var _reset = function() {
        _menu.selectAll("*")
            .filter(function() {return !d3.select(this).classed(_config.quitButtonClass);})
            .remove();
    };
    
    /*
        setTitle(title)
        Appends the title text "title" to the menu using the element _config.titleElement
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
        setNote(note)
        Appends the note html content "note" to the menu using the element _config.noteElement
        If it already existed, it is just replaced
        It returns the menu itself so it could be chained with other function of the menu
    */
    var setNote = function(note) {
        if(!_menu.select(_config.noteElement).empty()) { //In case a note already exists
            _menu.select(_config.noteElement)
                .html(note);
        }
        else {
            _menu.append(_config.noteElement)
                .html(note);
        }
        
        return this;
    };
    
    /*
        addItemContent(content)
        Appends the d3 element to the menu
        It returns the menu itself so it could be chained with other function of the menu
    */
    var addContent = function(content) {
        _menu.node().appendChild(content.node());
        _menu.classed("fadeOutDown", false)
            .classed("fadeInUp", true);
        
        return this;
    };
    
    /*
        resetItemContent
        Removes all the _config.itemElement from the menu
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
        Applies to the item whose id is id the class _config.activeClass
        It returns the menu itself so it could be chained with other function of the menu
    */
    var highlightItem = function(element, color, id) {
        _menu.selectAll(element)
            .filter(function(d) {
                if(d !== null && d !== undefined)
                    return d.id == id;
                return false;
            })
            .classed(_config.activeItemClass, true)
            .style("background-color", color);
        
        return this;
    };
    
    /*
        resetItem(itemName)
        Removes the class _config.activeClass of the item whose id is id
        It returns the menu itself so it could be chained with other function of the menu
    */
    var resetItem = function(element, id) {
        _menu.selectAll(element)
            .filter(function(d) {
                if(d !== null && d !== undefined)
                    return d.id == id;
                return false;
            })
            .classed(_config.activeItemClass, false)
            .attr("style", null);
        
        return this;
    };
    
    /*
        update
    */
    var update = function() {
    };
    
    
    /*
        init
        Appends the menu to the DOM as of its quitButton
    */
    var init = function() {
        _menu = d3.select(_config.wrapper)
            .append("div")
            .attr("class", _config.menuClass)
            .style("display", "none");
        
        _menu.append("div")
            .classed(_config.quitButtonClass, true)
            .html("&times;");
    };
    
    return {
        open: open,
        close: close,
        isOpened: isOpened,
        setTitle: setTitle,
        setNote: setNote,
        addContent: addContent,
        resetContent: resetContent,
        highlightItem: highlightItem,
        update: update,
        resetItem: resetItem,
        init: init
    };
})();
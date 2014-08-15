var menuModule = (function() {
    var _config = {
        wrapper: "body",
        firstPaneClass: "first-pane",
        secondPaneClass: "second-pane",
        titleElement: "h1",
        noteElement: "caption",
        itemElement: "div",
        itemClass: "hospital",
        itemTitleElement: "h2",
        itemSubtitleElement: "h3",
        quitButtonClass: "quit",
        activeItemClass: "active"
    };
    
    var _firstPane,
        _secondPane,
        _firstPaneOpened = false,
        _secondPaneOpened = false;
    
    /*
        open(id, options)
        Opens the id-th pane
        options is an object that can contain the onQuit and onQuitArguments properties
        If so, when the menu is closed, it calls the callback function onQuit with the array of arguments onQuitArguments
    */
    var open = function(id, options) {
        var menu = (id === 1) ? _firstPane : _secondPane;
        
        if(id === 1) {
            _firstPane
                .style("display", "block")
                .classed("fadeOutDown", false)
                .classed("animated fadeInUp", true)
                .style("animation-delay", "0s")
                .style("-webkit-animation-delay", "0s")
                .style("-moz-animation-delay", "0s")
                .style("-ms-animation-delay", "0s");
        }
        else {
            _secondPane
                .style("display", "block")
                .classed("fadeOutLeft", false)
                .classed("animated fadeInLeft", true)
                .style("animation-delay", ".5s")
                .style("-webkit-animation-delay", ".5s")
                .style("-moz-animation-delay", ".5s")
                .style("-ms-animation-delay", ".5s");
        }
        
        if(id === 1)
            _firstPaneOpened = true;
        else
            _secondPaneOpened = true;
        
        menu.select("."+_config.quitButtonClass)
            .on("click", function() {
                if(options !== null && options !== undefined) {
                    if(options.onQuit !== null && options.onQuit !== undefined) {
                        options.onQuit.apply(null, options.onQuitArguments);
                    }
                }
                close(id);
            });
    };
    
    /*
        close(id)
        Closes the id-th pane and cleans (removes) its content
    */
    var close = function (id) {

        if(id === 1) {
            _firstPane.classed("fadeInUp", false)
                .classed("fadeOutDown", true)
                .style("animation-delay", ".5s")
                .style("-webkit-animation-delay", ".5s")
                .style("-moz-animation-delay", ".5s")
                .style("-ms-animation-delay", ".5s");
            _secondPane.classed("fadeInLeft", false)
                .classed("fadeOutLeft", true)
                .style("animation-delay", "0s")
                .style("-webkit-animation-delay", "0s")
                .style("-moz-animation-delay", "0s")
                .style("-ms-animation-delay", "0s");
        }
        else {
            _secondPane.classed("fadeInLeft", false)
                .classed("fadeOutLeft", true)
                .style("animation-delay", 0)
                .style("-webkit-animation-delay", 0)
                .style("-moz-animation-delay", 0)
                .style("-ms-animation-delay", 0);
        }
        
        
        if(id === 1) {
            _firstPaneOpened = false;
            _secondPaneOpened = false;
        }
        else
            _secondPaneOpened = false;
        
        markerModule.reset();
    };
    
    /*
        isOpened(id)
        Returns true is the id-th pane is opened
    */
    var isOpened = function(id) {
        if(id === 1)
            return _firstPaneOpened;  
        return _secondPaneOpened;
    };
    
    
    /*
        _reset
        Removes the content of the id-th pane
    */
    var _reset = function(id) {
        var menu = (id === 1) ? _firstPane : _secondPane;
        
        menu.selectAll("*")
            .filter(function() {return !d3.select(this).classed(_config.quitButtonClass);})
            .remove();
    };
    
    /*
        setTitle(id, title)
        Appends the title text "title" to the id-th pane using the element _config.titleElement
        If it already existed, it is just replaced
        It returns the menu itself so it could be chained with other function of the menu
    */
    var setTitle = function(id, title) {
        var menu = (id === 1) ? _firstPane : _secondPane;
        
        if(!menu.select(_config.titleElement).empty()) { //In case a title already exists
            menu.select(_config.titleElement)
                .text(title);
        }
        else {
            menu.append(_config.titleElement)
                .text(title);
        }
        
        return this;
    };
    
    /*
        setNote(id, note)
        Appends the note html content "note" to the id-th pane using the element _config.noteElement
        If it already existed, it is just replaced
        It returns the menu itself so it could be chained with other function of the menu
    */
    var setNote = function(id, note) {
        var menu = (id === 1) ? _firstPane : _secondPane;
        
        if(!menu.select(_config.noteElement).empty()) { //In case a note already exists
            menu.select(_config.noteElement)
                .html(note);
        }
        else {
            menu.append(_config.noteElement)
                .html(note);
        }
        
        return this;
    };
    
    /*
        addContent(id, content)
        Appends the d3 element to the id-th pane
        It returns the menu itself so it could be chained with other function of the menu
    */
    var addContent = function(id, content) {
        var menu = (id === 1) ? _firstPane : _secondPane;
        
        menu.node().appendChild(content.node());
        
        return this;
    };
    
    /*
        resetItemContent(id)
        Removes all the _config.itemElement from the id-th pane
        It returns the menu itself so it could be chained with other function of the menu
    */
    var resetContent = function(id) {
        var menu = (id === 1) ? _firstPane : _secondPane;
        
        menu.selectAll("*")
            .filter(function() {return !d3.select(this).classed(_config.quitButtonClass);})
            .remove();
        
        return this;  
    };
    
    /*
        highlightItem(id, element, color, id_item)
        Applies to the item whose id is id_item the class _config.activeClass
        It returns the menu itself so it could be chained with other function of the id-th pane
    */
    var highlightItem = function(id, element, color, id_item) {
        var menu = (id === 1) ? _firstPane : _secondPane;
        
        menu.selectAll(element)
            .filter(function(d) {
                if(d !== null && d !== undefined)
                    return d.id == id_item;
                return false;
            })
            .classed(_config.activeItemClass, true)
            .style("background-color", color);
        
        return this;
    };
    
    /*
        resetItem(id, element, id_item)
        Removes the class _config.activeClass of the item whose id is id_item
        It returns the menu itself so it could be chained with other function of the id-th menu
    */
    var resetItem = function(id, element, id_item) {
        var menu = (id === 1) ? _firstPane : _secondPane;
        
        menu.selectAll(element)
            .filter(function(d) {
                if(d !== null && d !== undefined)
                    return d.id == id_item;
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
        Appends the menus to the DOM as of its quitButton
    */
    var init = function() {
        _firstPane = d3.select(_config.wrapper)
            .append("div")
            .attr("class", _config.firstPaneClass)
            .style("display", "none");
        
        _firstPane.append("div")
            .classed(_config.quitButtonClass, true)
            .html("&times;");
        
        _secondPane = d3.select(_config.wrapper)
            .append("div")
            .attr("class", _config.secondPaneClass)
            .style("display", "none");
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
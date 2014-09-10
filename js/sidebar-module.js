var sidebar = (function() {
    var _config = {
        sidebarElem: "aside", //Sidebar, container of the two columns of cards
        panelElem: ".panel", //First column
        comparePanelElem: ".compare-panel", //Second column displayed when the compare mode is active
        cardClass: "card",
        toolbarElem: ".toolbar", //The toolbar which contains the search field and compare button
        cardMarginBottom: 15, //The default margin at the bottom of the cards
        sidebarInitialWidth: 350,
        autocompleteElem: ".autocomplete" //The box that contains the results of the autocomplete feature
    },
        _isCardVisible = { //Contains the card visible
            hospital: []
        },
        _sidebarDisplayed = false, //If the sidebar is in its initial state
        _cardIndex = 0,
        _compareMode = false,
        _dragBehavior, //The d3 function which contains the drag behavior
        _lastSidebarCardMoved = null, //The last dragged card of the first column
        _lastPanelCardMoved = null, //The one of the compare column
        _cardMovement, //"up" or "down" depending of the movement the user does with the dragged card
        _cardsOrder = { //Contains the cards order
            hospitals: [],
            areas: []
        },
        _cardsTmpOrder = [], //Temporary cards' order
        _cardsMoved = false,
        _autocompleteHidden = true,
        _searchSelectedItem = null; //Contains the current selected item (d3 object) in the autocomplete list
    
    /*
        init
        Creates the d3 function responsible of the drag feature, initializes th search box
    */
    var init = function() {
        _dragBehavior = d3.behavior.drag()
            .origin(function(d) {return {x: 0, y: d.y};})
            .on("dragstart", _cardDragStarted)
            .on("drag", _cardDragged)
            .on("dragend", _cardDragEnded);
        
        d3.select(_config.toolbarElem+" input")
            .on("keyup",function() {
                switch(d3.event.keyCode) {
                        case 13:
                            if(_searchSelectedItem !== null)
                                app.view().searchValueSelected(_searchSelectedItem.datum().id);
                            else if(d3.selectAll(_config.autocompleteElem+" li").size() === 1)
                                app.view().searchValueSelected(d3.select(_config.autocompleteElem+" li").datum().id);
                            break;
                        case 38:
                            if(_searchSelectedItem !== null && _searchSelectedItem.node().previousElementSibling !== null) {
                                _searchSelectedItem.classed("hovered", false);
                                _searchSelectedItem = d3.select(_searchSelectedItem.node().previousElementSibling);
                                _searchSelectedItem.classed("hovered", true);
                            }
                            break;
                        case 40:
                            if(_searchSelectedItem === null) {
                                var currentItem = d3.select(_config.autocompleteElem+" li");
                                currentItem.classed("hovered", true);
                                _searchSelectedItem = currentItem;
                            }
                            else {
                                _searchSelectedItem.classed("hovered", false);
                                _searchSelectedItem = d3.select(_searchSelectedItem.node().nextElementSibling);
                                _searchSelectedItem.classed("hovered", true);
                            }
                            break;
                }
            });
    };
    
    /*
        _cardDragStarted
        Resets _lastSidebarCardMoved and _lastPanelCardMoved
    */
    var _cardDragStarted = function() {
        _lastPanelCardMoved = null;
        _lastSidebarCardMoved = null;
    };
    
    /*
        _cardDragged(d)
        Moves the cards behind the one that is currently dragged
        d is the data binded to the card
    */
    var _cardDragged = function(d) {
        var id = d.id;
        var panelCard = d3.selectAll(_config.comparePanelElem+" ."+_config.cardClass).filter(function(d) {return d.id === id;});
        var sidebarCard = d3.selectAll(_config.panelElem+" ."+_config.cardClass).filter(function(d) {return d.id === id;});
        
        _cardsMoved = true;
        
        sidebarCard
            .classed("fadeInUp", false) //Needed to remove the animate.css effect
            .classed("dragged", true)
            .style("-webkit-transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";})
            .style("-moz-transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";})
            .style("-ms-transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";})
            .style("transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";});
                
        if(_compareMode && !panelCard.empty()) { //We also check in the second item has been picked
            panelCard
                .classed("fadeInUp", false) //Needed to remove the animate.css effect
                .classed("dragged", true)
                .style("-webkit-transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";})
                .style("-moz-transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";})
                .style("-ms-transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";})
                .style("transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";});
        }
        
        var cardPosition = sidebarCard.node().offsetTop;
        var sidebarCardSibling = (d.y < 0) ? d3.select(sidebarCard.node().previousSibling) : d3.select(sidebarCard.node().nextSibling);
        if(_compareMode && !panelCard.empty()) //We also check in the second item has been picked
            var panelCardSibling = (d.y < 0) ? d3.select(panelCard.node().previousSibling) : d3.select(panelCard.node().nextSibling);

        while(!sidebarCardSibling.empty()) {
            var cardSiblingPosition = sidebarCardSibling.node().offsetTop;
            var cardSiblingHeight = sidebarCardSibling.node().offsetHeight;
            var cardSiblingMarginBottom = parseInt(sidebarCardSibling.style("margin-bottom"));
            var cardHeight = sidebarCard.node().offsetHeight + parseInt(sidebarCard.style("margin-bottom"));
            
            //The card is initially above the sibling one
            if(cardPosition < cardSiblingPosition) {
                //If it is now below the beginning of the sibling
                if(cardPosition + d.y > cardSiblingPosition) {
                    _lastSidebarCardMoved = sidebarCardSibling;
                    _cardMovement = "down";

                    sidebarCardSibling
                        .classed("fadeInUp", false)
                        .style({
                            "-webkit-transform": "translateY(-"+cardHeight+"px)",
                            "-moz-transform": "translateY(-"+cardHeight+"px)",
                            "-ms-transform": "translateY(-"+cardHeight+"px)",
                            "transform": "translateY(-"+cardHeight+"px)"
                        });
                    
                    sidebarCardSibling.datum().translateY = -cardHeight;

                    if(_compareMode && !panelCard.empty()) { //We also check in the second item has been picked
                        _lastPanelCardMoved = panelCardSibling;

                        panelCardSibling
                            .classed("fadeInUp", false)
                            .style({
                                "-webkit-transform": "translateY(-"+cardHeight+"px)",
                                "-moz-transform": "translateY(-"+cardHeight+"px)",
                                "-ms-transform": "translateY(-"+cardHeight+"px)",
                                "transform": "translateY(-"+cardHeight+"px)"
                            });
                        
                        panelCardSibling.datum().translateY = -cardHeight;
                    }
                }
                
                //We remove the eventual translate because the dragged card is above the sibling
                else if(sidebarCardSibling.datum().translateY !== undefined && sidebarCardSibling.datum().translateY !== 0 && cardPosition + d.y < cardSiblingPosition + sidebarCardSibling.datum().translateY + cardSiblingHeight / 2) {
                    _lastSidebarCardMoved = sidebarCardSibling;
                    _cardMovement = "up";

                    sidebarCardSibling
                        .classed("fadeInUp", false)
                        .style({
                            "-webkit-transform": "translateY(0px)",
                            "-moz-transform": "translateY(0px)",
                            "-ms-transform": "translateY(0px)",
                            "transform": "translateY(0px)"
                        });
                    
                    sidebarCardSibling.datum().translateY = 0;

                    if(_compareMode && !panelCard.empty()) { //We also check in the second item has been picked
                        _lastPanelCardMoved = panelCardSibling;

                        panelCardSibling
                            .classed("fadeInUp", false)
                            .style({
                                "-webkit-transform": "translateY(0px)",
                                "-moz-transform": "translateY(0px)",
                                "-ms-transform": "translateY(0px)",
                                "transform": "translateY(0px)"
                            });
                        
                        panelCardSibling.datum().translateY = 0;
                    }
                }
            }
            else {
                //If it is now above the beginning of the sibling
                if(cardPosition + d.y < cardSiblingPosition + cardSiblingHeight / 2) {
                    _lastSidebarCardMoved = sidebarCardSibling;
                    _cardMovement = "up";

                    sidebarCardSibling
                        .classed("fadeInUp", false)
                        .style({
                            "-webkit-transform": "translateY("+cardHeight+"px)",
                            "-moz-transform": "translateY("+cardHeight+"px)",
                            "-ms-transform": "translateY("+cardHeight+"px)",
                            "transform": "translateY("+cardHeight+"px)"
                        });
                    
                    sidebarCardSibling.datum().translateY = cardHeight;

                    if(_compareMode && !panelCard.empty()) { //We also check in the second item has been picked
                        _lastPanelCardMoved = panelCardSibling;

                        panelCardSibling
                            .classed("fadeInUp", false)
                            .style({
                                "-webkit-transform": "translateY("+cardHeight+"px)",
                                "-moz-transform": "translateY("+cardHeight+"px)",
                                "-ms-transform": "translateY("+cardHeight+"px)",
                                "transform": "translateY("+cardHeight+"px)"
                            });
                        
                        panelCardSibling.datum().translateY = cardHeight;
                    }
                }
                
                //We remove the eventual translate because the dragged card is below the sibling
                else if(sidebarCardSibling.datum().translateY !== undefined && sidebarCardSibling.datum().translateY !== 0 && cardPosition + d.y > cardSiblingPosition + cardSiblingHeight / 2) {
                    _lastSidebarCardMoved = sidebarCardSibling;
                    _cardMovement = "down";

                    sidebarCardSibling
                        .classed("fadeInUp", false)
                        .style({
                            "-webkit-transform": "translateY(0px)",
                            "-moz-transform": "translateY(0px)",
                            "-ms-transform": "translateY(0px)",
                            "transform": "translateY(0px)"
                        });
                    
                    sidebarCardSibling.datum().translateY = 0;

                    if(_compareMode && !panelCard.empty()) { //We also check in the second item has been picked
                        _lastPanelCardMoved = panelCardSibling;

                        panelCardSibling
                            .classed("fadeInUp", false)
                            .style({
                                "-webkit-transform": "translateY(0px)",
                                "-moz-transform": "translateY(0px)",
                                "-ms-transform": "translateY(0px)",
                                "transform": "translateY(0px)"
                            });
                        
                        panelCardSibling.datum().translateY = 0;
                    }
                }
            }
            
            sidebarCardSibling = (d.y < 0) ? d3.select(sidebarCardSibling.node().previousSibling) : d3.select(sidebarCardSibling.node().nextSibling);
            if(_compareMode && !panelCard.empty()) //We also check in the second item has been picked
                panelCardSibling = (d.y < 0) ? d3.select(panelCardSibling.node().previousSibling) : d3.select(panelCardSibling.node().nextSibling);
        }
    };
    
    /*
        _insertElementBefore(array, index1, index2)
        Moves the position of the element at index1 right before the element at position index2 in the array
    */
    var _insertElementBefore = function(array, index1, index2) {
        var firstPartArray = (index2 !== 0) ? array.slice(0, index2) : [];
        var secondPartArray = array.slice(index2, array.length);
        firstPartArray.push(array[index1]);
        secondPartArray.splice(secondPartArray.indexOf(array[index1]), 1);
        for(var i = 0; i < firstPartArray.length; i++) {
            array[i] = firstPartArray[i]; 
        }
        for(var i = 0; i < secondPartArray.length; i++) {
            array[i + firstPartArray.length] = secondPartArray[i];
        }
    };
    
    /*
        _insertElementAfter(array, index1, index2)
        Moves the position of the element at index1 after the element at position index2 in the array
    */
    var _insertElementAfter = function(array, index1, index2) {
        var firstPartArray = array.slice(0, index2 + 1);
        var secondPartArray = (index2 + 1 === array.length) ? [] : array.slice(index2 + 1, array.length);
        secondPartArray.unshift(array[index1]);
        firstPartArray.splice(index1, 1);
        for(var i = 0; i < firstPartArray.length; i++) {
            array[i] = firstPartArray[i]; 
        }
        for(var i = 0; i < secondPartArray.length; i++) {
            array[i + firstPartArray.length] = secondPartArray[i];
        }  
    };
    
    /*
        _cardDradEnded(d)
        Switches the position of the card which was dragged with the one under it's new position
        d is the data of the card which was dragged
    */
    var _cardDragEnded = function(d) {
        var id = d.id;
        
        d3.selectAll("."+_config.cardClass)
            .style({
                "-webkit-transform": "translateY(0px)",
                "-moz-transform": "translateY(0px)",
                "-ms-transform": "translateY(0px)",
                "transform": "translateY(0px)"
            });
        
        d3.selectAll("."+_config.cardClass).datum().translateY = 0;
        
        var sidebarCard = d3.selectAll(_config.panelElem+" ."+_config.cardClass)
            .filter(function(d) {return d.id === id;});
        
        sidebarCard
            .classed("dragged", false);
        
        //We reinitialize d.y
        sidebarCard.datum().y = 0;
        
        //We check if a card moved
        if(_lastSidebarCardMoved !== null) {
            //We move the card to the final position in the DOM
            if(_cardMovement === "up")
                sidebarCard.node().parentNode.insertBefore(sidebarCard.node(), _lastSidebarCardMoved.node());
            else if(_lastSidebarCardMoved !== null)
                sidebarCard.node().parentNode.insertBefore(sidebarCard.node(), _lastSidebarCardMoved.node().nextSibling); //Acts like an insertAfter

            //We save the new order
            var cardsOrderType = (app.getMode() === "hospital") ? "hospitals" : "areas";
            if(_cardMovement === "up")
                _insertElementBefore(_cardsOrder[cardsOrderType], _cardsOrder[cardsOrderType].indexOf(id), _cardsOrder[cardsOrderType].indexOf(_lastSidebarCardMoved.datum().id));
            else if(_lastSidebarCardMoved !== null)
                _insertElementAfter(_cardsOrder[cardsOrderType], _cardsOrder[cardsOrderType].indexOf(id), _cardsOrder[cardsOrderType].indexOf(_lastSidebarCardMoved.datum().id));
        }
        
        var panelCard = d3.selectAll(_config.comparePanelElem+" ."+_config.cardClass).filter(function(d) {return d.id === id;});
        if(_compareMode && !panelCard.empty()) { //We also check in the second item has been picked
            panelCard
                .classed("dragged", false);     
            
            //We reinitialize d.y
            panelCard.datum().y = 0;
            
            //We check if a card moved
            if(_lastPanelCardMoved !== null) {
                if(_cardMovement === "up")
                    panelCard.node().parentNode.insertBefore(panelCard.node(), _lastPanelCardMoved.node());
                else if(_lastPanelCardMoved !== null)
                    panelCard.node().parentNode.insertBefore(panelCard.node(), _lastPanelCardMoved.node().nextSibling); //Acts like an insertAfter
            }
        }
    };
    
    /*
        addCard(node, isOpened, target)
        Add a card to the sidebar (target specifies which column), with the content node (DOM element)
        isOpened specifies if the card should be minimized
    */
    var addcard = function(node, isOpened, target) {
        if(!_sidebarDisplayed) {
            d3.select(_config.sidebarElem+" "+_config.toolbarElem).style("display", "block");
            _sidebarDisplayed= true;
        }
        
        var cardsOrderType = (app.getMode() === "hospital") ? "hospitals" : "areas";
        
        //We save the original cards' order
        if(_cardsOrder[cardsOrderType].indexOf(_cardIndex) === -1) { //We assume the whole set of cards change when a new hospital or area is clicked
            if(app.getMode() === "hospital")
                _cardsOrder.hospitals.push(_cardIndex);
            else
                _cardsOrder.areas.push(_cardIndex);
        }
        
        var targetElem = _config.panelElem;
        if(target === "panel") {
            targetElem = _config.comparePanelElem;
            d3.select(targetElem)
                .style("display", "block");
        }
        
        var card;
        if(_cardsMoved) { //We position the new card in the sidebar according to the saved position
            if(_cardIndex === 0) { //The first card is inserted as ussual
                _cardsTmpOrder = [0];
                card = d3.select(targetElem).append("div");
            }
            else { //We determine after which card should be inserted the new one
                var currentId;
                for(var i = 0; i < _cardsTmpOrder.length; i++) {
                    currentId = _cardsTmpOrder[i];
                    if(_cardsOrder[cardsOrderType].indexOf(_cardIndex) < _cardsOrder[cardsOrderType].indexOf(currentId)) {
                        _cardsTmpOrder.push(_cardIndex);
                        _insertElementBefore(_cardsTmpOrder, _cardsTmpOrder.indexOf(_cardIndex), _cardsTmpOrder.indexOf(currentId));
                        card = document.createElement("div");
                        card = d3.select(d3.select(targetElem).node().insertBefore(card, d3.selectAll(targetElem+" ."+_config.cardClass).filter(function(d) {return d.id === currentId}).node()));
                        break;
                    }
                }
                
                //We insert the card at the end, so as usual
                if(card === undefined) {
                    _cardsTmpOrder.push(_cardIndex);
                    card = d3.select(targetElem).append("div");
                }
            }
        }
        else
            card = d3.select(targetElem).append("div");

        card.data([{id: _cardIndex, offset: 0, y: 0}])
            .call(_dragBehavior)
            .classed(_config.cardClass, true)
            .classed("animated fadeInUp", true)
            .style({
                "-webkit-animation-delay": "0s",
                "-moz-animation-delay": "0s",
                "-ms-animation-delay": "0s",
                "animation-delay": "0s"
            });
        
        if(_isCardVisible.hospital[_cardIndex] === undefined)
            _isCardVisible.hospital.push(isOpened);
        else
            isOpened = _isCardVisible.hospital[_cardIndex];
        
        var icon = (isOpened) ? "fa-minus" : "fa-toggle-down";
        
        card.classed("hidden", !isOpened);
        
        card.append("a")
            .classed("control", true)
            .html("<i class=\"fa "+icon+"\"></i>")
            .on("click", function() {
                var id = d3.select(this.parentNode).data()[0].id;
                _isCardVisible.hospital[id] = !_isCardVisible.hospital[id];
                _toggleContent(id);
            });
        
        card.node()
            .appendChild(node.node());
        
        if(_compareMode)
            _alignCards(_cardIndex);
        
        _cardIndex++;
    };
    
    /*
        _alignCards(index)
        If one card from the two columns of the sidebar is shorter than the other one, a margin-bottom is applied to compensate it
        index is the id of both the cards
    */
    var _alignCards = function(index) {    
        var panelCard = d3.selectAll(_config.comparePanelElem+" ."+_config.cardClass).filter(function(d) {return d.id === index;}),    
            sidebarCard = d3.selectAll(_config.panelElem+" ."+_config.cardClass).filter(function(d) {return d.id === index;});
        
        //We reset the margins
        sidebarCard.style("margin-bottom", _config.cardMarginBottom+"px");
        panelCard.style("margin-bottom", _config.cardMarginBottom+"px");
        
        var topOffset = {
                sidebarCard: sidebarCard.node().offsetHeight,
                panelCard: panelCard.node().offsetHeight
            },
            gap = topOffset.sidebarCard - topOffset.panelCard;

        if(gap < 0)
            sidebarCard.style("margin-bottom", (_config.cardMarginBottom - gap)+"px");
        else if(gap > 0)
            panelCard.style("margin-bottom", (_config.cardMarginBottom + gap)+"px");
    };
    
    /*
        _toggleContent(id)
        Toggles the content of the card(s) (both of the ones with the same id if compare mode is active)
    */
    var _toggleContent = function(id) {
        var sidebarCard = d3.selectAll(_config.panelElem+" ."+_config.cardClass).filter(function(d) {return d.id === id});
        var isHidden = sidebarCard.classed("hidden");
        
        sidebarCard.classed("hidden", !isHidden);
        sidebarCard.select("i")
            .classed("fa-toggle-down", !isHidden)
            .classed("fa-minus", isHidden);
        
        if(_compareMode) {
            var panelCard = d3.selectAll(_config.comparePanelElem+" ."+_config.cardClass).filter(function(d) {return d.id === id});

            panelCard.classed("hidden", !isHidden);
            panelCard.select("i")
                .classed("fa-toggle-down", !isHidden)
                .classed("fa-minus", isHidden);
            
            if(id + 1 <= _cardIndex) {
                panelCard.style("margin-bottom", _config.cardMarginBottom+"px");
                sidebarCard.style("margin-bottom", _config.cardMarginBottom+"px");
                _alignCards(id);
            }
        }
    };
    
    /*
        reset(target)
        Deletes the content of the column designated by target
    */
    var reset = function(target) {
        var targetElem = _config.panelElem;
        if(target === "panel")
            targetElem = _config.comparePanelElem;
        
        d3.select(targetElem).selectAll("."+_config.cardClass).remove();
        
        _cardIndex = 0;
    };
    
        
    /*
        compare
        Tells the application the compare mode is or isn't active and reinitializes the sidebar
    */
    var compare = function() {
        if(!_sidebarDisplayed)
            return;
        
        _compareMode = !_compareMode;
        
        d3.select(_config.toolbarElem+" a")
            .classed("selected", _compareMode);
        
        app.compareMode(_compareMode);
        
        var sidebar = d3.select(_config.sidebarElem);
        var offset = 0; //Offset for the scrollbar
        
        //We apply specific styles to avoid the issues with the scrollbars
        if(navigator.appVersion.indexOf("Win") !== -1)
            offset = 17;
        
        if(_compareMode) {
            sidebar.style("right", "0px");
            d3.select(_config.toolbarElem).style("width", (2 * _config.sidebarInitialWidth)+"px");
            app.displayMessage("Pick up another "+app.getMode()+".");
            
            //We apply specific styles to avoid the issues with the scrollbars
            if(navigator.appVersion.indexOf("Win") !== -1) {
                if(window.mozInnerScreenX === undefined) //All browsers except FF
                    d3.select(_config.sidebarElem).style("width", (parseInt(d3.select(_config.sidebarElem).style("width")) + 2 * 17)+"px");
                else //Firefox
                    d3.select(_config.sidebarElem).style("width", (parseInt(d3.select(_config.sidebarElem).style("width")) + 17)+"px");

                d3.select(_config.sidebarElem+" "+_config.toolbarElem).style("width", (2 * _config.sidebarInitialWidth + 17)+"px");
                d3.select(_config.sidebarElem+" "+_config.toolbarElem+" a").style("right", (parseInt(d3.select(_config.sidebarElem+" "+_config.toolbarElem+" a").style("right")) + 17)+"px");
            }
        }
        else {
            app.hideMessage();
            sidebar.style("right", (-_config.sidebarInitialWidth)+"px");
            d3.select(_config.toolbarElem).style("width", (_config.sidebarInitialWidth)+"px");
            
             //We apply specific styles to avoid the issues with the scrollbars
            if(navigator.appVersion.indexOf("Win") !== -1) {
                d3.select(_config.sidebarElem).style("width", null);
                d3.select(_config.sidebarElem+" "+_config.toolbarElem+" a").style("right", null);
            }
            
            reset("panel");
            resetCardsOffset();
            d3.select(_config.comparePanelElem)
                .style("display", "none");
        }
    };
    
    /*
        resetCardOffset
        Deletes the margin-bottom of all the cards from both columns
    */
    var resetCardsOffset = function() {
        d3.selectAll(_config.panelElem+" ."+_config.cardClass)
            .filter(function(d) {return d.id !== 0;})
            .style("margin-bottom", _config.cardMarginBottom+"px");
    };
    
    /*
        getSidebarWidth
        Returns the current width of the sidebar
    */
    var getSidebarWidth = function() {
        return parseInt(d3.select(_config.sidebarElem).style("width"));
    }
    
    /*
        searchPlaceholder(text)
        Replaces the text of the search box placeholder by the argument
    */
    var searchPlaceholder = function(text) {
        d3.select(_config.toolbarElem).select("input")
            .attr("placeholder", text);
    };
    
    /*
        searchValue(text)
        Replaces the value of the search box by the argument
    */
    var searchValue = function(text) {
        d3.select(_config.toolbarElem).select("input")
            .node().value = text;
    };
    
    /*
        searchValueChanged(value)
        Calls the current view's handler for that interaction
        value is the value of the search box
    */
    var searchValueChanged = function(value) {
        app.view().searchValueChanged(value);
        d3.selectAll("."+_config.cardClass).style("display", (value !== "") ? "none" : "block");
    };
    
    /*
        focusOnSearch
        Gives the focus to the search box
    */
    var focusOnSearch = function() {
        d3.select(_config.toolbarElem+" input").node().focus();
    };
    
    /*
        resetAutocomplete
        Removes the content of the autocomplete box
    */
    var resetAutocomplete = function() {
        var autocompleteElem = d3.selectAll(_config.autocompleteElem+" li").remove();
        d3.selectAll("."+_config.cardClass).style("display", "block");
    };
    
    /*
        addAutocomplete(content, id, options)
        Add an element to the autocomplete results
        content is HTML content
        id is a unique id that can be used to tell the view to select this element
        options is an object that can contains the following properties:
            * onclick: contains the function that will be called when the event is fired
            * onmouseover: same
            * onmouseout: same
    */
    var addAutocomplete = function(content, id, options) {
        d3.select(_config.autocompleteElem)
            .append("li")
            .datum({id: id})
            .on("click",     options.onclick     || null)
            .on("mouseover", options.onmouseover || null)
            .on("mouseout",  options.onmouseout  || null)
            .html(content);
    };
    
    return {
        init: init,
        reset: reset,
        addcard: addcard,
        compare: compare,
        resetCardsOffset: resetCardsOffset,
        getSidebarWidth: getSidebarWidth,
        searchPlaceholder: searchPlaceholder,
        searchValue: searchValue,
        searchValueChanged: searchValueChanged,
        focusOnSearch: focusOnSearch,
        resetAutocomplete: resetAutocomplete,
        addAutocomplete: addAutocomplete
    };
})();
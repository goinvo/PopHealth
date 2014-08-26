var sidebar = (function() {
    var _config = {
        sidebarElem: "aside", //Sidebar, container of the two columns of cards
        panelElem: ".panel", //First column
        comparePanelElem: ".compare-panel", //Second column displayed when the compare mode is active
        cardClass: "card",
        toolbarElem: ".toolbar", //The toolbar which contains the search field and compare button
        cardMarginBottom: 15 //The default margin at the bottom of the cards
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
        _cardMovement; //"up" or "down" depending of the movement the user does with the dragged card
    
    /*
        init
        Creates the d3 function responsible of the drag feature
    */
    var init = function() {
        _dragBehavior = d3.behavior.drag()
            .origin(function(d) {return {x: 0, y: d.y};})
            .on("drag", _cardDragged)
            .on("dragend", _cardDragEnded);
        
        //We apply specific styles to avoid the issues with the scrollbars
        if(navigator.appVersion.indexOf("Win") !== -1) {
            if(window.mozInnerScreenX === undefined) //All browsers except FF
                d3.select(_config.sidebarElem).style("width", (parseInt(d3.select(_config.sidebarElem).style("width")) + 2 * 17)+"px");
            else //Firefox
                d3.select(_config.sidebarElem).style("width", (parseInt(d3.select(_config.sidebarElem).style("width")) + 17)+"px");
            
            d3.select(_config.sidebarElem+" "+_config.toolbarElem+" a").style("right", (parseInt(d3.select(_config.sidebarElem+" "+_config.toolbarElem+" a").style("right")) + 17)+"px");
        }
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
        
        sidebarCard
            .classed("fadeInUp", false) //Needed to remove the animate.css effect
            .classed("dragged", true)
            .style("-webkit-transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";})
            .style("-moz-transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";})
            .style("-ms-transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";})
            .style("transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";});
                
        if(_compareMode) {
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
        if(_compareMode)
            var panelCardSibling = (d.y < 0) ? d3.select(panelCard.node().previousSibling) : d3.select(panelCard.node().nextSibling);
        
        while(!sidebarCardSibling.empty()) {
            var cardSiblingPosition = sidebarCardSibling.node().offsetTop;
            var cardSiblingHeight = sidebarCardSibling.node().offsetHeight;
            var cardSiblingMarginBottom = parseInt(sidebarCardSibling.style("margin-bottom"));
            var cardHeight = sidebarCard.node().offsetHeight + parseInt(sidebarCard.style("margin-bottom"));
            
            if(d.y < 0 && cardPosition + d.y < cardSiblingPosition + (cardSiblingHeight + cardSiblingMarginBottom) / 2) {
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

                if(_compareMode) {
                    _lastPanelCardMoved = panelCardSibling;
                    
                    panelCardSibling
                        .classed("fadeInUp", false)
                        .style({
                            "-webkit-transform": "translateY("+cardHeight+"px)",
                            "-moz-transform": "translateY("+cardHeight+"px)",
                            "-ms-transform": "translateY("+cardHeight+"px)",
                            "transform": "translateY("+cardHeight+"px)"
                        });
                }
            }
            else if(d.y > 0 && cardPosition + d.y > cardSiblingPosition + (cardSiblingHeight + cardSiblingMarginBottom) / 2) {
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

                if(_compareMode) {
                    _lastPanelCardMoved = panelCardSibling;
                    
                    panelCardSibling
                        .classed("fadeInUp", false)
                        .style({
                            "-webkit-transform": "translateY(-"+cardHeight+"px)",
                            "-moz-transform": "translateY(-"+cardHeight+"px)",
                            "-ms-transform": "translateY(-"+cardHeight+"px)",
                            "transform": "translateY(-"+cardHeight+"px)"
                        });
                }
            }
            
            sidebarCardSibling = (d.y < 0) ? d3.select(sidebarCardSibling.node().previousSibling) : d3.select(sidebarCardSibling.node().nextSibling);
            if(_compareMode)
                panelCardSibling = (d.y < 0) ? d3.select(panelCardSibling.node().previousSibling) : d3.select(panelCardSibling.node().nextSibling);
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
        
        var sidebarCard = d3.selectAll(_config.panelElem+" ."+_config.cardClass)
            .filter(function(d) {return d.id === id;});
        
        sidebarCard
            .classed("dragged", false);
        
        //We move the card to the final position in the DOM
        if(_cardMovement === "up")
            sidebarCard.node().parentNode.insertBefore(sidebarCard.node(), _lastSidebarCardMoved.node());
        else if(_lastSidebarCardMoved !== null)
            sidebarCard.node().parentNode.insertBefore(_lastSidebarCardMoved.node(), sidebarCard.node());
        
        //We reinitialize d.y
        var sidebarCardData = sidebarCard.datum();
        sidebarCardData.y = 0;
        sidebarCard.datum(sidebarCardData);
        
        if(_compareMode) {
            var panelCard = d3.selectAll(_config.comparePanelElem+" ."+_config.cardClass)
                .filter(function(d) {return d.id === id;});

            panelCard
                .classed("dragged", false);     
            
            if(_cardMovement === "up")
                panelCard.node().parentNode.insertBefore(panelCard.node(), _lastPanelCardMoved.node());
            else if(_lastPanelCardMoved !== null)
                panelCard.node().parentNode.insertBefore(_lastPanelCardMoved.node(), panelCard.node());
            
            //We reinitialize d.y
            var panelCardData = panelCard.datum();
            panelCardData.y = 0;
            panelCard.datum(panelCardData);
        }
    };
    
    /*
        addCard(node, isOpened, target)
        Add a card to the sidebar (target specifies which column), with the content node (DOM element)
        isOpened specifies if the card should be minimized
    */
    var addcard = function(node, isOpened, target) {
        if(!_sidebarDisplayed) {
            d3.select(_config.sidebarElem+" "+_config.toolbarElem)
                .style("display", "block");
        }
        
        var targetElem = _config.panelElem;
        if(target === "panel") {
            targetElem = _config.comparePanelElem;
            d3.select(targetElem)
                .style("display", "block");
        }
            
        
        var card = d3.select(targetElem)
            .append("div")
            .data([{id: _cardIndex, offset: 0, y: 0}])
            .call(_dragBehavior)
            .classed(_config.cardClass, true)
            .classed("animated fadeInUp", true)
            .style({
                "-webkit-animation-delay": "0s",
                "-moz-animation-delay": "0s",
                "-ms-animation-delay": "0s",
                "animation-delay": "0s"
            });
        
        if(_compareMode && _cardIndex - 1 >= 0)
            _alignCards(_cardIndex - 1);
        
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
                sidebarCard: sidebarCard.node().nextSibling.offsetTop,
                panelCard: panelCard.node().nextSibling.offsetTop
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

            console.log("id "+id);
            console.log("_cardIndex "+_cardIndex);
            console.log("***");
            
            if(id + 1 <= _cardIndex) {
                console.log("hey hey");
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
        _compareMode = !_compareMode;
        
        d3.select(_config.toolbarElem+" a")
            .classed("selected", _compareMode);
        
        app.compareMode(_compareMode);
        
        var sidebar = d3.select(_config.sidebarElem);
        var sidebarWidth = parseInt(sidebar.style("width")) + parseInt(sidebar.style("padding-right"));
        var offset = 0; //Offset for the scrollbar
        
        //We apply specific styles to avoid the issues with the scrollbars
        if(navigator.appVersion.indexOf("Win") !== -1) {
            if(window.mozInnerScreenX === undefined) //All browsers except FF
                offset = 17;
            else //Firefox
                offset = -17;
        }
        
        if(_compareMode) {
            app.displayMessage("Pick up another "+app.getMode()+".");
            sidebar.style("width", (sidebarWidth * 2 + offset)+"px");
            
            //We apply specific styles to avoid the issues with the scrollbars
            if(navigator.appVersion.indexOf("Win") !== -1) {
                if(window.mozInnerScreenX === undefined) //For the browser on Windows except FF
                    sidebar.select(_config.panelElem).style("width", sidebarWidth+"px");
                else //Firefox
                    sidebar.select(_config.panelElem).style("width", (sidebarWidth + offset)+"px");
            }
        }
        else {
            app.hideMessage();
            if(navigator.appVersion.indexOf("Win") !== -1 && window.mozInnerScreenX !== undefined) //For Firefox on Windows
                sidebar.style("width", ((sidebarWidth - offset) / 2)+"px");
            else
                sidebar.style("width", (sidebarWidth / 2 + offset)+"px");
            
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
            .style("margin-top", _config.cardMarginTop+"px");
    };
    
    return {
        init: init,
        reset: reset,
        addcard: addcard,
        compare: compare,
        resetCardsOffset: resetCardsOffset
    };
})();
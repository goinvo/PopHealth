var sidebar = (function() {
    var _config = {
        sidebarElem: "aside",
        panelElem: ".panel",
        comparePanelElem: ".compare-panel",
        cardClass: "card",
        toolbarElem: ".toolbar",
        cardMarginBottom: 15
    },
        _isCardVisible = {
        hospital: []
    },
        _sidebarDisplayed = false,
        _cardIndex = 0,
        _compareMode = false,
        _dragBehavior,
        _lastSidebarCardMoved = null,
        _lastPanelCardMoved = null,
        _cardMovement;
    
    
    var init = function() {
        _dragBehavior = d3.behavior.drag()
            .origin(function(d) {return {x: 0, y: d.y};})
            .on("dragstart", _cardDragStarted)
            .on("drag", _cardDragged)
            .on("dragend", _cardDragEnded);
    };
    
    var _cardDragStarted = function() {
    };
    
    var _cardDragged = function(d) {
        var id = d.id;
        
        var panelCard = d3.selectAll(_config.comparePanelElem+" ."+_config.cardClass)
            .filter(function(d) {return d.id === id;});
       
        var sidebarCard = d3.selectAll(_config.panelElem+" ."+_config.cardClass)
            .filter(function(d) {return d.id === id;});
        
        panelCard
            .classed("fadeInUp", false)
            .classed("dragged", true)
            .style("-webkit-transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";})
            .style("-moz-transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";})
            .style("-ms-transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";})
            .style("transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";});      
        
        sidebarCard
            .classed("fadeInUp", false)
            .classed("dragged", true)
            .style("-webkit-transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";})
            .style("-moz-transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";})
            .style("-ms-transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";})
            .style("transform", function(d) {d.y = d3.event.y; return "translateY("+d.y+"px)";});
        
        var cardPosition = sidebarCard.node().offsetTop;
        var sidebarCardSibling = (d.y < 0) ? d3.select(sidebarCard.node().previousSibling) : d3.select(sidebarCard.node().nextSibling);
        if(_compareMode)
            var panelCardSibling = (d.y < 0) ? d3.select(panelCard.node().previousSibling) : d3.select(panelCard.node().nextSibling);
        
        while(!sidebarCardSibling.empty()) {
            var cardSiblingPosition = sidebarCardSibling.node().offsetTop;
            var cardSiblingHeight = sidebarCardSibling.node().offsetHeight;
            var cardSiblingMarginBottom = parseInt(sidebarCardSibling.style("margin-bottom"));
            
            var cardHeight = sidebarCard.node().offsetHeight;
            cardHeight += parseInt(sidebarCard.style("margin-bottom"));
            
            if(d.y < 0 && cardPosition + d.y < cardSiblingPosition + (cardSiblingHeight + cardSiblingMarginBottom) / 2) {
                _lastSidebarCardMoved = sidebarCardSibling;
                _cardMovement = "up";

                sidebarCardSibling
                    .classed("fadeInUp", false)
                    .style("-webkit-transform", "translateY("+cardHeight+"px)")
                    .style("-moz-transform", "translateY("+cardHeight+"px)")
                    .style("-ms-transform", "translateY("+cardHeight+"px)")
                    .style("transform", "translateY("+cardHeight+"px)");

                if(_compareMode) {
                    _lastPanelCardMoved = panelCardSibling;
                    
                    panelCardSibling
                        .classed("fadeInUp", false)
                        .style("-webkit-transform", "translateY("+cardHeight+"px)")
                        .style("-moz-transform", "translateY("+cardHeight+"px)")
                        .style("-ms-transform", "translateY("+cardHeight+"px)")
                        .style("transform", "translateY("+cardHeight+"px)");
                }
            }
            else if(d.y > 0 && cardPosition + d.y > cardSiblingPosition + (cardSiblingHeight + cardSiblingMarginBottom) / 2) {
                _lastSidebarCardMoved = sidebarCardSibling;
                _cardMovement = "down";

                sidebarCardSibling
                    .classed("fadeInUp", false)
                    .style("-webkit-transform", "translateY(-"+cardHeight+"px)")
                    .style("-moz-transform", "translateY(-"+cardHeight+"px)")
                    .style("-ms-transform", "translateY(-"+cardHeight+"px)")
                    .style("transform", "translateY(-"+cardHeight+"px)");

                if(_compareMode) {
                    _lastPanelCardMoved = panelCardSibling;
                    
                    panelCardSibling
                        .classed("fadeInUp", false)
                        .style("-webkit-transform", "translateY(-"+cardHeight+"px)")
                        .style("-moz-transform", "translateY(-"+cardHeight+"px)")
                        .style("-ms-transform", "translateY(-"+cardHeight+"px)")
                        .style("transform", "translateY(-"+cardHeight+"px)");
                }
            }
            
            sidebarCardSibling = (d.y < 0) ? d3.select(sidebarCardSibling.node().previousSibling) : d3.select(sidebarCardSibling.node().nextSibling);
            if(_compareMode)
                panelCardSibling = (d.y < 0) ? d3.select(panelCardSibling.node().previousSibling) : d3.select(panelCardSibling.node().nextSibling);
        }
    };
    
    var _cardDragEnded = function(d) {
        var id = d.id;
        
        d3.selectAll("."+_config.cardClass)
            .style("-webkit-transform", "translateY(0)")
            .style("-moz-transform", "translateY(0)")
            .style("-ms-transform", "translateY(0)")
            .style("transform", "translateY(0)");
        
        var sidebarCard = d3.selectAll(_config.panelElem+" ."+_config.cardClass)
            .filter(function(d) {return d.id === id;});
        
        sidebarCard
            .classed("dragged", false);
        
        //We move the card to the final position in the DOM
        if(_cardMovement === "up")
            sidebarCard.node().parentNode.insertBefore(sidebarCard.node(), _lastSidebarCardMoved.node());
        else
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
            else
                panelCard.node().parentNode.insertBefore(_lastPanelCardMoved.node(), panelCard.node());
        }
    };
    
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
            .style("animation-delay", "0s")
            .style("-webkit-animation-delay", "0s")
            .style("-moz-animation-delay", "0s")
            .style("-ms-animation-delay", "0s");
        
        if(_compareMode && _cardIndex - 1 >= 0)
            _alignCards(_cardIndex - 1);
        
        if(_isCardVisible.hospital[_cardIndex] === undefined)
            _isCardVisible.hospital.push(isOpened);
        else
            isOpened = _isCardVisible.hospital[_cardIndex];
        
        var icon;
        if(isOpened)
            icon = "fa-minus";
        else
            icon = "fa-toggle-down";
        
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
    
    var _alignCards = function(index) {    
        var panelCard = d3.selectAll(_config.comparePanelElem+" ."+_config.cardClass)
            .filter(function(d) {return d.id === index;}),    
       
            sidebarCard = d3.selectAll(_config.panelElem+" ."+_config.cardClass)
                .filter(function(d) {return d.id === index;}),

            topOffset = {
                sidebarCard: sidebarCard.node().nextSibling.offsetTop,
                panelCard: panelCard.node().nextSibling.offsetTop
            },

            gap = topOffset.sidebarCard - topOffset.panelCard;

        if(gap < 0)
            sidebarCard.style("margin-bottom", (_config.cardMarginBottom - gap)+"px");
        else if(gap > 0)
            panelCard.style("margin-bottom", (_config.cardMarginBottom + gap)+"px");
    };
    
    var _toggleContent = function(id) {
        var sidebarCard = d3.selectAll(_config.panelElem+" ."+_config.cardClass)
            .filter(function(d) {return d.id === id});
        
        var isHidden = sidebarCard.classed("hidden");
        
        sidebarCard.classed("hidden", !isHidden);
        sidebarCard.select("i")
            .classed("fa-toggle-down", !isHidden)
            .classed("fa-minus", isHidden);
        
        if(_compareMode) {
            var panelCard = d3.selectAll(_config.comparePanelElem+" ."+_config.cardClass)
                .filter(function(d) {return d.id === id});

            panelCard.classed("hidden", !isHidden);
            panelCard.select("i")
                .classed("fa-toggle-down", !isHidden)
                .classed("fa-minus", isHidden);

            if(id + 1 < _cardIndex) {
                panelCard.style("margin-bottom", _config.cardMarginBottom+"px");
                sidebarCard.style("margin-bottom", _config.cardMarginBottom+"px");
                _alignCards(id);
            }
        }
    };
    
    var reset = function(target) {
        var targetElem = _config.panelElem;
        if(target === "panel")
            targetElem = _config.comparePanelElem;
        
        d3.select(targetElem)
            .selectAll("."+_config.cardClass)
            .remove();
        
        _cardIndex = 0;
    };
    
        
    var compare = function() {
        _compareMode = !_compareMode;
        
        d3.select(_config.toolbarElem+" a")
            .classed("selected", _compareMode);
        
        app.compareMode(_compareMode);
        
        var sidebar = d3.select(_config.sidebarElem);
        var sidebarWidth = parseInt(sidebar.style("width"));
        
        if(_compareMode) {
            app.displayMessage("Pick up another "+app.getMode()+".");
            sidebar.style("width", (sidebarWidth * 2)+"px");
            
        }
        else {
            app.hideMessage();
            sidebar.style("width", (sidebarWidth / 2)+"px");
            
            reset("panel");
            resetCardsOffset();
            resetCardsOffset();
            d3.select(_config.comparePanelElem)
                .style("display", "none");
        }
    };
    
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
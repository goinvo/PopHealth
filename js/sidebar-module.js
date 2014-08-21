var sidebar = (function() {
    var _config = {
        sidebarElem: "aside",
        panelElem: ".panel",
        comparePanelElem: ".compare-panel",
        cardClass: "card",
        toolbarElem: ".toolbar",
        cardMarginTop: 5
    },
        _isCardVisible = {
        hospital: []
    },
        _sidebarDisplayed = false,
        _cardIndex = 0,
        _compareMode = false;
    
    
    var init = function() {
        
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
            .data([{id: _cardIndex, offset: 0}])
            .classed(_config.cardClass, true)
            .classed("animated fadeInUp", true)
            .style("animation-delay", "0s")
            .style("-webkit-animation-delay", "0s")
            .style("-moz-animation-delay", "0s")
            .style("-ms-animation-delay", "0s");
        
        if(_compareMode && _cardIndex !== 0)
            _alignCards(_cardIndex);
        
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
                sidebarCard: sidebarCard.node().offsetTop,
                panelCard: panelCard.node().offsetTop
            },

            gap = topOffset.sidebarCard - topOffset.panelCard;

        if(gap < 0) {
            sidebarCard
                .classed("fadeInUp", false)
                .style("margin-top", (3 * _config.cardMarginTop - gap)+"px");
        }
        else if(gap > 0) {
            panelCard.style("margin-top", (3 * _config.cardMarginTop + gap)+"px");
        }
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
                d3.select(panelCard.node().nextSibling).style("margin-top", _config.cardMarginTop+"px");
                d3.select(sidebarCard.node().nextSibling).style("margin-top", _config.cardMarginTop+"px");
                _alignCards(id + 1);
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
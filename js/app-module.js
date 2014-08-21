var app = (function() {
    var _config = {
        titleElem: "nav #title",
        messageElem: "#message"
    },
        _elementPicked,
        _compareMode = false;
    
    var init = function() {
        
    };
    
    var setTitle = function(title) {
        d3.select(_config.titleElem)
            .html(title);
    };
    
    var displayGeneralCard = function(d, target) {
        sidebar.reset(target);
        
        var node = d3.select(document.createElement("div"));

        node.append("h1")
            .html(d.name+" <a href='#' target='_blank'><i class='fa fa-external-link'></i></a>");
        node.append("div")
            .classed("two-columns", true)
            .html("Staffed bed<br/>Total occupancy<br/>Total revenue<br/><span>0</span><br/><span>0%</span><br/><span>$0</span>");
        node.append("div")
            .classed("footnote", true)
            .html("Data from the <a href=\"http://www.mass.gov/chia/researcher/hcf-data-resources/massachusetts-hospital-profiles/overiew-and-current-reports.html\" target=\"_blank\">Center for Health Information and Analysis <i class='fa fa-external-link'></i></a>");
        
        sidebar.addcard(node, true, target);
    };
    
    var getUrbanArea = function(id) {
            return _urbanAreaData.features[id];  
    };

    var getHospital = function(id) {
            return _hospitalData.hospitals[id];  
    };
    
    var hospitalClicked = function(d) {
        var target = "sidebar";
        if(_compareMode) {
            if(_elementPicked !== "hospital")
                return;
            hideMessage();
            target = "panel";
            
            //We reset the margin-top of the sidebar's cards
            sidebar.resetCardsOffset();
        }
        
        _elementPicked = "hospital";
            
        displayGeneralCard(d, target);
        
        /* Patients' origin */
        var node = d3.select(document.createElement("div"));
        node.append("h1")
            .text("Patients' origin");
        var table = node.append("table")
        
        var currentRow = table.append("tr");
        currentRow.append("th")
            .classed("w40", true)
            .html("Community");
        currentRow.append("th")
            .classed("w30", true)
            .style("text-align", "center")
            .text("Patients");
        currentRow.append("th")
            .style("text-align", "center")
            .text("% of discharges");
        
        d.topCommunities.forEach(function(topCommunity) {
            var percentage = (topCommunity.percentage === null) ? "–" : ((topCommunity.percentage * 100 <= 1) ? "<1" : Math.round(topCommunity.percentage * 100));

            currentRow = table.append("tr")
                .data([{id: topCommunity.id_town}]);
            currentRow.append("td")
                .text(getUrbanArea(topCommunity.id_town).properties.town);
            currentRow.append("td")
                .classed("number", true)
                .text(topCommunity.patients);
            currentRow.append("td")
                .classed("number", true)
                .text((percentage !== "–") ? percentage+"%" : percentage);
        });
        
        //No data for the hospital
        if(node.selectAll("tr").size() == 1) {
            currentRow = table.append("tr");
            currentRow.append("td")
                .text("No data");
            currentRow.append("td");
            currentRow.append("td");
        }
        
        sidebar.addcard(node, true, target);
        
        /* DRGs */
        node = d3.select(document.createElement("div"));
        node.append("h1")
            .text("DRGs");
        var table = node.append("table");
        
        var currentRow = table.append("tr");
        currentRow.append("th")
            .classed("w40", true)
            .html("Name");
        currentRow.append("th")
            .classed("w30", true)
            .style("text-align", "center")
            .text("Patients");
        currentRow.append("th")
            .style("text-align", "center")
            .text("% of community");

        d.topDRGs.forEach(function(topDRG) {
            var percentage = (topDRG.percentage === null) ? "–" : ((topDRG.percentage * 100 <= 1) ? "<1" : Math.round(topDRG.percentage * 100));
            currentRow = table.append("tr");
            currentRow.append("td")
                .text(topDRG.name);
            currentRow.append("td")
                .classed("number", true)
                .text(topDRG.patients);
            currentRow.append("td")
                .classed("number", true)
                .text((percentage !== "–") ? percentage+"%" : percentage);
        });
        
        //No data for the hospital
        if(node.selectAll("tr").size() == 1) {
            currentRow = table.append("tr");
            currentRow.append("td")
                .text("No data");
            currentRow.append("td");
            currentRow.append("td");
        }
        
        sidebar.addcard(node, false, target);
    };
    
    var displayTopCommunities = function(d, marker) {
        
    };
    
    var displayMessage = function(content) {
        _isMessageDisplayed = true;
        
        d3.select(_config.messageElem)
            .style("visibility", "visible")
            .classed("fadeInDown", true)
            .classed("fadeOutUp", false)
            .html(content);
    };
    
    var hideMessage = function() {
        _isMessageDisplayed = false;
        
        d3.select(_config.messageElem)
            .classed("fadeInDown", false)
            .classed("fadeOutUp", true);
    };
    
    var getMode = function() {
        return _elementPicked;  
    };
    
    var compareMode = function(isActivated) {
        _compareMode = isActivated;
    };
    
    return {
        init: init,
        setTitle: setTitle,
        displayGeneralCard: displayGeneralCard,
        getUrbanArea: getUrbanArea,
        getHospital: getHospital,
        hospitalClicked: hospitalClicked,
        displayTopCommunities: displayTopCommunities,
        displayMessage: displayMessage,
        hideMessage: hideMessage,
        getMode: getMode,
        compareMode: compareMode
    };
})();
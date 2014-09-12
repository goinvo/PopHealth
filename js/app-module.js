var app = (function() {
    var _config = {
        messageElem: "#message", //The container of the message below the questions' div (at the top of the window)
        overlayElem: "#overlay",
        fullscreenButton: "nav .fullscreen"
    },
        _questionSelect = {
            domElem: "nav select",
            currentIndex: 0  
        },
        _currentView = {}, //Contains the methods of the current view
        _elementPicked, //Contains "hospital" or "community" depending on what has been clicked on the map
        _idElementPicked = [], //Contains the ids of the chosen elements
        _compareMode = false, //Indicates if the compare mode is active
        _tourMode = true,
        _savedState = { //Contains information about the state before the compare mode was active in order to restore it
            hospital: { //The labels correspond to _elementPicked
                areasToReset: [],
                areasToRestore: [],
                markerToRestore: null
            },
            community: {
                linesToDelete: [],
                areaToRestore: null,
                markersToRestore: []
            }
        };
    
    /*
        init
        Calls the the init functions of the modules which need an initialization
    */
    var init = function() {
        sidebar.init();
        
        if(_tourMode)
            _tourStart();
        
        d3.select(_questionSelect.domElem).on("click", function() {
            _changeView();
        });
        
        d3.select(_config.fullscreenButton).on("click", function() {
            if(screenfull.enabled) {
                screenfull.toggle();
            }
        });
        
        d3.select(document).on(screenfull.raw.fullscreenchange, function() {
            if(screenfull.isFullscreen) {
                    d3.select(_config.fullscreenButton)
                        .attr("style", "background-image: url('icons/exit-fullscreen.svg')")
                        .attr("title", "Exit fullscreen");
                }
                else {
                    d3.select(_config.fullscreenButton)
                        .attr("style", "background-image: url('icons/enter-fullscreen.svg')")
                        .attr("title", "Go fullscreen");
                }
        });
    };
    
    /*
        _changeView
        Changes the view of the application
    */
    var _changeView = function() {
        var select = d3.select(_questionSelect.domElem);
        var index = select.node().selectedIndex;
        
        if(index === 0)
            return;
        
        switch(index) {
            case 1:
                _currentView = views.neighbors();
                break;
        }
        
        _currentView.init();

        if(_tourMode) {
            _tourExit();
            //We remove the option "Choose the view"
            select.node().firstElementChild.remove();
        }
    };
    
    /*
        getView
        Returns the object _currentView
    */
    var getView = function() {
        return _currentView;  
    };
    
    /*
        _tourStart
        Starts the application tour
    */
    var _tourStart = function() {
        var overlay = d3.select(_config.overlayElem).style("display", "block");
    };
    
    /*
        _tourExit
        Exit the application tour
    */
    var _tourExit = function() {
        d3.select(_config.overlayElem).classed("animated fadeOut", true);
        setTimeout(function() {
            d3.select(_config.overlayElem).style("display", "none");
        }, 550);
    };
    
    /*
        _toDollar(number)
        Converts a number to the US currency format ie 130868 to $130,868
        Doesn't take the decimals into account
    */
    var _toDollar = function(number) {
        var res = "";
        var stringifyNb = String(number);
        var mod = stringifyNb.length % 3;
        
        for(var i = 0; i < stringifyNb.length; i++) {
            if(stringifyNb.length > 3 && i + 1 === mod)
                res = stringifyNb.slice(0, (i + 1 <= stringifyNb.length) ? i + 1 : undefined)+",";
            else if(stringifyNb.length > 3 && i !== stringifyNb.length - 1 && (i + 1 - mod) % 3 === 0)
                res = res+stringifyNb[i]+",";
            else
                res = res+stringifyNb[i];
        }
        
        return "$"+res;
    };

    /*
        displayGeneralCard(d, target)
        Displays the top card which contains general information about the element clicked
        d contains the data to display and target the column in which the card will be
    */
    var displayGeneralCard = function(d, target) {
        var node = d3.select(document.createElement("div"));
        node.data([{id: 0}]);
        
        if(_elementPicked === "hospital") {
            var beds = (d.staffedBeds !== null) ? d.staffedBeds : "–";
            var occupancy = (Math.round(d.occupancy * 100) > 1) ? Math.round(d.occupancy * 100)+"%" : "<1%";
            var revenue = d.revenues.fy12;
            
            node.append("h1").html(d.name+" <a href='#' target='_blank'><i class='fa fa-external-link'></i></a>");
            node.append("div")
                .classed("two-columns", true)
                .html("Staffed bed<sup>1</sup><br/>Total occupancy<sup>1</sup><br/>Total revenue<sup>1</sup><br/><span>"+beds+"</span><br/><span>"+occupancy+"</span><br/><span>"+_toDollar(revenue)+"</span>");
            
            node.append("div").classed("chart-"+target, true).style("height", "150px");
            
            node.append("div")
                .classed("footnote", true)
                .html("<sup>1</sup> For the 2012 fiscal year<br/>Data from the <a href=\"http://www.mass.gov/chia/researcher/hcf-data-resources/massachusetts-hospital-profiles/overiew-and-current-reports.html\" target=\"_blank\">Center for Health Information and Analysis <i class='fa fa-external-link'></i></a>");
            
            sidebar.reset(target);
            sidebar.addcard(node, true, target);
            
            //We add the chart
            var chart = c3.generate({
                bindto: ".chart-"+target,
                data: {
                    x: "x",
                    columns: [
                        ["data", d.revenues.fy08, d.revenues.fy09, d.revenues.fy10, d.revenues.fy11, d.revenues.fy12],
                        ["x", 2008, 2009, 2010, 2011, 2012]
                    ]
                },
                axis: {
                    y: {
                        tick: {
                            culling: {
                                max: 4  
                            },
                            format: function(d) {return _toDollar(Math.round(d / 1000000))+"m";}
                        },
                        ticks: 4
                    }
                },
                legend: {
                    show: false
                },
                interaction: {
                    enabled: false
                },
                size: {
                    width: 310,
                    height: 150
                },
                padding: {
                    top: 10,
                    left: (revenue > 999999999) ? 49 : ((revenue > 99999999) ? 41 : 35)
                }
            });
        }
        else {
            var zipCodes = (getAreaZipCode(d.id).length <= 4) ? getAreaZipCode(d.id).join(", ") : getAreaZipCode(d.id).slice(0, 5).join(", ")+"...";
            node.append("h1").html(d.town+" <span>"+zipCodes+"</span>");
            node.append("div")
                .classed("two-columns", true)
                .html("Some stuffs here<br/><span>...</span>");
            
            node.append("div")
                .classed("footnote", true)
                .html("Data from the <a href=\"http://www.mass.gov/chia/researcher/hcf-data-resources/massachusetts-hospital-profiles/overiew-and-current-reports.html\" target=\"_blank\">Center for Health Information and Analysis <i class='fa fa-external-link'></i></a>");
            
            sidebar.reset(target);
            sidebar.addcard(node, true, target);
        }
    };
    
    /*
        getUrbanArea(id)
        Returns the record which id is id from the _urbanAreaData object
    */
    var getUrbanArea = function(id) {
        return _urbanAreasData.features[id];  
    };

    /*
        getHospital(id)
        Returns the record which id is id from the _hospitalData object
    */
    var getHospital = function(id) {
        return _hospitalsData.hospitals[id];  
    };
    
    /*
        getAreasToRestoreIndex(id)
        Returns the position of the object whose id is id from the array _savedState.["hospital"].areasToRestore if exists, otherwise returns -1
    */
    var getAreasToRestoreIndex = function(id) {
        for(var i = 0; i < _savedState["hospital"].areasToRestore.length; i++) {
            if(_savedState["hospital"].areasToRestore[i].id === id) {
                return i;
            }
        }
        return -1;
    };
    
    /*
        hospitalClicked(d, marker)
        Displays all the cards related to the selected hospital, and display a heat map based on patients' origin
        d is the data of the selected hospital, and marker the one which was clicked
    */
    var hospitalClicked = function(d, marker) {
        var target = "sidebar";
        if(_compareMode) {
            if(_elementPicked !== "hospital" || _idElementPicked.indexOf(d.id) != -1)
                return;
            hideMessage();
            target = "panel";
            
            //We reset the margin-top of the sidebar's cards
            sidebar.resetCardsOffset();
            
            //We remove the last element selected from the array of the selected elements
            if(_idElementPicked.length !== 1)
                _idElementPicked.pop();
        }
        else
            _idElementPicked = []; //We reset the elements chosen
        
        _elementPicked = "hospital";
        _idElementPicked.push(d.id);
        
        if(!_compareMode) {
            urbanAreas.reset();
            _savedState.hospital.areasToRestore = [];
            _savedState.hospital.markerToRestore = d.id;
        }
        else {
            //We reset some areas
            urbanAreas.reset(_savedState.hospital.areasToReset);
            
            //We restore some others
            for(var i = 0; i < _savedState.hospital.areasToRestore.length; i++) {
                urbanAreas
                    .setAreaStyle(_savedState.hospital.areasToRestore[i].id, {
                        fillColor: _savedState.hospital.areasToRestore[i].fillColor,
                        fillOpacity: .8
                    });
            }
        }
        
        _savedState.hospital.areasToReset = [];
        
        //We highlight the marker
        markers.reset();
        markers.highlightMarker(_savedState.hospital.markerToRestore);
        markers.highlightMarker(d.id);
        
        //We delete the lines
        urbanAreas.deleteLines();
        
        //We change the opacity of the markers
        d3.selectAll("."+_config.markerClass)
            .style("opacity", function(d) {
                if(this === marker)
                    return 1;
                return _config.hiddenMarkerOpacity;
            });
        
        _displayGeneralCard(d, target);
        
        /* Patients' origin */
        var node = d3.select(document.createElement("div"));
        node.append("h1")
            .text("Patients' origin");
        var table = node.append("table")
        
        var currentRow = table.append("tr");
        currentRow.append("th")
            .classed("w40", true)
            .html("Community<sup>1</sup>");
        currentRow.append("th")
            .classed("w30", true)
            .style("text-align", "center")
            .text("Patients");
        currentRow.append("th")
            .style("text-align", "center")
            .html("% of discharges<sup>2</sup>");
        
        var totalPatients = 0;
        d.topCommunities.forEach(function(topCommunity) {
            totalPatients += topCommunity.patients;
        });
        
        d.topCommunities.forEach(function(topCommunity) {
            var defaultStyle = urbanAreas.getDefaultStyle();
            var percentage = (topCommunity.percentage === null) ? "–" : ((topCommunity.percentage * 100 <= 1) ? "<1" : Math.round(topCommunity.percentage * 100));

            currentRow = table.append("tr")
                .data([{id: topCommunity.id_town}])
                .on("mouseover", function() {
                    var color = _heatmapColor(topCommunity.patients / totalPatients);
                    d3.select(urbanAreas.getAreaById(topCommunity.id_town)._path).classed("hovered", true);
                    d3.select(this).classed("hovered", true);
                })
                .on("mouseout", function() {
                    urbanAreas.setFillOpacity(1);
                    d3.select(urbanAreas.getAreaById(topCommunity.id_town)._path).classed("hovered", false);
                    d3.select(this).classed("hovered", false);
                });
            currentRow.append("td")
                .text(getUrbanArea(topCommunity.id_town).properties.town);
            currentRow.append("td")
                .classed("number", true)
                .text(topCommunity.patients);
            currentRow.append("td")
                .classed("number", true)
                .text((percentage !== "–") ? percentage+"%" : percentage);
            
            if(_compareMode && _savedState.hospital.areasToRestore.indexOf(topCommunity.id_town) === -1)
                _savedState.hospital.areasToReset.push(topCommunity.id_town);
            
            if(!_compareMode)
                _savedState.hospital.areasToRestore.push({id: topCommunity.id_town, fillColor: _heatmapColor(topCommunity.patients / totalPatients)});
            
            //We're displaying the heat map
            var indexAreasToRestore = _indexAreasToRestore(topCommunity.id_town, "hospital");
            if(!_compareMode || indexAreasToRestore === -1 || _config.heatmapColorSchmeme.indexOf(_savedState.hospital.areasToRestore[indexAreasToRestore].fillColor) > _config.heatmapColorSchmeme.indexOf(_heatmapColor(topCommunity.patients / totalPatients))) {
                urbanAreas
                    .setAreaStyle(topCommunity.id_town, {
                        fillColor: _heatmapColor(topCommunity.patients / totalPatients),
                        fillOpacity: .8
                    });
            }
        });
        
        //No data for the hospital
        if(node.selectAll("tr").size() == 1) {
            currentRow = table.append("tr");
            currentRow.append("td")
                .text("No data");
            currentRow.append("td");
            currentRow.append("td");
        }
        
        node.append("div")
            .classed("footnote", true)
            .html("<sup>1</sup> Only the top 10<sup>-</sup> communities are represented<br><sup>2</sup> Percentage of the community discharges");
        
        sidebar.addcard(node, true, target);
        
        /* DRGs */
        node = d3.select(document.createElement("div"));
        node.append("h1")
            .text("DRGs");
        var table = node.append("table");
        
        var currentRow = table.append("tr");
        currentRow.append("th")
            .classed("w40", true)
            .html("Name<sup>1</sup>");
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
        
        node.append("div")
            .classed("footnote", true)
            .html("<sup>1</sup> Only the top 10<sup>-</sup> DRGs are represented");
        
        sidebar.addcard(node, true, target);
    };
    
    /*
        displayMessage
        Displays the html content content below the questions selector, at the top of the window
    */
    var displayMessage = function(content) {
        _isMessageDisplayed = true;
        
        d3.select(_config.messageElem)
            .style("visibility", "visible")
            .classed("fadeInDown", true)
            .classed("fadeOutUp", false)
            .html(content);
        
        //We center the message in the available width
        var sidebarWidth = sidebar.getSidebarWidth();
//        d3.select(_config.messageElem).style({"width": "calc(100% - "+sidebarWidth+"px)", "padding-right": sidebarWidth+"px"});
        
        if(_compareMode)
            d3.select(_config.messageElem).style({"width": "calc(100% - 700px)", "padding-right": "700px"});
        else
            d3.select(_config.messageElem).style({"width": "calc(100% - 350px)", "padding-right": "350px"});
    };
    
    /*
        hideMessage
        Hides the message which is at the top of the window
    */
    var hideMessage = function() {
        _isMessageDisplayed = false;
        
        d3.select(_config.messageElem)
            .classed("fadeInDown", false)
            .classed("fadeOutUp", true);
    };
    
    /*
        getMode
        Returns "hospital" or "community" depending on the item which has been clicked on the map
    */
    var getMode = function() {
        return _elementPicked;  
    };
    
    /*
        compareMode(isActivated)
        Sets _compareMode to true if isActivated is true, false if isActivated is false
        Useful to tell the module if the user is currently using the compare mode
    */
    var compareMode = function(isActivated) {
        _compareMode = isActivated;
        
        if(isActivated === false) {
            if(_elementPicked === "hospital") {
                //We reset some areas
                urbanAreas.reset(_savedState.hospital.areasToReset);

                //We restore some others
                for(var i = 0; i < _savedState.hospital.areasToRestore.length; i++) {
                    urbanAreas
                        .setAreaStyle(_savedState.hospital.areasToRestore[i].id, {
                            fillColor: _savedState.hospital.areasToRestore[i].fillColor,
                            fillOpacity: .8
                        });
                }
                
                _savedState.hospital.areasToReset = [];
        
                //We highlight the marker
                markers.reset();
                markers.highlightMarker(_savedState.hospital.markerToRestore);
            }
            else {
                urbanAreas.reset();
                markers.reset();

                //We hide all the markers
                markers.hideMarkers();
                
                //We delete the lines
                for(var i = 0; i < _savedState.community.linesToDelete.length; i++) {
                    _savedState.community.linesToDelete[i].remove();
                }

                //We restore the first clicked area
                if(urbanAreas.getAreaById(_savedState.community.areaToRestore)._path !== undefined)
                    d3.select(urbanAreas.getAreaById(_savedState.community.areaToRestore)._path).classed("hovered", true);
                else {
                    var layers = urbanAreas.getAreaById(_savedState.community.areaToRestore)._layers;
                    for(var key in layers) {
                        d3.select(layers[key]._path).classed("hovered", true);
                    }
                }

                //We restore the markers
                for(var i = 0; i < _savedState.community.markersToRestore.length; i++) {
                    markers.addSelectedMarker(_savedState.community.markersToRestore[i]);
                    markers.restoreSelectedMarkers();
                    markers.highlightMarker(_savedState.community.markersToRestore[i]);
                }
            }
        }
    };
    
    /*
        isCompareModeActive
        Returns true is the compare mode is active
    */
    var isCompareModeActive = function() {
        return _compareMode;  
    };
    
    /*
        getSelection
        Returns the map's selected elements type and ids
        type is "hospital" or community, and ids an array
    */
    var getSelection = function() {
        return {
            ids: _idElementPicked,
            type: _elementPicked
        };  
    };
    
    /*
        resetSelectedIds
        Empties the array _idElementPicked
    */
    var resetSelectedIds = function() {
        _idElementPicked = [];  
    };
    
    /*
        popSelectedIds
        Applies the method pop on the array _idElementPicked
    */
    var popSelectedIds = function() {
        _idElementPicked.pop();  
    };
    
    /*
        pushSelectedIds(id)
        Applies the push method on the array _idElementPicked with the argument id
    */
    var pushSelectedIds = function(id) {
        _idElementPicked.push(id);  
    };
    
    /*
        setSelectedType(type)
        Sets the value of _elementPicked to type
        type must be "hospital" or "community"
    */
    var setSelectedType = function(type) {
        if(type === "hospital" || type === "community")
            _elementPicked = type;
        else
            console.log("app module: argument should be \"hospital\" or \"community\"");
    };
    
    /*
        saveState(selection, values)
        Saves the state of the application in order to exit the compare mode without loosing the
        map features displayed previously its activation
        If selection is "hospital", values is an object with the following properties:
            * areasToReset: array of objects containing the properties:
                * id: the area's id
                *  fillColor: the original color of the area
            * areasToRestore: the same
            * markerToRestore: hospital's id
        Otherwise, if it's "community", the possible properties are:
            * areasToRestore: array of the areas' ids
            * linesToDelete: d3 line element
            * markersToRestore: array of the hopital's id
    */
    var saveState = function(selection, values) {
        if(selection === "hospital") {
            _savedState.hospital.areasToReset    = values.areasToReset    || _savedState.hospital.areasToReset;
            _savedState.hospital.areasToRestore  = values.areasToRestore  || _savedState.hospital.areasToRestore;
            _savedState.hospital.markerToRestore = values.markerToRestore || _savedState.hospital.markerToRestore;
        }
        else if(selection === "community") {
            _savedState.community.areaToRestore    = values.areaToRestore   || _savedState.community.areaToRestore;
            _savedState.community.linesToDelete    = values.linesToDelete    || _savedState.community.linesToDelete;
            _savedState.community.markersToRestore = values.markersToRestore || _savedState.community.markersToRestore;
        }
        else //error
            console.log("app module: first argument should be \"hospital\" or \"community\"");
    };
    
    /*
        getSavedState
        Returns the object _savedState
    */
    var getSavedState = function() {
        return _savedState;
    };
    
    return {
        init: init,
        getUrbanArea: getUrbanArea,
        getHospital: getHospital,
        hospitalClicked: hospitalClicked,
        displayMessage: displayMessage,
        hideMessage: hideMessage,
        getMode: getMode,
        compareMode: compareMode,
        isCompareModeActive: isCompareModeActive,
        view: getView,
        getSelection: getSelection,
        resetSelectedIds: resetSelectedIds,
        popSelectedIds: popSelectedIds,
        pushSelectedIds: pushSelectedIds,
        setSelectedType: setSelectedType,
        saveState: saveState,
        getSavedState: getSavedState,
        displayGeneralCard: displayGeneralCard,
        getAreasToRestoreIndex: getAreasToRestoreIndex
    };
})();
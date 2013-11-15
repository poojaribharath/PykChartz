/*jshint -W083 */
PykCharts.GoogleHeat = function(options){
    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------
       this.execute = function(){
    //1.1 Validate the options passed   
    if(!this.validate_options()) return false;
    
    //1.2 Fetch container div set height width   
    this.container = $(this.options.selection);
    this.div = $("<div>")
        .css("height", this.options.height + "px")
        .css("width", this.options.width + "px");

    this.container.append(this.div);

    //1.3 Assign Global variable var that to access function and variable throughout   
    var that = this;

    // 1.4 Read Json File Get all the data and pass to render
    $.getJSON(this.options.data, function(data){
        that.data = data;
        that.render();
    });
    };

    //----------------------------------------------------------------------------------------
    //2. Validate Options
    //----------------------------------------------------------------------------------------
    this.validate_options = function(){
    if(this.options.selection === undefined) return false;
    if(this.options.data === undefined) return false;
    return true;
    };

    //----------------------------------------------------------------------------------------  
    //3. Assigning Attributes
    //----------------------------------------------------------------------------------------
    this.options = jQuery.extend({
    width: 960,
    height: 500,
    center: new google.maps.LatLng(-25.363882,131.044922),
    defaultZoom: 3,
    tooltipZoom: 4

    }, options);
    
    //----------------------------------------------------------------------------------------
    //4. Render function to create the chart
    //----------------------------------------------------------------------------------------
   this.render = function(){
    var that = this;
    var div = this.div.get(0);

    var mapOptions = {
            center: this.options.center,
            zoom: this.options.defaultZoom,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        this.map = new google.maps.Map(div, mapOptions);
    this.map.setOptions({styles: this.setupStyle()});

    this.setupHeat();
    this.setupMarkers();
    };
    
    //----------------------------------------------------------------------------------------
    //5. Set up the styles to be displayed
    //----------------------------------------------------------------------------------------
    this.setupStyle = function(){
    return [
        {
        stylers: [
            { hue: '#FFBB78' },
            { visibility: 'simplified' },
            { gamma: 0.5 },
            { weight: 0.5 }
        ]
        },
        {
        elementType: 'labels',
        stylers: [
            { visibility: 'on' }
        ]
        },
        {
        featureType: 'water',
        stylers: [
            { color: '#1F77B4' }
        ]
        }
    ];
    };

     //----------------------------------------------------------------------------------------
    //6. Set up Heat Map
    //----------------------------------------------------------------------------------------
   this.setupHeat = function(){
    var pointArray = new google.maps.MVCArray(this.heatData());
    var heatmap = new google.maps.visualization.HeatmapLayer({
        data: pointArray
    });
    heatmap.setMap(this.map);
    };

    this.setupMarkers = function(){
    var that = this;
    var mgr = new MarkerManager(that.map);

    var markers = [];
    for(var i in this.data){
        var p = this.data[i];
        var marker = new google.maps.Marker({
        position: new google.maps.LatLng(p.latitude, p.longitude),
        title: p.tooltip,
        icon: p.marker
        });
        markers.push(marker);

        var infowindow = new google.maps.InfoWindow({content: p.tooltip});

        google.maps.event.addListener(marker, 'click', function(i) {
            return function(){
                i.open(that.map, this);
            };
        }(infowindow));
    }
    google.maps.event.addListener(mgr, 'loaded', function(){
        mgr.addMarkers(markers, that.options.tooltipZoom);
        mgr.refresh();
    });
    };

    //----------------------------------------------------------------------------------------
    //7. Manuplating Data to the json format
    //----------------------------------------------------------------------------------------
    this.heatData = function(){
    var d = [];
    for(var i in this.data){
        var p = this.data[i];
        var o = new google.maps.LatLng(p.latitude, p.longitude);
        d.push({location: o, weight: p.count});
    }
    return d;
    };

    
    return this;
};

Pyk.GoogleHeat = function(options){
    this.init = function(){
	if(!this.validate_options()) return false;
	this.container = $(this.options.selection);
	this.div = $("<div>")
	    .css("height", this.options.height + "px")
	    .css("width", this.options.width + "px");

	this.container.append(this.div);

	var that = this;

	$.getJSON(this.options.data, function(data){
	    that.data = data;
	    that.render();
	});
    }

    this.render = function(){
	var div = this.div.get(0);

	var mapOptions = {
            center: new google.maps.LatLng(45,90),
            zoom: 1,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        this.map = new google.maps.Map(div, mapOptions);

	this.setupHeat();
    }

    this.setupHeat = function(){
	var pointArray = new google.maps.MVCArray(this.heatData());
	var heatmap = new google.maps.visualization.HeatmapLayer({
	    data: pointArray
	});
	heatmap.setMap(this.map);

    }

    this.heatData = function(){
	var d = []

	for(i in this.data){
	    var p = this.data[i];
	    var o = new google.maps.LatLng(p.latitude, p.longitude);
	    d.push({location: o, weight: p.count});
	}
	console.log(d);
	return d;
    }

    // Defatuls and Validations for the Options
    this.validate_options = function(){
	if(this.options.selection == undefined) return false;
	if(this.options.data == undefined) return false;
	return true;
    }

    this.options = jQuery.extend({
	width: 960,
	height: 500
    }, options);

    return this;
};

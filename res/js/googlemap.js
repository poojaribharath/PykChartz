Pyk.GoogleHeat = function(options){
    this.init = function(){
	if(!this.validate_options()) return false;
	this.container = $(this.options.selection);
	this.div = $("<div>")
	    .css("height", this.options.height + "px")
	    .css("width", this.options.width + "px");

	this.container.append(this.div);
	this.render();
    }

    this.render = function(){
	var div = this.div.get(0);

	var mapOptions = {
            center: new google.maps.LatLng(-34.397, 150.644),
            zoom: 8,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(div, mapOptions);
    }

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

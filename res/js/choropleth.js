Choropleth = function(options){

    this.draw = function(){
	if(!this.validate_options()) return false;

	var that = this;
	var opt = this.options;

	// Get all the data and pass to render
	d3.json(opt.topojson, function(e, topology){
	    d3.json(opt.state_data, function(e, state_data){
		d3.json(opt.county_data, function(e, county_data){
		    that.render(topology, state_data, county_data);
		});
	    });
	});
    }

    this.render = function(t, s, c){
	this.svg = d3.select(this.options.selection).append("svg")
	    .attr("width", this.optionswidth)
	    .attr("height", this.options.height);

	this.legends_group = this.svg.append("g")
	    .attr("class", "legend-holder")
	    .attr("height", 30);

	this.map_group = this.svg.append("g")
	    .attr("class", "map-holder")
	    .attr("transform", "translate(0,30)");

	// can pass any object to render the legends
	// TODO Check if 0 will always be an ID
	this.renderLegends(s["0"]);
	this.renderMaps(t, s, c);
    }

    this.renderLegends = function(s){
	console.log(Object.keys(s));
    }

    this.renderMaps = function(t, s, c){
	var path = d3.geo.path();

	var scale = this.options.scale;
	var height = this.options.height;
	var width = this.options.width;

	var param = "deaths"

	var map_group = this.map_group;
	var counties_g = map_group.append("g").attr("class","counties");
	var states_g = map_group.append("g").attr("class","states");

	counties_g.selectAll("path")
	    .data(topojson.feature(t, t.objects.counties).features)
	    .enter().append("path").attr("class", "county")
	    .attr("d", path)
	    .attr("style", function(d, i){
		console.log(d.id);
		if(!c[d.id]) return;

		var color = c[d.id][param].color;
		var opacity = 1;
		if(c[d.id][param].data){
		    opacity = c[d.id][param].data / 100;
		}

		return "fill: "+color+"; opacity: "+opacity;
	    })
	    .on("click", function(d){
		var x,y,k;
		x = width/2;
		y = height/2;
		k = 1;

		states_g.transition()
		    .duration(750)
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

		counties_g.transition()
		    .duration(750)
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

		$("g.counties").fadeOut();
		$("g.states path").css("fill", function(){
		    return $(this).attr("data-color");
		});
		$("g.states path").css("stroke-width", "0");
		$("g.states path").css("opacity", function(){
		    return $(this).attr("data-heat");
		});
	    });

	states_g.selectAll("path")
	    .data(topojson.feature(t, t.objects.states).features)
	    .enter().append("path").attr("class", "state")
	    .attr("d", path)
	    .attr("data-heat", function(d,i){
		if(!s[d.id]) return 1;
		if(!s[d.id][param].data) return 1;
		return s[d.id][param].data / 100;
	    })
	    .attr("data-color", function(d,i){
		if(!s[d.id]) return "black";
		return s[d.id][param].color;
	    })
	    .attr("style", function(d, i){
		if(!s[d.id]) return;

		var color = s[d.id][param].color;
		var opacity = 1;
		if(s[d.id][param].data){
		    opacity = s[d.id][param].data / 100;
		}

		return "fill: "+color+"; opacity: "+opacity;
	    })
	    .on("click", function(d){
		var centroid = path.centroid(d);
		var x = centroid[0];
		var y = centroid[1];
		k = scale;

		counties_g.transition()
		    .duration(750)
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

		states_g.transition()
		    .duration(750)
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

		$("g.states path").css("fill", "none");
		$("g.states path").animate({opacity: 1});
		$("g.states path").css("stroke-width", "3px");
		$("g.states path").css("stroke", "#fff");
		$("g.counties").fadeIn();
	    });

	$("g.counties").hide();
    }

    this.validate_options = function(){
	if(this.options.selection === undefined) return false;
	if(this.options.topojson === undefined) return false;
	if(this.options.county_data === undefined) return false;
	if(this.options.state_data === undefined) return false;
	return true;
    }

    // Setting the Defaults
    this.options = jQuery.extend({
	width: 960,
	height: 500,
	scale: 4
	//topojson//state_data//county_data//selection
    }, options);

    return this;
}


k = new Choropleth({
    selection: "#choropleth-container",
    topojson: "/res/data/us.json",
    county_data: "/res/data/counties_data.json",
    state_data: "/res/data/states_data.json",
});
k.draw();

/*
var width = 960;
var height = 500;

var state_data = []
for(var i = 0; i < 50; i++) state_data.push(Math.random());

var county_data = []
for(var i = 0; i < 10000; i++) county_data.push(Math.random());


$(document).ready(function(){
    var path = d3.geo.path();

    var svg = d3.select("#choropleth-container").append("svg")
	.attr("width", width)
	.attr("height", height);

    var counties_g = svg.append("g").attr("class","counties");
    var states_g = svg.append("g").attr("class","states");

    d3.json("/res/data/us.json", function(error, topology) {

	counties_g.selectAll("path")
	    .data(topojson.feature(topology, topology.objects.counties).features)
	    .enter().append("path").attr("class", "county")
	    .attr("d", path)
	    .attr("style", function(d, i){
		return "opacity: " + county_data[i];
	    })
	    .on("click", unzoom);

	states_g.selectAll("path")
	    .data(topojson.feature(topology, topology.objects.states).features)
	    .enter().append("path").attr("class", "state")
	    .attr("d", path)
	    .attr("style", function(d, i){
		return "opacity: " + state_data[i];
	    })
	    .attr("data-heat", function(d, i){
		return state_data[i];
	    })
	    .on("click", zoom);

	$("g.counties").hide();

	function zoom(d){
	    var x, y, k;

	    var centroid = path.centroid(d);
	    x = centroid[0];
	    y = centroid[1];
	    k = 4;

	    $("g.states path").css("fill", "none");
	    $("g.states path").animate({opacity: 1});
	    $("g.states path").css("stroke-width", "3px");
	    $("g.states path").css("stroke", "#fff");
	    $("g.counties").fadeIn();


	    counties_g.transition()
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");


	    states_g.transition()
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");
	}

	function unzoom(d){
	    var x,y,k;
	    x = width/2;
	    y = height/2;
	    k = 1;
	    $("g.counties").fadeOut();
	    $("g.states path").css("fill", "#000");
	    $("g.states path").css("stroke-width", "0");
	    $("g.states path").css("opacity", function(){
		return $(this).attr("data-heat");
	    });

	    states_g.transition()
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

	    counties_g.transition()
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");
	}

    });
});
*/

PykCharts.Choropleth = function(options){

    this.init = function(){
	if(!this.validate_options()) return false;

	var that = this;
	var opt = this.options;

	$(this.options.selection).html("<img src='/pykcharts/images/spinner.gif'> Loading... Please wait");

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
	$(this.options.selection).html("");

	var h = this.options.height;
	var w = this.options.width;

	// Create SVG holders for map and legends
	this.legends_group = d3.select(this.options.selection).append("svg")
	    .attr("class", "pyk-choropleth-legend-holder")
	    .attr("height", 30)
	    .attr("width", w);

	this.map_group = d3.select(this.options.selection).append("svg")
	    .attr("class", "pyk-choropleth-map-holder")
	    .attr("height", h - 30)
	    .attr("width", w);

	// Set first parameter
	var params = Object.keys(s["0"]);
	this.param = params[0];

	// Draw the elements after creating the holder
	this.renderTooltip();
	this.draw(t, s, c);
    }

    this.renderTooltip = function(){
	$("#choropleth-tooltip").remove();
	this.tooltip = d3.select("body")
	    .append("div").attr("id","choropleth-tooltip")
	    .style("position", "absolute")
	    .style("z-index", "10")
	    .style("visibility", "hidden")
	    .style("background", "#fff")
	    .style("padding", "10px 20px")
	    .style("box-shadow", "0 0 10px #000")
	    .style("border-radius", "5px")
	    .text("a simple tooltip");
    }

    this.draw = function(t, s, c){
	// can pass any object to render the legends
	// TODO Check if 0 will always be an ID
	this.renderLegends(t,s,c);
	this.renderMaps(t, s, c);
    }

    this.renderLegends = function(t, s, c){
	var that = this;
	var legends = Object.keys(s["0"]);
	var lWidth = this.options.width / legends.length;

	var lText = this.legends_group.selectAll("text").data(legends);
	lText.enter().append("text");
	lText
	    .attr("y", 15)
	    .attr("x", function(d, i){
		return (i*lWidth) + 25;
	    })
	    .text(function(d, i){
		// capitalized string
		return d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
	    })
	    .on("click", function(d){
		that.param = d;
		that.draw(t,s,c);
	    });

	var lCircle = this.legends_group.selectAll("circle").data(legends);
	lCircle.enter().append("circle");
	lCircle
	    .attr("cy", 10)
	    .attr("cx", function(d, i){
		return (i*lWidth) + 15;
	    })
	    .attr("r",7)
	    .attr("style", function(d, i){
		var color = (d === that.param) ? "#000" : "#fff";
		return "stroke-width: 3px; stroke: #000; fill: " + color;
	    })
	    .on("click", function(d){
		that.param = d;
		that.draw(t,s,c);
	    });
    }

    this.renderMaps = function(t, s, c){
	var that = this;
	var path = d3.geo.path();

	var scale = this.options.scale;
	var height = this.options.height;
	var width = this.options.width;

	var param = this.param;

	var map_group = this.map_group;
	this.map_group.selectAll("g").remove();

	var counties_g = map_group.append("g").attr("class","counties");
	var states_g = map_group.append("g").attr("class","states");

	counties_g.selectAll("path")
	    .data(topojson.feature(t, t.objects.counties).features)
	    .enter().append("path").attr("class", "county")
	    .attr("d", path)
	    .attr("style", function(d, i){
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

		states_g.transition().ease("back")
		    .duration(1200)
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

		counties_g.transition().ease("back")
		    .duration(1200)
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

		$("g.counties").fadeOut();
		$("g.states path").css("fill", function(){
		    return $(this).attr("data-color");
		});
		$("g.states path").css("opacity", function(){
		    return $(this).attr("data-heat");
		});
	    })
	    .on("mouseover", function(d, i){
		if(!c[d.id]) return;
		var tooltip = c[d.id][param].tooltip;
		that.tooltip.html(tooltip);
		that.tooltip.style("visibility", "visible");

	    })
	    .on("mousemove", function(){
		var yReduce = parseInt(that.tooltip.style("height")) + 40;
		var xReduce = parseInt(that.tooltip.style("width")) / 2;
		that.tooltip.style("top", (event.pageY- yReduce)+"px").style("left",(event.pageX-xReduce)+"px");
	    })
	    .on("mouseout", function(){
		that.tooltip.style("visibility", "hidden");
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
		if(!s[d.id]) {
		    console.log(d.id);
		    return;
		}

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

		counties_g.transition().delay(250).ease("elastic")
		    .duration(1200)
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

		states_g.transition().delay(250).ease("elastic")
		    .duration(1200)
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

		$("g.states path").css("fill", "#fff"); // Conceal all states
		$(this).css("fill", "none"); // Show the one that has been clicked on
		$("g.states path").animate({opacity: 0.9});
		$("g.counties").show();
	    })
	    .on("mouseover", function(d, i){
		if(!c[d.id]) return;
		var tooltip = c[d.id][param].tooltip;
		that.tooltip.html(tooltip);
		that.tooltip.style("visibility", "visible");

	    })
	    .on("mousemove", function(){
		var yReduce = parseInt(that.tooltip.style("height")) + 40;
		var xReduce = parseInt(that.tooltip.style("width")) / 2;
		that.tooltip.style("top", (event.pageY- yReduce)+"px").style("left",(event.pageX-xReduce)+"px");
	    })
	    .on("mouseout", function(){
		that.tooltip.style("visibility", "hidden");
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
};

Pyk.Ultimate = function(options){
    this.init = function(){
	if(!this.validate_options()) return false;

	var that = this;
	$(this.options.selection).html("<img src='/res/img/spinner.gif'> Loading... Please wait");

	d3.json(this.options.data, function(e, data){
	    that.data = data;
	    that.render();
	});
    }

    this.render = function(){
	$(this.options.selection).html("");

	var h = this.options.height;
	var w = this.options.width;

	// Create SVG holder for the chart and the legends
	this.svg = d3.select(this.options.selection)
	    .append("svg")
	    .attr("class", "pyk-ultimate")
	    .attr("height", h)
	    .attr("width", w);

	this.legends_group = this.svg.append("g")
	    .attr("class", "legend-holder")
	    .attr("transform", "translate(0,15)");

	this.chart_group = this.svg.append("g")
	    .attr("class", "chart-holder")
	    .attr("width", w - (this.options.margins.right + this.options.margins.left))
	    .attr("height", h - (this.options.margins.top + this.options.margins.bottom))
	    .attr("transform", "translate(" + this.options.margins.left + "," + this.options.margins.top + ")");

	// Render elements
	this.renderTooltip();
	this.draw();
    }

    this.renderLegends = function(){
	// TODO Implement this
    }

    // Takes the flattened data and returns layers
    // Each layer is a separate category
    // The structure of the layer is made so that is plays well with d3.stack.layout()
    // Docs - https://github.com/mbostock/d3/wiki/Stack-Layout#wiki-values
    this.layers = function(the_bars){
	var layers = [];

	function findLayer(l){
	    for(i in layers){
		var layer = layers[i];
		if (layer.name == l) return layer;
	    }
	    return addLayer(l);
	}

	function addLayer(l){
	    var new_layer = {
		"name": l,
		"values": []
	    }
	    layers.push(new_layer);
	    return new_layer;
	}

	for(i in the_bars){
	    var bar = the_bars[i];
	    if(!bar.id) continue;
	    var id = bar.id;
	    for(k in bar){
		if(k === "id") continue;
		var icings = bar[k];
		for(j in icings){
		    var icing = icings[j];
		    var layer = findLayer(icing.name);
		    layer.values.push({
			"x": id,
			"y": icing.val,
			"color": icing.color,
			"tooltip": icing.tooltip
		    })
		}
	    }
	}
	return layers;
    }

    // Traverses the JSON and returns an array of the 'bars' that are to be rendered
    this.flattenData = function(){
	var the_bars = [];

	for(i in this.data){
	    var d = this.data[i];
	    for(cat_name in d){
		for(j in d[cat_name]){
		    var id = "i" + i + "j" + j;
		    d[cat_name][j].id = id;
		    the_bars.push(d[cat_name][j]);
		}
		the_bars.push(i); // Extra seperator element for gaps in segments
	    }
	}
	return the_bars;
    }

    this.renderChart = function(){
	var that = this;
	var w = this.chart_group.attr("width");
	var h = this.chart_group.attr("height");

	var the_bars = this.flattenData();
	var layers = this.layers(the_bars);

	var stack = d3.layout.stack() // Create default stack
	    .values(function(d){ // The values are present deep in the array, need to tell d3 where to find it
		return d.values;
	    })(layers);

	var yValues = []
	layers.map(function(e, i){ // Get all values to create scale
	    for(i in e.values){
		var d = e.values[i];
		yValues.push(d.y + d.y0); // Adding up y0 and y to get total height
	    }
	});

	var xScale = d3.scale.ordinal()
	    .domain(the_bars.map(function(e, i){
		return e.id || i; // Keep the ID for bars and numbers for integers
	    }))
	    .rangeBands([0,w], 0.2);
	var yScale = d3.scale.linear().domain([0, d3.max(yValues)]).range([that.options.margins.top, h]);
	var zScale = d3.scale.category10();


	var bars = this.chart_group.selectAll("g.bars")
	    .data(layers)
	    .enter().append("g")
	    .attr("class", "bars")
	    .attr("fill", function(d,i){
		return zScale(i);
	    });

	var rect = bars.selectAll("rect")
	    .data(function(d){
		return d.values
	    }).enter().append("svg:rect")
	    .attr("x", function(d){
		return xScale(d.x);
	    })
	    .attr("width", function(d){
		return xScale.rangeBand();
	    })
	    .attr("height", function(d){
		return yScale(d.y);
	    })
	    .attr("y", function(d){
		return h - yScale(d.y0 + d.y);
	    })

    }

    this.draw = function(){
	this.renderLegends();
	this.renderChart();
    }

    this.renderTooltip = function(){
	$("#pyk-ultimate-tooltip").remove();
	this.tooltip = d3.select("body")
	    .append("div").attr("id","pyk-ultimate-tooltip")
	    .style("position", "absolute")
	    .style("z-index", "10")
	    .style("visibility", "hidden")
	    .style("background", "#fff")
	    .style("padding", "10px 20px")
	    .style("box-shadow", "0 0 10px #000")
	    .style("border-radius", "5px")
	    .text("a simple tooltip");
    }

    // Options: Validations & Defaults
    this.validate_options = function(){
	if(this.options.selection == undefined) return false;
	if(this.options.data == undefined) return false;
	if(this.options.width < 300) return false;
	return true;
    }

    this.options = jQuery.extend({
	width: 960,
	height: 300,
	filterList: [],
	fullList: [],
	extended: false,
	margins: {
	    left: 20,
	    right: 20,
	    top: 10,
	    bottom: 20
	}
    }, options);

    return this;
};

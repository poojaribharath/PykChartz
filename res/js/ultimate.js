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
	    .attr("class", "chart-holder");

	// Render elements
	this.renderTooltip();
	this.draw();
    }

    this.renderLegends = function(){
	// TODO Implement this
    }

    this.renderChart = function(){
	var that = this;

	// TODO Figure out margin convention
	var w = this.options.width;

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

	var idArray = the_bars.map(function(e,i){return e.id || i;}); // Need just the arrays for the ordinal scale
	var xScale = d3.scale.ordinal().domain(idArray).rangeBands([0,960], 0.05);

	// WHY?
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

	var yValues = [];

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
		    yValues.push(icing.val);
		    layer.values.push({
			"x": id,
			"y": icing.val,
			"color": icing.color,
			"tooltip": icing.tooltip
		    })
		}
	    }
	}

	var yScale = d3.scale.linear().domain([0, d3.max(yValues) * 4]).range([0,this.options.height]);
	var zScale = d3.scale.category10();

	console.log(layers);
	var stack = d3.layout.stack().values(function(d){
	    return d.values;
	});

	var svg = this.chart_group;

	var bars = svg.selectAll("g.bars")
	    .data(stack(layers))
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
		return yScale(d.y0);
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
	height: 200,
	filterList: [],
	fullList: [],
	extended: false
    }, options);

    return this;
};

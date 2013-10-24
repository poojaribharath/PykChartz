PykCharts.Ultimate = function(options){
    this.init = function(){
	if(!this.validate_options()) return false;

	var that = this;
	$(this.options.selection).html("<img src='/pykcharts/images/spinner.gif'> Loading... Please wait");

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

	this.svg.append("g").attr("class", "yaxis");
	this.svg.append("g").attr("class", "xaxis");

	this.legends_group = this.svg.append("g")
	    .attr("class", "legend-holder")
	    .attr("background", "Red")
	    .attr("transform", "translate(0,15)");

	this.chart_group = this.svg.append("g")
	    .attr("class", "chart-holder")
	    .attr("width", w - (this.options.margins.right + this.options.margins.left))
	    .attr("height", h - (this.options.margins.top + this.options.margins.bottom))
	    .attr("transform", "translate(" + this.options.margins.left + "," + this.options.margins.top + ")");

	var fD = this.flattenData(this.data);
	this.the_bars = fD[0];
	this.the_keys = fD[1];
	this.the_layers = this.layers(this.the_bars);


	// Render elements
	this.renderTooltip();
	this.draw();
    }

    this.getParameters = function(){
	var that = this;
	var p = []
	for(i in  that.the_layers){
	    if(!that.the_layers[i].name) continue;
	    var name = that.the_layers[i].name;
	    var color = that.the_layers[i].values[0].color;
	    p.push({
		"name": name,
		"color": color
	    });
	}
	return p;

    }

    this.onlyFilter = function(f){
	var index = this.options.filterList.indexOf(f)
	if(this.options.filterList.length === 1 && index != -1){
	    // if its the only item on the list, get rid of it
	    this.options.filterList = [];
	}else{
	    // otherwise empty the list and add this one to it
	    this.options.filterList = [];
	    this.options.filterList.push(f);
	}
	this.draw();
    }

    this.toggleFilter = function(f){
	var index = this.options.filterList.indexOf(f)
	if(index === -1){
	    this.options.filterList.push(f);
	}else{
	    this.options.filterList.splice(index, 1);
	}
	this.draw();
    }


    this.renderLegends = function(){
	var that = this;
	var w = this.options.width;

	var params = this.getParameters();

	this.legends_group.selectAll("g.legend_group").remove();

	var legendGroups = this.legends_group.selectAll("g.legend_group").data(params)
	    .enter()
	    .append("g")
	    .attr("class", "legend_group")
	    .attr("transform", function(d,i){
		return "translate(" + (w-(i*100)-100) + ", 0)";
	    });

	for(i in params){
	    var g = d3.select(legendGroups[0][i]);
	    var p = params[i];

	    var texts = g.selectAll("text").data([p])

	    texts.enter().append("text")

	    texts.text(function(d){
		    return p.name;
		})
		.attr("x", function(d,i){
		    return i * 40;
		})
		.attr("dy", -3)
		.on("click", function(d,i){
		    that.toggleFilter(d.name);
		});

	    var circles = g.selectAll("circle").data([p])
	    circles.enter().append("circle");

	    circles
		.attr("cx", function(d,i){
		    return (i*100)-10;
		})
		.attr("cy",-6).attr("r", 6)
		.attr("style", function(d){
		    var fillColor = (that.options.filterList.indexOf(d.name) === -1) ? "#fff":d.color;
		    return "fill: "+ fillColor +"; stroke-width: 3px; stroke:" + d.color;
		})

	}
	// TODO Make legends
    }

    this.getGroups = function(){
	var groups = {};
	for(i in this.the_bars){
	    var bar = this.the_bars[i];
	    if(!bar.id) continue;
	    if(groups[bar.group]){
		groups[bar.group].push(bar.id);
	    }else{
		groups[bar.group] = [bar.id];
	    }
	}
	return groups;
    }

    this.renderChart = function(){
	var that = this;
	var w = this.chart_group.attr("width");
	var h = this.chart_group.attr("height");

	var the_bars = this.the_bars;
	var keys = this.the_keys;
	var layers = this.the_layers;
	var groups= this.getGroups();

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

	var yScale = d3.scale.linear().domain([0,d3.max(yValues)]).range([that.options.margins.top, h]).nice();
	var yScaleInvert = d3.scale.linear().domain([d3.max(yValues), 0]).range([that.options.margins.top, h]).nice(); // For the yAxis
	var zScale = d3.scale.category10();


	var yAxis = d3.svg.axis()
	    .scale(yScaleInvert)
	    .tickSize(-w, 0, 0)
	    .orient("left");

	var xAxis = d3.svg.axis()
            .scale(xScale)
	    .tickSize(-h, 0, 0)
	    .tickFormat(function(d){
		if(!keys[d]) return;
		return keys[d];
	    })
            .orient("bottom");

	this.svg.select("g.yaxis").transition(1000)
	    .attr("transform", "translate("+ this.options.margins.left +", " + this.options.margins.top + ")")
	    .call(yAxis);


	var translateY = parseInt(this.options.margins.top) + parseInt(h);

	this.svg.select("g.xaxis").transition(1000)
	    .attr("transform", "translate("+ this.options.margins.left +", " + translateY + ")")
	    .call(xAxis)
	    .selectAll("text")
	    .style("text-anchor", "start")
	    .attr("dy", "2px")
	    .attr("dx", "20px")
	    .attr("transform", function(d) {
                return "rotate(90)"
            });;


	var group_label_data = [];
	for(i in groups){
	    var g = groups[i];
	    var x = xScale(g[0]);
	    var totalWidth = xScale.rangeBand() * g.length;
	    var x = x + (totalWidth/2);
	    group_label_data.push({x: x, name: i});
	}

	if(group_label_data.length > 1){
	    this.svg.selectAll("text.group_label").data(group_label_data).enter()
		.append("text").attr("class", "group_label")
		.attr("x", function(d){
		    return d.x + that.options.margins.left;
		})
		.attr("y", function(d){
		    return parseInt(h) + 24;
		})
		.attr("text-anchor", "middle")
		.text(function(d){
		    return d.name;
		});
	}

	var bars = this.chart_group.selectAll("g.bars").data(layers)

	bars.enter().append("g")
	    .attr("class", "bars");


	var rect = bars.selectAll("rect")
	    .data(function(d){
		return d.values
	    });

	rect.enter().append("svg:rect")
	    .attr("height", 0).attr("y", h)
	    .on("mouseover", function(d, i){
		that.tooltip.html(d.tooltip);
		that.tooltip.style("visibility", "visible");
	    })
	    .attr("fill", function(d){
		return d.color;
	    })
	    .on("mousemove", function(){
		var yReduce = parseInt(that.tooltip.style("height")) + 40;
		var xReduce = parseInt(that.tooltip.style("width")) / 2;
		that.tooltip.style("top", (event.pageY- yReduce)+"px").style("left",(event.pageX-xReduce)+"px");
	    })
	    .on("mouseout", function(){
		that.tooltip.style("visibility", "hidden");
	    })
	    .on("click", function(d){
		that.onlyFilter(d.name);
	    });


	rect
	    .transition().duration(1000).attr("x", function(d){
		return xScale(d.x);
	    })
	    .attr("width", function(d){
		return xScale.rangeBand();
	    })
	    .attr("height", function(d){
		if(d.y == 0) return 0;
		return yScale(d.y);
	    })
	    .attr("y", function(d){
		return h - yScale(d.y0 + d.y);
	    });


    }

    this.draw = function(){
	this.options.fullList = this.getParameters().map(function(d){
	    return d.name;
	});
	this.options.filterList = (this.options.filterList.length === 0) ? this.options.fullList : this.options.filterList;

	var tData = jQuery.extend(true, [], this.data);
	tData = this.filterData(tData);
	var fD = this.flattenData(tData);
	this.the_bars = fD[0];
	this.the_keys = fD[1];
	this.the_layers = this.layers(this.the_bars);

	this.renderLegends();
	this.renderChart();
    }

    this.filterData = function(data){
	var params = this.options.filterList;

	for(i in data){
	    var group = data[i];
	    for(j in group){
		var bars = group[j];
		for(k in bars){
		    var bar = bars[k];
		    for(l in bar){
			var slabs = bar[l];
			for(m in slabs){
			    var slab = slabs[m];
			    if(params.indexOf(slab.name) == -1){
				slab.val = 0;
			    }
			}
			break;
		    }
		}
	    }
	}
	return data;
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

    // Data Helpers
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
		    if(!icing.name) continue;
		    var layer = findLayer(icing.name);
		    layer.values.push({
			"x": id,
			"y": icing.val,
			"color": icing.color,
			"tooltip": icing.tooltip,
			"name": icing.name
		    })
		}
	    }
	}
	return layers;
    }

    // Traverses the JSON and returns an array of the 'bars' that are to be rendered
    this.flattenData = function(data){
	var the_bars = [-1];
	var keys = {};
	for(i in data){
	    var d = data[i];
	    for(cat_name in d){
		for(j in d[cat_name]){
		    var id = "i" + i + "j" + j;
		    var key = Object.keys(d[cat_name][j])[0];

		    keys[id] = key;
		    d[cat_name][j].id = id;
		    d[cat_name][j].group = cat_name;

		    the_bars.push(d[cat_name][j]);
		}
		the_bars.push(i); // Extra seperator element for gaps in segments
	    }
	}
	return [the_bars, keys];
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
	height: 400,
	filterList: [],
	fullList: [],
	extended: false,
	margins: {
	    left: 40,
	    right: 20,
	    top: 10,
	    bottom: 80
	}
    }, options);

    return this;
};

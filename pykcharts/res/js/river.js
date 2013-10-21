PykCharts.River = function(options){

    this.init = function(){
	if(!this.validate_options()) return false;

	var that = this;
	var opt = this.options;

	$(this.options.selection).html("<img src='/pykcharts/res/img/spinner.gif'> Loading... Please wait");

	d3.json(opt.data, function(e, data){
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
	    .attr("class", "pyk-river")
	    .attr("height", h)
	    .attr("width", w);

	this.legends_group = this.svg.append("g")
	    .attr("class", "legend-holder")
	    .attr("transform", "translate(0,15)");

	this.map_group = this.svg.append("g")
	    .attr("class", "map-holder");

	// Render elements
	this.renderTooltip();
	this.draw();
    }

    this.draw = function(){
	this.renderLegends();
	this.renderChart();
    }

    this.renderChart = function(){
	var tData = jQuery.extend(true, [], this.data);
	var legendHeight = 40;
	var that = this;

	// Filtering & Parsing Data
	tData = this.filter(tData);
	tData = this.parseData(tData);
	var maxTotalVal = this.maxTotal(tData);

	// Sizes & Scales
	var width = this.options.width;
	var height = this.options.height;
	var xScale = d3.scale.linear().domain([0, maxTotalVal]).range([0, width - 200]);
	var yScale = d3.scale.linear().domain([0, height]).range([legendHeight, height]);
	var barHeight = (height) / (tData.length * 2);
	var barMargin = barHeight * 2;

	var svg = this.map_group;

	// Top: Graph Lines
	svg.selectAll("line.top_line").data(tData).enter()
	    .append("line").attr("class", "top_line")
	    .attr("x1", 0).attr("x2", width)
	    .attr("y1", function(d, i){
		return yScale(i * barMargin);
	    })
	    .attr("y2", function(d, i){
		return yScale(i * barMargin);
	    });


	// Bottom: Graph Lines
	svg.selectAll("line.bottom_line").data(tData).enter()
	    .append("line").attr("class", "bottom_line")
	    .attr("x1", 0).attr("x2", width)
	    .attr("y1", function(d, i){
		return yScale((i * barMargin) + barHeight);
	    })
	    .attr("y2", function(d, i){
		return yScale((i * barMargin) + barHeight);
	    });

	// SVG Groups for holding the bars
	var groups = svg.selectAll("g.bar-holder").data(tData)

	groups.enter().append("g").attr("class", "bar-holder")
	    .attr("transform", function(d, i){
		var y = yScale(i * barMargin);
		var x = xScale((maxTotalVal - d.breakupTotal) / 2) + 100;
		return "translate("+x+","+y+")";
	    });


	groups.transition().duration(1000)
	    .attr("height", yScale(barHeight))
	    .attr("width", function(d){
		return xScale(d.breakupTotal);
	    })
	    .attr("transform", function(d, i){
		var y = yScale(i * barMargin);
		var x = xScale((maxTotalVal - d.breakupTotal) / 2) + 100;
		var scalex = 1;
		var scaley = 1;

		if(that.extended){
		    var barWidth = xScale(d.breakupTotal);
		    scalex = (width - 200) / barWidth;
		    scaley = 2;
		    x = yScale(100);
		}

		return "translate("+x+","+y+") scale("+ scalex +", "+ scaley  +")";
	    });

	groups.exit().remove();


	var bar_holder = d3.selectAll("g.bar-holder")[0];
	for(i in tData){
	    var group = bar_holder[i];
	    var breakup = tData[i].breakup;


	    // Rectangles
	    var rects = d3.select(group).selectAll("rect").data(breakup);

	    rects.enter().append("rect").attr("width", 0);

	    rects.transition().duration(1000)
		.attr("x", function(d, i){
		    if (i == 0) return 0
		    var shift = 0;
		    for(var j = 0; j < i; j++){
			shift += breakup[j].count;
		    }
		    return xScale(shift);
		})
		.attr("y", 0)
		.attr("height", function(d, i){
		    // Scale the height according to the available height
		    return (barHeight * (height - legendHeight)) / height

		})
		.attr("width", function(d,i){
		    return xScale(d.count);
		});

	    rects.attr("style", function(d,i){
		return "fill: " + d.color;
	    })
		.on("mouseover", function(d, i){
		    that.tooltip.html(d.tooltip);
		    that.tooltip.style("visibility", "visible");
		})
		.on("mousemove", function(){
		    var yReduce = parseInt(that.tooltip.style("height")) + 40;
		    var xReduce = parseInt(that.tooltip.style("width")) / 2;
		    that.tooltip.style("top", (event.pageY- yReduce)+"px").style("left",(event.pageX-xReduce)+"px");
		})
		.on("mouseout", function(){
		    that.tooltip.style("visibility", "hidden");
		})
		.on("click", function(d, i){
		    that.onlyFilter(d.name);
		});

	    rects.exit().transition().duration(1000).attr("width", 0).remove();
	}

	// Display Name labels
	var display_name = svg.selectAll("text.cool_label").data(tData);

	display_name.enter().append("text").attr("class", "cool_label");

	display_name.attr("x", width)
	    .attr("y", function(d, i){
		return yScale((i * barMargin) + (barHeight/2) + 5);
	    })
	    .text(function(d, i){
		return d.display_name;
	    });


	// Left side labels with totals
	var left_labels = svg.selectAll("text.left_label").data(tData);

	left_labels.enter().append("svg:text").attr("class", "left_label");

	left_labels
	    .attr("y", function(d, i){
		return yScale((i * barMargin) + (barHeight/2) + 5);
	    })
	    .attr("x", 0)
	    .text(function(d,i){
		return d.breakupTotal + " " + d.technical_name;
	    });


	// Right side labels with time duration
	var right_labels = svg.selectAll("text.right_label").data(tData);

	right_labels.enter().append("svg:text").attr("class", "right_label");

	right_labels
	    .attr("y", function(d, i){
		return yScale((i * barMargin) + (barHeight * 1.5) + 5);
	    })
	    .attr("x", width)
	    .text(function(d,i){
		if(tData[i+1] == undefined){
		    console.log("RiverChart: Error: Duration given for last bar");
		    return "";
		}
		return d.duration;
	    });



	if(this.extended) {
	    $("line.left_line").fadeOut();
	    $("line.right_line").fadeOut();
	    return;
	} //No need for angle lines if its extended

	// Left side angle lines
	var left_angles = svg.selectAll("line.left_line").data(tData);

	left_angles.enter().append("line").attr("class", "left_line")
	    .attr("y2", function(d,i){
		return yScale((i * barMargin) + barHeight);
	    })
	    .attr("x2", function(d,i){
		return xScale((maxTotalVal - d.breakupTotal) / 2) + 100;
	    });

	left_angles.transition().duration(1000)
	    .attr("style", function(d,i){
		if(!tData[i+1]) return "stroke-width: 0";
	    })
	    .attr("y1", function(d,i){
		return yScale((i * barMargin) + barHeight);
	    })
	    .attr("x1", function(d,i){
		return xScale((maxTotalVal - d.breakupTotal) / 2) + 100;
	    })
	    .attr("y2", function(d,i){
		return yScale(((i+1) * barMargin));
	    })
	    .attr("x2", function(d,i){
		if(!tData[i+1]) return 0;
		return xScale((maxTotalVal - tData[i+1].breakupTotal) / 2) + 100;

	    });


	// Right side angle lines
	var right_angles = svg.selectAll("line.right_line").data(tData)

	right_angles.enter().append("line").attr("class", "right_line")
	    .attr("y2", function(d,i){
		return yScale((i * barMargin) + barHeight);
	    })
	    .attr("x2", function(d,i){
		return xScale(((maxTotalVal - d.breakupTotal) / 2) + d.breakupTotal) + 100;
	    });

	right_angles.transition().duration(1000)
	    .attr("style", function(d,i){
		if(!tData[i+1]) return "stroke-width: 0";
	    })
	    .attr("y1", function(d,i){
		return yScale((i * barMargin) + barHeight);
	    })
	    .attr("x1", function(d,i){
		return xScale(((maxTotalVal - d.breakupTotal) / 2) + d.breakupTotal) + 100;
	    })
	    .attr("y2", function(d,i){
		return yScale(((i+1) * barMargin));
	    })
	    .attr("x2", function(d,i){
		if(!tData[i+1]) return 0;
		return xScale(((maxTotalVal - tData[i+1].breakupTotal) / 2) + tData[i+1].breakupTotal) + 100;
	    });


    }

    this.renderTooltip = function(){
	$("#river-tooltip").remove();
	this.tooltip = d3.select("body")
	    .append("div").attr("id","river-tooltip")
	    .style("position", "absolute")
	    .style("z-index", "10")
	    .style("visibility", "hidden")
	    .style("background", "#fff")
	    .style("padding", "10px 20px")
	    .style("box-shadow", "0 0 10px #000")
	    .style("border-radius", "5px")
	    .text("a simple tooltip");
    }

    this.renderLegends = function(){
	var that = this;

	// Extended & Stream Options
	var optionHolder = this.legends_group.append("g")
	    .attr("class", "option-holder")
	    .attr("transform", "translate(0,15)");

	var options = [
	    {
		"name": "Percentage",
		"on": this.extended
	    },
	    {
		"name": "Absolute",
		"on": !this.extended
	    }
	]

	var texts = d3.select("g.option-holder").selectAll("text").data(options);
	texts.enter().append("text")
	    .text(function(d,i){
		return d.name;
	    })
	    .attr("transform", function(d, i){
		return "translate(" + ((i*100) + 20) + ",0)";
	    })
	    .on("click", function(d,i){
		that.extended = !that.extended;
		that.draw();
	    });


	var circles = d3.select("g.option-holder").selectAll("circles").data(options);
	circles.enter().append("circle")
	    .attr("cx", function(d,i){
		return (i*100)+10;
	    })
	    .attr("cy",-6).attr("r", 6)
	    .attr("style", function(d){
		var fill = d.on ? "#000" : "#fff";
		return "fill: "+ fill +"; stroke-width: 3px; stroke:#000";
	    })
	    .on("click", function(d,i){
		that.extended = !that.extended;
		that.draw();
	    });

	// Legends for different datasets
	var legends = this.data[0].breakup;
	var lWidth = (this.options.width-250) / legends.length;

	var lg = this.legends_group.append("g").attr("class", "legend-holder")
	    .attr("transform", "translate(250,15)");

	lg.selectAll("g.legend")
	    .data(legends).enter()
	    .append("g").attr("class", "legend")
	    .attr("transform", function(d, i){
		var l = i * lWidth;
		return "translate("+l+",0)";
	    })
	    .on("click", function(d){
		that.toggleFilter(d.name);
	    });

	var groups = d3.selectAll("g.legend")[0];


	for(i in legends){
	    var group = d3.select(groups[i]);

	    group.selectAll("text").data([legends[i]]).enter().append("text")
		.text(function(d){
		    that.options.filterList.push(d.name);
		    that.options.fullList.push(d.name);
		    return d.name;
		})
		.attr("transform", "translate(20,-1)");

	    var c = group.selectAll("circle").data([legends[i]])

	    c.enter().append("circle")

	    c.attr("cx", 9).attr("cy",-6).attr("r", 6)
		.attr("style", function(d){
		    var fill = (that.options.filterList.indexOf(d.name) === -1) ? "#fff" : d.color;
		    if(that.options.filterList.length === 0) fill = d.color;
		    return "fill: "+ fill +"; stroke-width: 3px; stroke:" + d.color;
		});
	}
    }

    // Data Helpers
    this.filter = function(d){
	if(this.options.filterList.length < 1){
	    this.options.filterList = jQuery.extend(true, [], this.options.fullList);
	}

	for(i in d){
	    var media = d[i].breakup;
	    var newMedia = [];
	    for(j in media){
		if (jQuery.inArray(media[j].name, this.options.filterList) >= 0) newMedia.push(media[j]);
	    }
	    d[i].breakup = newMedia;
	}
	return d;
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

    this.totalInBreakup = function(breakup){
	var total = 0;
	for(i in breakup) total += breakup[i].count; // Add all the counts in breakup to total
	return total;
    }

    this.maxTotal = function(d){
	var totals = []
	for(i in d) totals.push(d[i].breakupTotal); // Get all the breakupTotals in an Array
	totals = totals.sort(function(a,b){return a - b}); // Sort them in ascending order
	return totals[totals.length - 1]; // Give the last one
    }

    this.parseData = function(d){
	for(i in d) d[i].breakupTotal = this.totalInBreakup(d[i].breakup); // Calculate all breakup totals and add to the hash
	return d;
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

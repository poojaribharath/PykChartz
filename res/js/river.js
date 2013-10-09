function riverChart(){
    // Defaults
    var width = 960;
    var height = 200;
    var filterList = [];
    var fullList = [];


    // Filtering data
    function filter(d){
	if(filterList.length < 1){
	    filterList = jQuery.extend(true, [], fullList);
	}

	for(i in d){
	    var media = d[i].breakup;
	    var newMedia = [];
	    for(j in media){
		if (jQuery.inArray(media[j].name, filterList) >= 0) newMedia.push(media[j]);
	    }
	    d[i].breakup = newMedia;
	}
	return d;
    }

    function onlyFilter(f, selection){
	var index = filterList.indexOf(f)
	if(filterList.length === 1 && index != -1){
	    // if its the only item on the list, get rid of it
	    filterList = [];
	}else{
	    // otherwise empty the list and add this one to it
	    filterList = [];
	    filterList.push(f);
	}
	chart(selection);
    }


    function toggleFilter(f, selection){
	var index = filterList.indexOf(f)
	if(index === -1){
	    filterList.push(f);
	}else{
	    filterList.splice(index, 1);
	}
	chart(selection);
    }


    // Legend Maker
    function makeLegends(legends, svg, selection){

	var lg = svg.append("g").attr("class", "legend-holder")
	    .attr("transform", "translate(0,15)");


	var lWidth = width / legends.length

	lg.selectAll("g.legend").data(legends).enter().append("g").attr("class", "legend")
	    .attr("transform", function(d, i){
		var l = i * lWidth;
		return "translate("+l+",0)";
	    })
	    .on("click", function(d){
		toggleFilter(d.name, selection);
	    });



	var legendGroups = d3.selectAll("g.legend")[0];

	for(i in legends){
	    var group = d3.select(legendGroups[i])

	    group.selectAll("text").data([legends[i]]).enter().append("text")
		.text(function(d){
		    filterList.push(d.name);
		    fullList.push(d.name);
		    return d.name;
		})
		.attr("transform", "translate(20,-1)");


	    var c = group.selectAll("circle").data([legends[i]])

	    c.enter().append("circle")

	    c.attr("cx", 9).attr("cy",-6).attr("r", 6)
		.attr("style", function(d){
		    var fill = (filterList.indexOf(d.name) === -1) ? "#fff" : d.color;
		    if(filterList.length === 0) fill = d.color;
		    return "fill: "+ fill +"; stroke-width: 3px; stroke:" + d.color;
		});
	}
	return 30;
    }


    // Main chart function
    function chart(selection){
	selection.each(function(data, i){ // for rendering into different elements

	    var tData = jQuery.extend(true, [], data);

	    // Need space for all the text and atleast 50px for the rectangles
	    if(width < 250){
		console.log("RiverChart: Error: The width of the chart can't be lesser than 250");
		return false;
	    }


	    // If the SVG already exists don't create a new one
	    var svg;
	    if ($(this).find("svg").length == 0){
		svg = d3.select(this).append("svg").attr("width", width).attr("height", height);
	    }else{
		svg = d3.select(this).select("svg");
	    }

	    var legendHeight = makeLegends(data[0].breakup, svg, selection);

	    // Filtering & Parsing Data
	    filter(tData);
	    parseData(tData);
	    var maxTotalVal = maxTotal(tData);

	    // Sizes & Scales
	    var xScale = d3.scale.linear().domain([0, maxTotalVal]).range([0, width - 200]);
	    var yScale = d3.scale.linear().domain([0, height]).range([legendHeight, height]);
	    var barHeight = (height) / (tData.length * 2);
	    var barMargin = barHeight * 2;


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


	    // Tooltip
	    $("#river-tooltip").remove();
	    var tooltip = d3.select("body")
		.append("div").attr("id","river-tooltip")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden")
		.style("background", "#fff")
		.style("padding", "10px 20px")
		.style("box-shadow", "0 0 10px #000")
		.style("border-radius", "5px")
		.text("a simple tooltip");



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
		    return "translate("+x+","+y+")";
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
			tooltip.html(d.tooltip);
			return tooltip.style("visibility", "visible");
		    })
		    .on("mousemove", function(){
			var yReduce = parseInt(tooltip.style("height")) + 40;
			var xReduce = parseInt(tooltip.style("width")) / 2;
			return tooltip.style("top", (event.pageY- yReduce)+"px").style("left",(event.pageX-xReduce)+"px");
		    })
		    .on("mouseout", function(){
			return tooltip.style("visibility", "hidden");
		    })
		    .on("click", function(d, i){
			onlyFilter(d.name, selection);
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

	});


    }


    // Data Helpers
    function totalInBreakup(breakup){
	var total = 0;
	for(i in breakup) total += breakup[i].count; // Add all the counts in breakup to total
	return total;
    }

    function maxTotal(d){
	var totals = []
	for(i in d) totals.push(d[i].breakupTotal); // Get all the breakupTotals in an Array
	totals = totals.sort(function(a,b){return a - b}); // Sort them in ascending order
	return totals[totals.length - 1]; // Give the last one
    }

    function parseData(d){
	for(i in d) d[i].breakupTotal = totalInBreakup(d[i].breakup); // Calculate all breakup totals and add to the hash
	return d;
    }




    // Getter/Setter
    chart.width = function(v){
	if(!arguments.length) return width;
	width = v;
	return chart;
    }

    chart.height = function(v){
	if(!arguments.length) return height;
	height = v;
	return chart;
    }

    chart.filterList = function(v){
	if(!arguments.length) return filterList;
	filterList = v;
	return chart;
    }

    return chart;
}

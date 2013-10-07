function riverChart(){
    // Defaults
    var width = 720;
    var height = 480;

    function chart(selection){
	selection.each(function(data, i){ // for rendering into different elements
	    var data = parseData(data);
	    var maxTotalVal = maxTotal(data);

	    var xScale = d3.scale.linear().domain([0, maxTotalVal]).range([0, width - 150]);

	    var barHeight = height / (data.length * 3);
	    var barMargin = barHeight * 3;

	    var svg = d3.select(this).append("svg").attr("width", width).attr("height", height);

	    // Big Reect groups
	    svg.selectAll("g.bar-holder").data(data).enter()
		.append("g").attr("class", "bar-holder")
		.attr("transform", function(d, i){
		    var y = i * barMargin;
		    var x = xScale((maxTotalVal - d.breakupTotal) / 2) + 100;
		    return "translate("+x+","+y+")";
		})
		.attr("height", barHeight)
		.attr("width", function(d){
		    return xScale(d.breakupTotal);
		});

	    var bar_holder = d3.selectAll("g.bar-holder")[0];

	    for(i in data){
		var group = bar_holder[i];
		var breakup = data[i].breakup;
		d3.select(group).selectAll("rect").data(breakup).enter()
		    .append("rect")
		    .attr("x", function(d, i){
			if (i == 0) return 0
			var shift = 0;
			for(var j = 0; j < i; j++){
			    shift += breakup[j].count;
			}
			return xScale(shift);
		    })
		    .attr("y", 0)
		    .attr("height", barHeight)
		    .attr("width", function(d,i){
			return xScale(d.count);
		    })
		    .attr("style", function(d,i){
			return "fill: " + d.color;
		    });
	    }

	    // Cool labels
	    svg.selectAll("text.cool_label").data(data).enter()
		.append("text").attr("class", "cool_label")
		.attr("x", ((width-150)/2)+100)
		.attr("y", function(d, i){
		    return (i * barMargin) + barHeight + 15;
		})
		.attr("text-anchor", "middle")
		.text(function(d, i){
		    return d.display_name;
		});

	    // Left side labels
	    svg.selectAll("text.left_label").data(data).enter()
		.append("svg:text")
		.attr("class", "left_label")
		.attr("y", function(d, i){
		    return (i * barMargin) + (barHeight/2);
		})
		.attr("x", 0)
		.text(function(d,i){
		    return d.breakupTotal + " " + d.technical_name;
		});

	    // right side labels
	    svg.selectAll("text.right_label").data(data).enter()
		.append("svg:text")
		.attr("class", "right_label")
		.attr("y", function(d, i){
		    return (i * barMargin) + (barMargin/1.5);
		})
		.attr("x", width - 50)
		.text(function(d,i){
		    return d.duration;
		});


	    // left anglelines
	    svg.selectAll("line.left_line").data(data).enter()
		.append("line").attr("class", "left_line")
		.attr("style", function(d,i){
		    if(!data[i+1]) return "stroke-width: 0";
		    return "stroke-width: 2; stroke: red";
		})
		.attr("y1", function(d,i){
		    return (i * barMargin) + barHeight;
		})
		.attr("x1", function(d,i){
		    return xScale((maxTotalVal - d.breakupTotal) / 2) + 100;
		})
		.attr("y2", function(d,i){
		    return ((i+1) * barMargin);
		})
		.attr("x2", function(d,i){
		    if(!data[i+1]) return 0;
		    return xScale((maxTotalVal - data[i+1].breakupTotal) / 2) + 100;
		});

	    // right angle lines
	    svg.selectAll("line.right_line").data(data).enter()
		.append("line").attr("class", "right_line")
		.attr("style", function(d,i){
		    if(!data[i+1]) return "stroke-width: 0";
		    return "stroke-width: 2; stroke: red";
		})
		.attr("y1", function(d,i){
		    return (i * barMargin) + barHeight;
		})
		.attr("x1", function(d,i){
		    return xScale(((maxTotalVal - d.breakupTotal) / 2) + d.breakupTotal) + 100;
		})
		.attr("y2", function(d,i){
		    return ((i+1) * barMargin);
		})
		.attr("x2", function(d,i){
		    if(!data[i+1]) return 0;
		    return xScale(((maxTotalVal - data[i+1].breakupTotal) / 2) + data[i+1].breakupTotal) + 100;
		});
	});
    }


    // Data Helpers
    function totalInBreakup(breakup){
	var total = 0;
	for(i in breakup) total += breakup[i].count; // Add all the counts in breakup to total
	return total;
    }

    function maxTotal(data){
	var totals = []
	for(i in data) totals.push(data[i].breakupTotal); // Get all the breakupTotals in an Array
	totals = totals.sort(function(a,b){return a - b}); // Sort them in ascending order
	return totals[totals.length - 1]; // Give the last one
    }

    function parseData(data){
	for(i in data) data[i].breakupTotal = totalInBreakup(data[i].breakup); // Calculate all breakup totals and add to the hash
	return data;
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

    return chart;
}


$(document).ready(function(){
    var then = new Date(); // Start timer
    var chart = riverChart();
    d3.select("#river-container").datum(sample_data).call(chart);
    var now = new Date(); // Stop timer
    console.log("The chart was rendered in: " + (now - then) + "ms");
});

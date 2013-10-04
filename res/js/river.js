function riverChart(){
    // Defaults
    var width = 720;
    var height = 480;
    var data = [];

    function chart(selection){
	selection.each(function(data, i){ // for rendering into different elements
	    var xScale = calculateScale(data);

	    var barHeight = height / (data.length * 3);
	    var barMargin = barHeight * 3;

	    var svg = d3.select(this).append("svg").attr("width", width).attr("height", height);

	    // Big Reect groups
	    svg.selectAll("g.bar-holder")
		.data(data)
		.enter()
		.append("g").attr("class", "bar-holder")
		.attr("transform", function(d, i){
		    var y = i * barMargin;
		    var x = xScale((maxTotal(data) - totalInBreakup(d.breakup)) / 2) + 100;
		    return "translate("+x+","+y+")";
		})
		.attr("height", barHeight)
		.attr("width", function(d){
		    return xScale(totalInBreakup(d.breakup));
		});

	    var bar_holder = d3.selectAll("g.bar-holder")[0];
	    for(i in data){
		var group = bar_holder[i];
		var breakup = data[i].breakup;
		d3.select(group).selectAll("rect")
		    .data(breakup)
		    .enter()
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


	    // Left side labels
	    svg.selectAll("text.left_label")
		.data(data)
		.enter()
		.append("svg:text")
		.attr("class", "left_label")
		.attr("y", function(d, i){
		    return (i * barMargin) + (barHeight/2);
		})
		.attr("x", 0)
		.text(function(d,i){
		    return totalInBreakup(d.breakup) + " " + d.technical_name;
		});

	    // right side labels
	    svg.selectAll("text.right_label")
		.data(data)
		.enter()
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
	    svg.selectAll("line.left_line")
		.data(data)
		.enter()
		.append("line").attr("class", "left_line")
		.attr("style", function(d,i){
		    if(!data[i+1]) return "stroke-width: 0";
		    return "stroke-width: 2; stroke: red";
		})
		.attr("y1", function(d,i){
		    return (i * barMargin) + barHeight;
		})
		.attr("x1", function(d,i){
		    return xScale((maxTotal(data) - totalInBreakup(d.breakup)) / 2) + 100;
		})
		.attr("y2", function(d,i){
		    return ((i+1) * barMargin);
		})
		.attr("x2", function(d,i){
		    if(!data[i+1]) return 0;
		    return xScale((maxTotal(data) - totalInBreakup(data[i+1].breakup)) / 2) + 100;
		});

	    // right angle lines
	    svg.selectAll("line.right_line")
		.data(data)
		.enter()
		.append("line").attr("class", "right_line")
		.attr("style", function(d,i){
		    if(!data[i+1]) return "stroke-width: 0";
		    return "stroke-width: 2; stroke: red";
		})
		.attr("y1", function(d,i){
		    return (i * barMargin) + barHeight;
		})
		.attr("x1", function(d,i){
		    return xScale(((maxTotal(data) - totalInBreakup(d.breakup)) / 2) + totalInBreakup(d.breakup)) + 100;
		})
		.attr("y2", function(d,i){
		    return ((i+1) * barMargin);
		})
		.attr("x2", function(d,i){
		    if(!data[i+1]) return 0;
		    return xScale(((maxTotal(data) - totalInBreakup(data[i+1].breakup)) / 2) + totalInBreakup(data[i+1].breakup)) + 100;
		});



	});
    }


    // Data Helpers
    function totalInBreakup(breakup){
	var total = 0;
	for(i in breakup){
	    var media = breakup[i];
	    total += media.count;
	}
	return total
    }

    function maxTotal(data){
	var totals = []
	for(i in data){
	    var period = data[i].breakup
	    var total = 0
	    for(j in period){
		var media = period[j];
		total += media.count;
	    }
	    totals.push(total);
	}
	totals = totals.sort(function(a,b){
	    return a - b;
	});
	return totals[totals.length - 1];
    }

    function calculateScale(data){
	return d3.scale.linear().domain([0, maxTotal(data)]).range([0, width - 150]);
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

    chart.data = function(v){
	if(!arguments.length) return data;
	data = v;
	return chart;
    }


    return chart;
}


$(document).ready(function(){
    var chart = riverChart();
    d3.select("#river-container").datum(sample_data).call(chart);
});

function riverChart(){
    // Defaults
    var width = 720;
    var height = 480;
    var data = [];

    function chart(selection){
	selection.each(function(data, i){ // for rendering into different elements
	    var svg = d3.select(this).append("svg").attr("width", width).attr("height", height);
	    svg.selectAll("rect")
		.data(data)
		.enter()
		.append("rect")
		.attr("y", function(d, i){
		    return i * 21;
		})
		.attr("x", 0)
		.attr("height", 20)
		.attr("width", function(d){
		    var total = 0;
		    for(i in d.breakup){
			var media = d.breakup[i];
			total += media.count;
		    }
		    return total;
		});
	});
    }

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

var a,b,c,d;
var svg;
var height, width;

$(document).ready(function(){
    a = [1,2,3,4];
    b = [5,6,7,8];
    c = [1,2,3]
    d = [1,2,3,4,5,67,7,34]

    var margin = {top: 20, right: 10, bottom: 20, left: 10};

    var h = 200;
    var w = 400;

    width = w - margin.left - margin.right;
    height = h - margin.top - margin.bottom;

    svg = d3.select("#test-container").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    svg.append("g").attr("class","axis");

    popo(d);
});


function popo(data){
    var largest = d3.max(data);

    var yScale = d3.scale.linear()
	.domain([0,largest])
	.range([0,180]);

    var xScale = d3.scale.ordinal()
	.domain(data)
	.rangeBands([50, width], 0.05);


    var rects = svg.selectAll("rect").data(data);

    var padding = 50;

    var yAxis = d3.svg.axis()
                  .scale(d3.scale.linear().domain([largest,0]).range([0,200]))
                  .orient("left")
                  .ticks(10);

    svg.selectAll("g.axis").transition().duration(1000).ease("elastic")
	.attr("transform", "translate(" + padding + ",0)")
	.call(yAxis)

    // Enter
    rects.enter().append("rect")
	.attr("x",0)
	.attr("y", 0)
	.attr("width", 0)
	.attr("height", 0)
	.on("click", function(d, i){
	    d3.select(this).transition().ease("bounce").duration(1000).attr("y", 0).remove();
	});


    // Update
    rects.transition().ease("elastic").duration(1000)
	.attr("x", function(d,i){
	    return xScale(d);
	})
	.attr("y", function(d,i){
	    return yScale(largest-d);
	})
	.attr("width", function(d,i){
	    return xScale.rangeBand();
	})
	.attr("height", function(d,i){
	    return yScale(d);
	});
    rects.exit().transition().attr("height",0).remove();


}

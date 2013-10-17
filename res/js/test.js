var a,b,c,d;
var svg;
$(document).ready(function(){
    a = [1,2,3,4];
    b = [5,6,7,8];
    c = [1,2,3]
    d = [1,2,3,4,5,67,7,34]

    svg = d3.select("#test-container").append("svg");
    svg.attr("height", 200).attr("width", 400);
    popo(a);
});


function popo(data){
    var largest = d3.max(data);

    var yScale = d3.scale.linear()
	.domain([0,largest])
	.range([0,200]);

    var rects = svg.selectAll("rect").data(data);

    var padding = 50;

    var yAxis = d3.svg.axis()
                  .scale(d3.scale.linear().domain([r[1],0]).range([0,200]))
                  .orient("left")
                  .ticks(5);

    svg.append("g")
	.attr("class", "axis")
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
    rects.transition()
	.attr("x", function(d,i){
	    return (i*350/data.length) + 50;
	})
	.attr("y", function(d,i){
	    return yScale(largest-d);
	})
	.attr("width", function(d,i){
	    return 350/data.length;
	})
	.attr("height", function(d,i){
	    return yScale(d);
	});
    rects.exit().transition().attr("height",0).remove();


}

$(document).ready(function(){
    var width = 960,
    height = 500;

    var path = d3.geo.path();

    var svg = d3.select("#choropleth-container").append("svg")
	.attr("width", width)
	.attr("height", height);

    d3.json("/res/data/us.json", function(error, topology) {
	svg.selectAll("path")
	    .data(topojson.feature(topology, topology.objects.states).features)
	    .enter().append("path")
	    .attr("d", path);
    });
});

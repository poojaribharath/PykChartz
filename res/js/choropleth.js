var width = 960;
var height = 500;
var centered;

var state_data = []
for(var i = 0; i < 50; i++) state_data.push(Math.random());

var county_data = []
for(var i = 0; i < 5000; i++) county_data.push(Math.random());


$(document).ready(function(){
    var path = d3.geo.path();

    var svg = d3.select("#choropleth-container").append("svg")
	.attr("width", width)
	.attr("height", height);

    var g = svg.append("g");

    d3.json("/res/data/us.json", function(error, topology) {
	g.selectAll("path")
	    .data(topojson.feature(topology, topology.objects.states).features)
	    .enter().append("path").attr("class", "state")
	    .attr("d", path)
	    .attr("style", function(d, i){
		return "opacity: " + state_data[i];
	    })
	    .on("click", zoom);


	function zoom(d){
	    console.log(d);
	    var x, y, k;

	    var centroid = path.centroid(d);
	    x = centroid[0];
	    y = centroid[1];
	    k = 4;
	    centered = d;


	    g.selectAll("path").remove();

	    g.selectAll("path")
		.data(topojson.feature(topology, topology.objects.counties).features)
		.enter().append("path").attr("class", "county")
		.attr("d", path)
		.attr("style", function(d, i){
		    return "opacity: " + county_data[i];
		})
		.on("click", unzoom);

	    g.selectAll("path")
		.data(topojson.feature(topology, topology.objects.states).features)
		.enter().append("path").attr("class", "state")
		.attr("d", path)
		.attr("style", function(d, i){
		    return "fill: transparent";
		})
		.on("click", zoom);

	    g.transition()
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
		.style("stroke-width", 1.5 / k + "px");
	}

	function unzoom(d){
	    var x,y,k;
	    x = width/2;
	    y = height/2;
	    k = 1;

	    g.selectAll("path").remove();

	    g.selectAll("path")
		.data(topojson.feature(topology, topology.objects.states).features)
		.enter().append("path").attr("class", "state")
		.attr("d", path)
		.attr("style", function(d, i){
		    return "opacity: " + state_data[i];
		})
		.on("click", zoom);

	    g.transition()
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
		.style("stroke-width", 1.5 / k + "px");

	}

    });
});

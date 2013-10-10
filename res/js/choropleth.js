var width = 960;
var height = 500;
var centered;

var state_data = []
for(var i = 0; i < 50; i++) state_data.push(Math.random());

var county_data = []
for(var i = 0; i < 10000; i++) county_data.push(Math.random());


$(document).ready(function(){
    var path = d3.geo.path();

    var svg = d3.select("#choropleth-container").append("svg")
	.attr("width", width)
	.attr("height", height);

    var counties_g = svg.append("g").attr("class","counties");
    var states_g = svg.append("g").attr("class","states");

    d3.json("/res/data/us.json", function(error, topology) {

	counties_g.selectAll("path")
	    .data(topojson.feature(topology, topology.objects.counties).features)
	    .enter().append("path").attr("class", "county")
	    .attr("d", path)
	    .attr("style", function(d, i){
		return "opacity: " + county_data[i];
	    })
	    .on("click", unzoom);

	states_g.selectAll("path")
	    .data(topojson.feature(topology, topology.objects.states).features)
	    .enter().append("path").attr("class", "state")
	    .attr("d", path)
	    .attr("style", function(d, i){
		return "opacity: " + state_data[i];
	    })
	    .attr("data-heat", function(d, i){
		return state_data[i];
	    })
	    .on("click", zoom);

	$("g.counties").hide();

	function zoom(d){
	    var x, y, k;

	    var centroid = path.centroid(d);
	    x = centroid[0];
	    y = centroid[1];
	    k = 4;
	    centered = d;

	    $("g.states path").css("fill", "none");
	    $("g.states path").animate({opacity: 1});
	    $("g.states path").css("stroke-width", "3px");
	    $("g.states path").css("stroke", "#fff");
	    $("g.counties").fadeIn();


	    counties_g.transition()
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");


	    states_g.transition()
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");
	}

	function unzoom(d){
	    var x,y,k;
	    x = width/2;
	    y = height/2;
	    k = 1;
	    $("g.counties").fadeOut();
	    $("g.states path").css("fill", "#000");
	    $("g.states path").css("stroke-width", "0");
	    $("g.states path").css("opacity", function(){
		return $(this).attr("data-heat");
	    });

	    states_g.transition()
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

	    counties_g.transition()
		.duration(750)
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");


	}

    });
});

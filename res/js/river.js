$(document).ready(function(){
    data = crossfilter(getData());

    states = data.dimension(function(d){ return d.state; });

    statePopulation = states.group().reduceSum(function(d){
            return d.population;
    });

    time = data.dimension(function(d){
        return d.year;
    });

    timePopulation = time.group().reduceSum(function(d){
       return d.population;
    });

    d3.json("res/us.json", function(json){
        dataBar = dc.barChart("#dc-bar").width(460).height(260)
            .dimension(time)
            .margins({top: 10, right: 10, bottom: 20, left: 100})
            .group(timePopulation)
            .elasticY(true)
            .centerBar(true)
            .x(d3.scale.linear().domain([1950, 2013]))
            .transitionDuration(1000);

        var dataTable = dc.dataTable("#dc-table").width(460).height(460)
            .dimension(time)
        	.group(function(d) { return ""})
        	.size(10)
            .columns([
              function(d) { return d.state; },
              function(d) { return d.population; },
              function(d) { return d.year; },
            ])
            .sortBy(function(d){ return d.year; })
            .order(d3.ascending);

        var dc_map = dc.geoChoroplethChart("#dc-map")
            .width(940)
            .height(500)
            .transitionDuration(1000)
            .dimension(states)
            .group(statePopulation)
            .colors(["#CCCCCC", "#E2F2FF","#C4E4FF","#9ED2FF","#81C5FF","#6BBAFF","#51AEFF","#36A2FF","#1E96FF","#0089FF","#0061B5"])
            .colorDomain([1000000, 10000000])
            .overlayGeoJson(json.features, "state", function(d){
                return d.properties.name
            });

        dc.filterAll();
        dc.renderAll();
    });
});

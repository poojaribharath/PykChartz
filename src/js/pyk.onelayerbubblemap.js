/* jshint -W069 */

PykCharts.BubbleMap = function (options) {

    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------
    this.execute = function () {
        // Assign Global variable var that to access function and variable throughout   
        var that = this;

        //---- Reading First Data file
        d3.csv(options.data1, function (file1Dataset){

            that.extractFile1(file1Dataset);
            
            //---- Reading Second Data file
            d3.csv(options.data2, function (file2Dataset){

                that.extractFile2(file2Dataset);
                that.render(that);
                that.renderTooltip();
            });
        });
    };

    //----------------------------------------------------------------------------------------
    //2. Render function to create the chart
    //----------------------------------------------------------------------------------------
    this.render = function(that) {

        //--- Color Pallete: Cherry Cheesecake (https://kuler.adobe.com/Cherry-Cheesecake-color-theme-2354/)
        var BUBBLEFILL = '#BD8D46',
            RED = '#B9121B',
            GDPCOLOR = '#4C1B1B',
            BUBBLESTROKE = '#F6E497',
            INITIALCOLOR = '#FCFAE1';

        //----- Obtaining default width and setting height to 1160 (just a convenient number)
        var width = parseInt($(options.selection).css('width')),
            height = parseInt($(options.selection).css('height')) || screen.availHeight;

        //--- To scale down the size of bubbles and the map for smaller div elements
        var SCALEFACTOR = width / screen.availWidth;

        //----- Legends holder
        var legendsHolder = d3.select(options.selection).append("svg")
            .attr("width", width)
            .attr("height", 60);

        //----- SVG holder
        var svg = d3.select(options.selection).append("svg")
            .attr("width", width)
            .attr("height", height);

        //----- Title
        legendsHolder.append('text')
            .text('Gross Domestic Product')
            .attr('x', 50)
            .attr('y', 35);

        //----- Legends
        var legends = legendsHolder.append('g')
            .attr('transform', 'translate(' + parseInt(width - 400) + ',15)');

        legends.append('circle')
            .attr('cx', 100)
            .attr('cy', 15)
            .attr('r', 5)
            .attr('fill', GDPCOLOR);

        legends.append('text')
            .text('GDP')
            .attr('x', 120)
            .attr('y', 20);

        legends.append('circle')
            .attr('cx',200)
            .attr('cy', 15)
            .attr('r', 5)
            .attr('fill', RED);

        legends.append('text')
            .text('Undefined')
            .attr('x', 220)
            .attr('y', 20);


        //---- Map projection configuration
        var projection = d3.geo.mercator()
            .scale(200 * SCALEFACTOR)
            .translate([width / 2, height / 2]);

        //---- Path generator
        var path = d3.geo.path()
            .projection(projection);


        /** 
        * Bubbles for file1
        * Color opacity for file2
        */
        var radius = d3.scale.linear().domain([that.gdp1Values[0], that.gdp1Values[that.gdp1Values.length-1]]).range([1, 10]);
        var opacity = d3.scale.linear().domain([that.gdp2Values[0],that.gdp2Values[that.gdp2Values.length-1]]).range([0.1, 1]);
        //--- Reading TopoJSON file
        d3.json("res/data/world.json", function (error, world) {
            var countries = svg.selectAll("path")
                .data(topojson.feature(world, world.objects.subunits).features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr('fill', INITIALCOLOR)
                .style('opacity', 1)
                // Associating tooltip to mouse events
                .on("mouseover", function(d, i){
                    var tooltip = d3.select("#world-tooltip");
                    tooltip.html('<div> Dataset2 </div>' + '<div>' + '<div>' + d.properties.name + '</div>' + '<div>' + that.file2gdp[d.properties.id] + '</div>');
                    tooltip.style("visibility", "visible");
                })
                .on("mousemove", function(){
                    var tooltip = d3.select("#world-tooltip");
                    var yReduce = parseInt(tooltip.style("height")) + 40;
                    var xReduce = parseInt(tooltip.style("width")) / 2;
                    tooltip.style("top", (d3.event.pageY- yReduce)+"px").style("left",(d3.event.pageX-xReduce)+"px");
                })
                .on("mouseout", function(){
                    var tooltip = d3.select("#world-tooltip");
                    tooltip.style("visibility", "hidden");
                });

            var bubbles = svg.selectAll("circle")
                .data(topojson.feature(world, world.objects.subunits).features)
                .enter()
                .append('circle')
                .attr('r', 0)
                .attr('cx', function(d){
                    return path.centroid(d)[0];
                })
                .attr('cy', function(d){
                    return path.centroid(d)[1];
                })
                .attr('fill',BUBBLEFILL)
                .attr('stroke', BUBBLESTROKE)
                .on("mouseover", function(d, i){
                    var tooltip = d3.select("#world-tooltip");
                    tooltip.html('<div> Dataset1 </div>' + '<div>' + d.properties.name + '</div>' + '<div>' + that.file1gdp[d.properties.id] + '</div>');
                    tooltip.style("visibility", "visible");
                })
                .on("mousemove", function(){
                    var tooltip = d3.select("#world-tooltip");
                    var yReduce = parseInt(tooltip.style("height")) + 40;
                    var xReduce = parseInt(tooltip.style("width")) / 2;
                    tooltip.style("top", (d3.event.pageY- yReduce)+"px").style("left",(d3.event.pageX-xReduce)+"px");
                })
                .on("mouseout", function(){
                    var tooltip = d3.select("#world-tooltip");
                    tooltip.style("visibility", "hidden");
                });

            countries.transition()
                .delay(0)
                .duration(1000)
                .ease('bounce')
                .attr('fill', function (d, i) {
                    // GDP info available
                    if (that.file2gdp[d.properties.id]) {
                        return GDPCOLOR;
                    }

                    // else undefined, hence return red
                    else {
                        // console.log(d.properties.name + ' doesnot have GDP info');
                        return RED;
                    }
                })
                .style('opacity', function (d, i) {
                    if (opacity(that.file2gdp[d.properties.id])) {
                        return opacity(that.file2gdp[d.properties.id]);
                    }
                    else
                    {
                        return 1;
                    }
                });

            bubbles.transition()
            .delay(2000)
            .duration(3000)
            .ease('bounce')
            .attr('r', function(d){
                    if (that.file1gdp[d.properties.id]) {
                        return (radius(that.file1gdp[d.properties.id]) * SCALEFACTOR);
                    }
                    else
                        return 0;
            });
        });
    };

    this.renderTooltip = function () {
        //----- Adding tooltip to the DOM
        $("#world-tooltip").remove();
        d3.select(options.selection)
            .append("div").attr("id","world-tooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("background", "#fff")
            .style("padding", "10px 20px")
            .style("box-shadow", "0 0 10px #000")
            .style("border-radius", "5px")
            .text("a simple tooltip");
    };

    this.extractFile1 = function (data) {
        //-- 1.3 Data extraction logic from the first file resides here
        this.file1gdp = [];
        this.gdp1Values = [];
        for(var i = 0; i < data.length; ++i){
            //-- 1.4 A hash having country codes as keys and gdp as values.
            //-- This is to fix the inconsistencies in country codes (whose nature is uknown) found in the CSV file and those in the topoJSON.
            this.file1gdp[data[i]['CountryCode']] = data[i]['GDP'];
            this.gdp1Values[i] = data[i]['GDP'];
            
        }
    };

    this.extractFile2 = function (data) {
        //-- Data extraction logic from the second file resides here
        this.file2gdp = [];
        this.gdp2Values = [];
        for(var i = 0; i < data.length; ++i){
            //-- A hash having country codes as keys and gdp as values
            //-- This is to fix the inconsistencies in country codes (whose nature is uknown) found in the CSV file and those in the topoJSON.
            this.file2gdp[data[i]['CountryCode']] = data[i]['GDP']; 
            this.gdp2Values[i] = data[i]['GDP'];
        }
    };
};
PykCharts.choroplethOneLayer = function(options){
    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------

    this.execute = function(){
    //1.1 Validate the options passed
        if(!this.validate_options()) { return false; }

        // 1.2 Preload animation
        $(this.options.selection).html("<img src='https://s3.amazonaws.com/PykCharts/spinner.gif'> Loading... Please wait");

        //1.3 Assign Global variable var that to access function and variable throughout
        var that = this;
        that.h = this.options.height;
        that.w = this.options.width;
        that.cs = this.options.colorscale;
        that.cc = this.options.colorcode;
        that.color_domain=[];
        that.projectionScale = this.options.projectionScale;
        that.projectionTranslateX = this.options.projectionTranslateX;
        that.projectionTranslateY = this.options.projectionTranslateY;

        var opt = this.options;


        // //1.3 Read Json File Get all the data and pass to render
        d3.json(opt.topojson, function(e, topology){
            d3.json(opt.geo_data, function(e, geo_data){
                that.render(topology, geo_data);
            });
        });
    };

    //----------------------------------------------------------------------------------------
    //2. Validate Options
    //----------------------------------------------------------------------------------------
    this.validate_options = function(){
        if(this.options.selection === undefined) return false;
        if(this.options.topojson === undefined) return false;
        if(this.options.geo_data === undefined) return false;
        if(this.options.width === undefined) return false;
        if(this.options.height === undefined) return false;
        if(this.options.colorscale === undefined) return false;
        if(this.options.colorcode === undefined) return false;
        return true;
    };

    //----------------------------------------------------------------------------------------
    //3. Assigning Attributes
    //----------------------------------------------------------------------------------------
    this.options = jQuery.extend({
        scale: 5,
        initScale: 1.0
    }, options);


    //----------------------------------------------------------------------------------------
    //4. Render function to create the chart
    //----------------------------------------------------------------------------------------
   //4.1 Clear existing HTML inside Selection DIV ID
    this.render = function(t, g){
        var that = this;

        $(this.options.selection).html("");

       //4.2 Get the maximum value from data to set ordinal scale
       var key;
        if(that.cs=="ordinal")
        {
            for(key in g)
            {
                that.color_domain.push(g[key].data);
            }
            that.max = d3.max(that.color_domain);
        }
        else if(that.cs=="selector")
        {
            for(key in g);
            {
                that.objkey = key;
            }
            var params = Object.keys(g[that.objkey]);
            that.param = params[0];
        }

        //4.3 Create SVG holders for legends
        this.legends_group = d3.select(this.options.selection).append("svg")
            .attr("class", "pyk-choropleth-legend-holder")
            .attr("height", 50)
            .attr("width", that.w);

        //4.4 Create SVG holders for map
        this.map_group = d3.select(this.options.selection).append("svg")
            .attr("class", "pyk-choropleth-map-holder")
            .attr("width", that.w)
            .attr("height", that.h-100);


        //4.5 Draw the elements after creating the holder
        this.renderTooltip();
        this.draw(t, g);

    };

    //----------------------------------------------------------------------------------------
    //5. Render tooltip
    //----------------------------------------------------------------------------------------
    this.renderTooltip = function(){
        $("#choropleth-tooltip").remove();
        this.tooltip = d3.select("body")
            .append("div").attr("id","choropleth-tooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("background", "#fff")
            .style("padding", "10px 20px")
            .style("box-shadow", "0 0 10px #000")
            .style("border-radius", "5px")
            .text("a simple tooltip");
    };

      //----------------------------------------------------------------------------------------
    // 6.Draw function to render chart with elements:
    //----------------------------------------------------------------------------------------
    this.draw = function(t, g){
        // can pass any object to render the legends
        // TODO Check if 0 will always be an ID
        this.renderLegends(t,g);
        // 6.1 render map with t= topojson data, g= geo data
        this.renderMaps(t, g, function() {
        });

    };

    //----------------------------------------------------------------------------------------
    // 7.Draw function to render Legends:
    //----------------------------------------------------------------------------------------

    this.renderLegends = function(t, g){
        var that = this;
        if(that.cs=="ordinal")
        {
            onetenth = d3.format(".1f")(that.max/10);
            for(var k=1;k<=10;k++)
            {
                legend = d3.round(onetenth * (k + 0.5));
                this.legends_group.append("circle")
                    .attr("cx",k*50)
                    .attr("cy",20)
                    .attr("r",5)
                    .attr("fill","green")
                    .attr("opacity",k/10);
                this.legends_group.append("text")
                    .attr("x", (k*50)+7)
                    .attr("y", 24)
                    .style("font-size", 10)
                    .style("font", "Arial")
                    .text("< "+legend);
            }
        }
        else if(that.cs=="selector")
        {
            var legends = Object.keys(g[that.objkey]);
            var lWidth = this.options.width / legends.length;

            // 7.1 Append clickable text to group element
            var lText = this.legends_group.selectAll("text").data(legends);
            lText.enter().append("text");
            lText
                .attr("y", function(d, i){
                    if(i>2)
                    {
                        return 40;
                    }
                    else
                    {
                        return 15;
                    }
                })
                .attr("x", function(d, i){
                    if(i>2)
                    {
                        return ((i-3)*lWidth) + 25;
                    }
                    else
                    {
                        return (i*lWidth) + 25;
                    }
                })
                .text(function(d, i){
                    // capitalized string
                    return d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
                })
                .on("click", function(d){
                    that.param = d;
                    that.draw(t,g);
                });

            // 7.2 Append clickable circle to group element
            var lCircle = this.legends_group.selectAll("circle").data(legends);
            lCircle.enter().append("circle");
            lCircle
                .attr("cy", function(d, i){
                    if(i>2)
                    {
                        return 35;
                    }
                    else
                    {
                        return 10;
                    }
                })
                .attr("cx", function(d, i){
                    if(i>2)
                    {
                        return ((i-3)*lWidth) + 15;
                    }
                    else
                    {
                        return (i*lWidth) + 15;
                    }
                })
                .attr("r",7)
                .attr("style", function(d, i){
                    var color = (d === that.param) ? "#000" : "#fff";
                    return "stroke-width: 3px; stroke: #000; fill: " + color;
                })
                .on("click", function(d){
                    that.param = d;
                    that.draw(t,g);
                });
        }
    };

    //----------------------------------------------------------------------------------------
    // 8.Draw function to render map:
    //----------------------------------------------------------------------------------------
<<<<<<< HEAD
    this.renderMaps = function(t, g){
        var that = this;
        var projection = d3.geo.mercator()
            .scale(that.projectionScale)
            .translate([that.projectionTranslateX,that.projectionTranslateY]);

        var path = d3.geo.path()
            .projection(projection);

        // 8.1 set scale width and height map and variables to be used to implement ordinal scale
        var scale = this.options.initScale * this.options.scale;

        // 8.2 Set local variable
        var a=0,b=0;

        // 8.3 remove existing group before loading
        var map_group = this.map_group;
        this.map_group.selectAll("g").remove();

        // 8.4 Append geo group
        var geo_g = map_group.append("g").attr("class","states");


        // 8.5 Append geo path
        var geomap = geo_g.selectAll("path")
            .data(topojson.feature(t, t.objects.collection).features)
            .enter().append("path")
            .attr("d", path)
            .attr("data-id", function(d,i){
                return d.id;
            })
            .attr("transform", function(d,i){
                return "scale(" + that.options.initScale + ")";
            })
            .attr("class", function (d,i) {return d.id;})
            .on("mouseover", function (d, i) {
                for(var key in g)
                {
                    if(key==d.id)
                    {
                        var tooltip;
                        if(that.cs=="selector")
                        {
                            tooltip = g[key][that.param].tooltip;
                        }
                        else
                        {
                            tooltip = g[key].tooltip;
                        }
                        that.tooltip.html(tooltip);
                        that.tooltip.style("visibility", "visible");
                        break;
                    }
                }
            })
            .on("mousemove", function(){
                var yReduce = parseInt(that.tooltip.style("height")) + 40;
                var xReduce = parseInt(that.tooltip.style("width")) / 2;
                that.tooltip.style("top", (event.pageY- yReduce)+"px")
                    .style("left",(event.pageX-xReduce)+"px");
            })
            .on("mouseout", function(){
                that.tooltip.style("visibility", "hidden");
            });
        if(that.cs=="selector")
        {
            geomap.attr("data-heat", function(d,i){
                    if(!g[d.id]) return 1;
                    if(!g[d.id][that.param].data) return 1;
                        return g[d.id][that.param].data / 100;
                })
                .attr("data-color", function(d,i){
                    if(!g[d.id]) return "black";
                    return g[d.id][that.param].color;
                })
                .attr("style", function(d, i){
                    if(!g[d.id]) {
                        return;
                    }
                    var color;
                    if(that.param=="population")
                    {
                        color = "#5fa9d5";    
                    }
                    else if(that.param=="growth_rate")
                    {
                        color = "#a3c337";    
                    }
                    else if(that.param=="sex_ratio")
                    {
                        color = "#feaf45";
                    }
                    else if(that.param=="literacy")
                    {
                        color = "#e63240";    
                    }
                    else
                    {
                        color = "#af78be";    
                    }
                    var opacity = 1;
                    if(g[d.id][that.param].data){
                        opacity = that.colorOpacity(g, g[d.id][that.param].data);
                    }
                    return "fill: "+color+"; opacity: "+opacity;
                });
        }
        else
        {
            geomap.attr("fill", function (d, i) {
                if(that.cs=="linear")
                {
                    for(var key in g)
                    {
                        if(key==d.id)
                        {
                            return g[key].color;
                        }
                    }
                }
                else if(that.cs=="ordinal")
                {
                    return that.cc;
                }
            })
            .attr("opacity", function (d, i) {
                if(that.cs=="linear")
                {
                    return 1;
                }
                else if(that.cs=="ordinal")
                {
                    for(var key in g)
                    {
                        if(key==d.id)
                        {
                            a++;
                            return that.colorOpacity(g, g[key].data);
                        }
                    }
                    b++;
                    if(a!=b)
                    {
                        a++;
                        return 0.1;
                    }
                }
            });
        }
    };

    //----------------------------------------------------------------------------------------
    // 9. Do Maths
    //----------------------------------------------------------------------------------------
    this.colorOpacity = function (g, cdata){
        var that = this;
        if(that.cs=="selector")
        {
            geomin = _.min(g, function(d, i){ return g[i][that.param].data; })[that.param].data;
            geomax = _.max(g, function(d, i){ return g[i][that.param].data; })[that.param].data;
            diff = geomax - geomin;
            onetenth = +(d3.format(".2f")(diff/10));
            opacity = (cdata-geomin+onetenth) / diff;
        }
        else
        {
            opacity = d3.format(".1f")(cdata/that.max);
            if(opacity===0.0)
            {
                opacity=0.1;
            }
        }
        return opacity;
    };

    //----------------------------------------------------------------------------------------
    // 10. Return the Chart
    //----------------------------------------------------------------------------------------

    return this;
};
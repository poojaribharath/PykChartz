/*jshint -W083 */
PykCharts.Ultimate = function(options){
    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------
    this.execute = function(){
        // 1.1 Validate the option parameters
       if(!this.validate_options()) return false;

        // 1.2 Preload animation
        $(this.options.selection).html("<img src='https://s3.amazonaws.com/PykCharts/spinner.gif'> Loading... Please wait");

        // 1.3 Global Variable
        var that = this;

        that.source_name = this.options.sourceName;
        that.source_link = this.options.sourceLink;
        that.display_credit = this.options.displayCredit;

        // 1.4 Read the input data file(s)
        d3.json(this.options.data, function(e, data){
            // Assign it to global accesstor variable
            that.data = data;
            // Render Chart with the available data
            that.render();
        });
    };

    //----------------------------------------------------------------------------------------
    //2. Validate Options
    //----------------------------------------------------------------------------------------
    this.validate_options = function(){
        if(this.options.selection === undefined) return false;
        if(this.options.data === undefined) return false;
        if(this.options.width < 300) return false;
        return true;
    };

    //----------------------------------------------------------------------------------------
    //3. Assigning Attributes
    //----------------------------------------------------------------------------------------
    this.options = jQuery.extend({
        width: 960,
        height: 400,
        filterList: [],
        fullList: [],
        extended: false,
        margins: {
            left: 40,
            right: 20,
            top: 10,
            bottom: 80
        }
    }, options);


    //----------------------------------------------------------------------------------------
    //4. Render function to create the chart
    //----------------------------------------------------------------------------------------
    this.render = function(){
        var that = this;
        //4.1 Clear existing HTML inside Selection DIV ID
        $(this.options.selection).html("");

        //4.2 Assign height and width to a local variable because if you are manipulating with h and w then the SVG height and width will not get affected
        var h = this.options.height;
        var w = this.options.width;

        //4.3 SVG Holder for Chart, Legend, ... other elements
        this.svg = d3.select(this.options.selection)
            .append("svg")
            .attr("class", "pyk-ultimate "+this.options.selection.substring(1))
            .attr("height", h+20)
            .attr("width", w);

              //4.4 Add other elements to the SVG Holder
        this.svg.append("g").attr("class", "yaxis");
        this.svg.append("g").attr("class", "xaxis");

        //4.5 Create Legend Holder
        this.legends_group = this.svg.append("g")
            .attr("class", "legend-holder")
            .attr("background", "Red")
            .attr("transform", "translate(0,15)");

        //4.5 Create Chart Holder
        this.chart_group = this.svg.append("g")
            .attr("class", "chart-holder")
            .attr("width", w - (this.options.margins.right + this.options.margins.left))
            .attr("height", h - (this.options.margins.top + this.options.margins.bottom))
            .attr("transform", "translate(" + this.options.margins.left + "," + this.options.margins.top + ")");

        //4.7 Data Manipulations
        var fD = this.flattenData();
        this.the_bars = fD[0];
        this.the_keys = fD[1];
        this.the_layers = this.layers(this.the_bars);

        // Render elements
        this.renderTooltip();
        this.draw();
        renderCredits(this.options.selection.substring(1),$("."+this.options.selection.substring(1)).width(),$("."+this.options.selection.substring(1)).height(),that.source_name,that.source_link,that.display_credit);
    };

    //----------------------------------------------------------------------------------------
    // 5. Rendering Legends:
    //----------------------------------------------------------------------------------------
  this.renderLegends = function(){
        var that = this;
        var w = this.options.width;

        function getParameters(){
            var p = [];
            for(var i in  that.the_layers){
                if(!that.the_layers[i].name) continue;
                var name = that.the_layers[i].name;
                var color = that.the_layers[i].values[0].color;
                p.push({
                    "name": name,
                    "color": color
                });
            }
            return p;
        }

        var params = getParameters();

        var legendGroups = this.legends_group.selectAll("g.legend_group").data(params)
            .enter()
            .append("g")
            .attr("class", "legend_group")
            .attr("transform", function(d,i){
                return "translate(" + (w-(i*100)-100) + ", 0)";
            });

        for(var i in params){
            var g = d3.select(legendGroups[0][i]);
            var p = params[i];

            var texts = g.append("text")
                .text(function(d){
                    return p.name;
                })
                .attr("x", function(d,i){
                    return i * 40;
                })
                .attr("dy", -3);

            var circles = g.append("circle")
                .attr("cx", function(d,i){
                    return (i*100)-10;
                })
                .attr("cy",-6).attr("r", 6)
                .attr("style", function(d){
                    return "fill: "+ d.color +"; stroke-width: 3px; stroke:" + d.color;
                });

        }
        // TODO Make legends
    };

    //----------------------------------------------------------------------------------------
    // 6. Rendering Legends:
    //----------------------------------------------------------------------------------------
    this.getGroups = function(){
        var groups = {};
        for(var i in this.the_bars){
            var bar = this.the_bars[i];
            if(!bar.id) continue;
            if(groups[bar.group]){
                groups[bar.group].push(bar.id);
            }else{
                groups[bar.group] = [bar.id];
            }
        }
        return groups;
    };

    //----------------------------------------------------------------------------------------
    // 7. Rendering chart:
    //----------------------------------------------------------------------------------------
    this.renderChart = function(){
        var that = this;
        var w = this.chart_group.attr("width");
        var h = this.chart_group.attr("height");

        var the_bars = this.the_bars;
        var keys = this.the_keys;
        var layers = this.the_layers;
        var groups= this.getGroups();

        var stack = d3.layout.stack() // Create default stack
            .values(function(d){ // The values are present deep in the array, need to tell d3 where to find it
                return d.values;
            })(layers);

        var yValues = [];
        layers.map(function(e, i){ // Get all values to create scale
            for(i in e.values){
                var d = e.values[i];
                yValues.push(d.y + d.y0); // Adding up y0 and y to get total height
            }
        });

        var xScale = d3.scale.ordinal()
            .domain(the_bars.map(function(e, i){
                return e.id || i; // Keep the ID for bars and numbers for integers
            }))
            .rangeBands([0,w], 0.2);

        var yScale = d3.scale.linear().domain([0,d3.max(yValues)]).range([that.options.margins.top, h]).nice();
        var yScaleInvert = d3.scale.linear().domain([d3.max(yValues), 0]).range([that.options.margins.top, h]).nice(); // For the yAxis
        var zScale = d3.scale.category10();


        var yAxis = d3.svg.axis()
            .scale(yScaleInvert)
            .tickSize(-w, 0, 0)
            .orient("left");

        var xAxis = d3.svg.axis()
            .scale(xScale)
            .tickSize(-h, 0, 0)
            .tickFormat(function(d){
                if(!keys[d]) return;
                return keys[d];
            })
            .orient("bottom");

        this.svg.select("g.yaxis").transition(1000)
            .attr("transform", "translate("+ this.options.margins.left +", " + this.options.margins.top + ")")
            .call(yAxis);


        var translateY = parseInt(this.options.margins.top) + parseInt(h);

        this.svg.select("g.xaxis").transition(1000)
            .attr("transform", "translate("+ this.options.margins.left +", " + translateY + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "start")
            .attr("dy", "2px")
            .attr("dx", "20px")
            .attr("transform", function(d) {
                return "rotate(90)";
            });


        var group_label_data = [];
        for(var i in groups){
            var g = groups[i];
            var x = xScale(g[0]);
            var totalWidth = xScale.rangeBand() * g.length;
            x = x + (totalWidth/2);
            group_label_data.push({x: x, name: i});
        }

        this.svg.selectAll("text.group_label").data(group_label_data).enter()
            .append("text").attr("class", "group_label")
            .attr("x", function(d){
                return d.x + that.options.margins.left;
            })
            .attr("y", function(d){
                return parseInt(h) + 24;
            })
            .attr("text-anchor", "middle")
            .text(function(d){
                return d.name;
            });


        var bars = this.chart_group.selectAll("g.bars")
            .data(layers).enter().append("g")
            .attr("class", "bars");

        var rect = bars.selectAll("rect")
            .data(function(d){
                return d.values;
            }).enter().append("svg:rect")
            .attr("height", 0).attr("y", h)
            .on("mouseover", function(d, i){
                 var tooltip = d3.select("#pyk-ultimate-tooltip");
                tooltip.html(d.tooltip);
                tooltip.style("visibility", "visible");
            })
            .attr("fill", function(d){
                return d.color;
            })
            .on("mousemove", function(){
                      var tooltip = d3.select("#pyk-ultimate-tooltip");
           var yReduce = parseInt(tooltip.style("height")) + 40;
                var xReduce = parseInt(tooltip.style("width")) / 2;
                tooltip.style("top", (d3.event.pageY- yReduce)+"px").style("left",(d3.event.pageX-xReduce)+"px");
            })
            .on("mouseout", function(){
                 var tooltip = d3.select("#pyk-ultimate-tooltip");
                tooltip.style("visibility", "hidden");
            });

        rect.transition().duration(1000).attr("x", function(d){
                return xScale(d.x);
            })
            .attr("width", function(d){
                return xScale.rangeBand();
            })
            .attr("height", function(d){
                return yScale(d.y);
            })
            .attr("y", function(d){
                return h - yScale(d.y0 + d.y);
            });
    };

    //----------------------------------------------------------------------------------------
    // 8. Draw function to render chart with elements
    //----------------------------------------------------------------------------------------
    this.draw = function(){
        this.renderLegends();
        this.renderChart();
    };

    //----------------------------------------------------------------------------------------
    // 9. Rendering tooltip:
    //----------------------------------------------------------------------------------------
    this.renderTooltip = function(){
        $("#pyk-ultimate-tooltip").remove();
        this.tooltip = d3.select("body")
            .append("div").attr("id","pyk-ultimate-tooltip")
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
    // 10.Data Manuplation:
    //----------------------------------------------------------------------------------------

    // Data Helpers
    // Takes the flattened data and returns layers
    // Each layer is a separate category
    // The structure of the layer is made so that is plays well with d3.stack.layout()
    // Docs - https://github.com/mbostock/d3/wiki/Stack-Layout#wiki-values
    this.layers = function(the_bars){
        var layers = [];

        function findLayer(l){
            for(var i in layers){
                var layer = layers[i];
                if (layer.name == l) return layer;
            }
            return addLayer(l);
        }

        function addLayer(l){
            var new_layer = {
                "name": l,
                "values": []
            };
            layers.push(new_layer);
            return new_layer;
        }

        for(var i in the_bars){
            var bar = the_bars[i];
            if(!bar.id) continue;
            var id = bar.id;
            for(var k in bar){
                if(k === "id") continue;
                var icings = bar[k];
                for(var j in icings){
                    var icing = icings[j];
                    if(!icing.name) continue;
                    var layer = findLayer(icing.name);
                    layer.values.push({
                        "x": id,
                        "y": icing.val,
                        "color": icing.color,
                        "tooltip": icing.tooltip
                    });
                }
            }
        }
        return layers;
    };

    // Traverses the JSON and returns an array of the 'bars' that are to be rendered
    this.flattenData = function(){
        var the_bars = [-1];
        var keys = {};
        for(var i in this.data){
            var d = this.data[i];
            for(var cat_name in d){
                for(var j in d[cat_name]){
                    var id = "i" + i + "j" + j;
                    var key = Object.keys(d[cat_name][j])[0];

                    keys[id] = key;
                    d[cat_name][j].id = id;
                    d[cat_name][j].group = cat_name;

                    the_bars.push(d[cat_name][j]);
                }
                the_bars.push(i); // Extra seperator element for gaps in segments
            }
        }
        return [the_bars, keys];
    };

    //----------------------------------------------------------------------------------------
    // 11.Return Chart:
    //----------------------------------------------------------------------------------------

    return this;
};

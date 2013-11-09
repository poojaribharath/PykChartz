PykCharts.Ultimate = function (options) {

    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------
    this.execute = function () {
        if (!this.validate_options()) return false; // 1.1 Validate the option parameters
        $(this.options.selection).html("<img src='css/img/spinner.gif'> Loading... Please wait"); // 1.2 Preload animation
        var that = this; // 1.3 Global Variable
console.log("called");

        // 1.4 Read the input data file(s)
        d3.json(this.options.data, function (e, data) {

            // Assign it to global accesstor variable
            that.data = data;

            // Render Chart with the available data
            that.render();
        });
    }

    //----------------------------------------------------------------------------------------
    //2. Validate Options
    //----------------------------------------------------------------------------------------
    this.validate_options = function () {
        if (this.options.selection == undefined) return false;
        if (this.options.data == undefined) return false;
        if (this.options.height == undefined) return false;
        if (this.options.width == undefined) return false;
        if (this.options.width < 300) return false;
        return true;
    }

    //----------------------------------------------------------------------------------------	
    //3. Assigning Attributes
    //----------------------------------------------------------------------------------------
    this.options = jQuery.extend({
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
    this.render = function () {

        //4.1 Clear existing HTML inside Selection DIV ID
        $(this.options.selection).html("");

        //4.2 Assign height and width to a local variable because if you are manipulating with h and w then the SVG height and width will not get affected
        var h = this.options.height;
        var w = this.options.width;

        //4.3 SVG Holder for Chart, Legend, ... other elements
        this.svg = d3.select(this.options.selection)
            .append("svg")
            .attr("class", "pyk-ultimate")
            .attr("height", h)
            .attr("width", w);

        //4.4 Add other elements to the SVG Holder
        this.svg.append("g").attr("class", "yaxis");
        this.svg.append("g").attr("class", "xaxis");

        //4.5 Create Chart Holder
        this.chart_group = this.svg.append("g")
            .attr("class", "chart-holder")
            .attr("width", w - (this.options.margins.right + this.options.margins.left))
            .attr("height", h - (this.options.margins.top + this.options.margins.bottom))
            .attr("transform", "translate(" + this.options.margins.left + "," + this.options.margins.top + ")");

        //4.6 Create Legend Holder (optional)
        this.legends_group = this.svg.append("g")
            .attr("class", "legend-holder")
            .attr("transform", "translate(0,15)");

        //4.7 Data Manipulations
        var fD = this.rawdata_to_chartdata();
        this.the_bars = fD[0];
        this.the_keys = fD[1];
        this.the_layers = this.layers(this.the_bars);

        // Render elements
        this.renderTooltip();
        this.draw();
    }

    //----------------------------------------------------------------------------------------
    // 5. Data Manipulations: 
    //----------------------------------------------------------------------------------------
    // Traverses the JSON and returns an array of the 'bars' that are to be rendered
    this.rawdata_to_chartdata = function () {
        var the_bars = [-1];
        var keys = {};
        for (i in this.data) {
            var d = this.data[i];
            for (cat_name in d) {
                for (j in d[cat_name]) {
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
    }

    //----------------------------------------------------------------------------------------
    // 6.Render Tooltip: 
    //----------------------------------------------------------------------------------------
    this.renderTooltip = function () {
        $("#pyk-ultimate-tooltip").remove();
        this.tooltip = d3.select("body")
            .append("div").attr("id", "pyk-ultimate-tooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("background", "#fff")
            .style("padding", "10px 20px")
            .style("box-shadow", "0 0 10px #000")
            .style("border-radius", "5px")
            .text("a simple tooltip");
    }
	
    //----------------------------------------------------------------------------------------
    // 7.Draw function to render chart with elements: 
    //----------------------------------------------------------------------------------------
    this.draw = function () {
        //7.1 call renderLegends function whihc builds the legends for charts
        this.renderLegends();
        //7.2 call renderLegends function whihc builds the legends for charts
        this.renderChart();
    }
	
    //----------------------------------------------------------------------------------------
    // 8.Render Emements: 
    //----------------------------------------------------------------------------------------
    //Render legends
    this.renderLegends = function () {
        var that = this;

        function getParameters() {
            var p = []
            for (i in that.the_layers) {
                if (!that.the_layers[i].name) continue;
                p.push(that.the_layers[i].name);
            }
            return p;
        }
        // TODO Make legends
    }

    //8a make bars for the chats
    this.getGroups = function () {
        var groups = {};
        for (i in this.the_bars) {
            var bar = this.the_bars[i];
            if (!bar.id) continue;
            if (groups[bar.group]) {
                groups[bar.group].push(bar.id);
            } else {
                groups[bar.group] = [bar.id];
            }
        }
        return groups;
    }

    //----------------------------------------------------------------------------------------
    // 9.Render Chart: 
    //----------------------------------------------------------------------------------------
    this.renderChart = function () {
        var that = this;

        //9.1 Assign height and width to a local variable because if you are manipulating with h and w then the SVG height and width will not get affected
        var w = this.chart_group.attr("width");
        var h = this.chart_group.attr("height");

        var the_bars = this.the_bars;
        var keys = this.the_keys;
        var layers = this.the_layers;
        var groups = this.getGroups();

        //9.2 Set layout as Stack layout
        var stack = d3.layout.stack() // Create default stack
        .values(function (d) { // The values are present deep in the array, need to tell d3 where to find it
            return d.values;
        })(layers);

        //9.3 Get json values into variable to check min & max
        var yValues = []
        layers.map(function (e, i) { // Get all values to create scale
            for (i in e.values) {
                var d = e.values[i];
                yValues.push(d.y + d.y0); // Adding up y0 and y to get total height
            }
        });

        //9.4 Set xscale 
        var xScale = d3.scale.ordinal()
            .domain(the_bars.map(function (e, i) {
                return e.id || i; // Keep the ID for bars and numbers for integers
            }))
            .rangeBands([0, w], 0.2);

        //9.5 Set yscale with domain as max of yvalues & range as available height 
        var yScale = d3.scale.linear().domain([0, d3.max(yValues)]).range([that.options.margins.top, h]).nice();
        var yScaleInvert = d3.scale.linear().domain([d3.max(yValues), 0]).range([that.options.margins.top, h]).nice(); // For the yAxis
        var zScale = d3.scale.category10();

        //9.6 Set yaxis with inverted yscale to display   
        var yAxis = d3.svg.axis()
            .scale(yScaleInvert)
            .tickSize(-w, 0, 0)
            .orient("left");

        //9.7 Set xaxis with xscale   
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .tickSize(-h, 0, 0)
            .tickFormat(function (d) {
                if (!keys[d]) return;
                return keys[d];
            })
            .orient("bottom");

        //9.8 Display yaxis   
        this.svg.select("g.yaxis").transition(1000)
            .attr("transform", "translate(" + this.options.margins.left + ", " + this.options.margins.top + ")")
            .call(yAxis);


        var translateY = parseInt(this.options.margins.top) + parseInt(h);

        //9.8 Display xaxis  
        this.svg.select("g.xaxis").transition(1000)
            .attr("transform", "translate(" + this.options.margins.left + ", " + translateY + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "start")
            .attr("dy", "2px")
            .attr("dx", "20px")
            .attr("transform", function (d) {
                return "rotate(90)"
            });;


        var group_label_data = [];
        for (i in groups) {
            var g = groups[i];
            var x = xScale(g[0]);
            var totalWidth = xScale.rangeBand() * g.length;
            var x = x + (totalWidth / 2);
            group_label_data.push({
                x: x,
                name: i
            });
        }

        //9.8 Append bottom text labels  
        this.svg.selectAll("text.group_label").data(group_label_data).enter()
            .append("text").attr("class", "group_label")
            .attr("x", function (d) {
                return d.x + that.options.margins.left;
            })
            .attr("y", function (d) {
                return parseInt(h) + 24;
            })
            .attr("text-anchor", "middle")
            .text(function (d) {
                return d.name;
            });

        //9.8 Append group bars with which rect can be attached  
        var bars = this.chart_group.selectAll("g.bars")
            .data(layers).enter().append("g")
            .attr("class", "bars");

        //9.8 Append rect to group bars   
        var rect = bars.selectAll("rect")
            .data(function (d) {
                return d.values
            }).enter().append("svg:rect")
            .attr("height", 0).attr("y", h)
            .on("mouseover", function (d, i) {
                that.tooltip.html(d.tooltip);
                that.tooltip.style("visibility", "visible");
            })
            .attr("fill", function (d) {
                return d.color;
            })
            .on("mousemove", function () {
                var yReduce = parseInt(that.tooltip.style("height")) + 40;
                var xReduce = parseInt(that.tooltip.style("width")) / 2;
                that.tooltip.style("top", (event.pageY - yReduce) + "px").style("left", (event.pageX - xReduce) + "px");
            })
            .on("mouseout", function () {
                that.tooltip.style("visibility", "hidden");
            });

        //9.8 Display rect bar with respect to scale   
        rect.transition().duration(1000).attr("x", function (d) {
            return xScale(d.x);
        })
            .attr("width", function (d) {
                return xScale.rangeBand();
            })
            .attr("height", function (d) {
                return yScale(d.y);
            })
            .attr("y", function (d) {
                return h - yScale(d.y0 + d.y);
            });
    }

    //----------------------------------------------------------------------------------------
    // 10.Data Manuplation 
    //---------------------------------------------------------------------------------------- 
    // Data Helpers
    // Takes the flattened data and returns layers
    // Each layer is a separate category
    // The structure of the layer is made so that is plays well with d3.stack.layout()
    // Docs - https://github.com/mbostock/d3/wiki/Stack-Layout#wiki-values
    this.layers = function (the_bars) {
        var layers = [];

        function findLayer(l) {
            for (i in layers) {
                var layer = layers[i];
                if (layer.name == l) return layer;
            }
            return addLayer(l);
        }

        function addLayer(l) {
            var new_layer = {
                "name": l,
                "values": []
            }
            layers.push(new_layer);
            return new_layer;
        }

        for (i in the_bars) {
            var bar = the_bars[i];
            if (!bar.id) continue;
            var id = bar.id;
            for (k in bar) {
                if (k === "id") continue;
                var icings = bar[k];
                for (j in icings) {
                    var icing = icings[j];
                    if (!icing.name) continue;
                    var layer = findLayer(icing.name);
                    layer.values.push({
                        "x": id,
                        "y": icing.val,
                        "color": icing.color,
                        "tooltip": icing.tooltip
                    })
                }
            }
        }
        return layers;
    }

    //----------------------------------------------------------------------------------------
    // 11.Return the Chat in this variable: 
    //----------------------------------------------------------------------------------------
    return this;
};
PykCharts.BubblePack = function (options) {

    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------
    this.execute = function () {
        //1.3 Assign Global variable var that to access function and variable throughout   
        var that = this;

        that.source_name = options.sourceName;
        that.source_link = options.sourceLink;
        that.display_credit = options.displayCredit;

        // 1.2 Read Json File Get all the data and pass to render
        d3.json(options.data, function (e, data) {
            that.data = data;
            that.render();
            that.renderTooltip();

        });
    };


    //----------------------------------------------------------------------------------------
    //2. Render function to create the chart
    //----------------------------------------------------------------------------------------
    this.render = function () {
        var that = this;

        // 2.1 Set diameter and color scale
        var diameter = 600,
            format = d3.format(",d"),
            color = d3.scale.category20c();


        // 2.2 Set d3 Layout as bubble
        var bubble = d3.layout.pack()
            .sort(null)
            .size([diameter, diameter])
            .padding(1.5);

        // 2.3 Append Svg holder 
        var svg = d3.select(options.selection).append("svg")
            .attr("width", diameter)
            .attr("height", diameter)
            .attr("class", "bubble");

        var CircleScale = d3.scale.linear()
            .domain([0, 10000])
            .range([0, diameter]);


        d3.json(options.data, function (error, root) {
            var node = svg.selectAll(".node")
                .data(bubble.nodes(classes(root))
                    .filter(function (d) {
                        return !d.children;
                    }))
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });


            node.append("title")
                .text(function (d) {
                    return d.className + ": " + format(d.value);
                });

            node.append("circle")
                .attr("r", function (d) {
                    return d.r;
                })
                .on("mouseover", function (d) {
                    return that.tooltip.html(d.tip).style("visibility", "visible");
                })
            //	.on("mouseover", function(d){return   console.log("tooltip:" + d.tip);})

            .on("mousemove", function () {
                return that.tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
            })

            .on("mouseout", function () {
                return that.tooltip.style("visibility", "hidden");
            })

            .style("fill", function (d) {
                return color(d.packageName);
            });

            node.append("text")
                .attr("dy", ".3em")
                .style("text-anchor", "middle")
                .text(function (d) {
                    return d.className.substring(0, d.r / 3);
                });
        });

        // Returns a flattened hierarchy containing all leaf nodes under the root.
        function classes(root) {
            var classesArray = [];

            function recurse(name, node) {
                if (node.children) node.children.forEach(function (child) {
                    recurse(node.name, child);
                });
                else {

                    classesArray.push({
                        packageName: name,
                        className: node.name,
                        value: node.size,
                        tip: node.ttip,
                        color: node.colors
                    });
                }
            }

            recurse(null, root);
            return {
                children: classesArray
            };
        }

        d3.select(self.frameElement).style("height", diameter + "px");

        renderCredits("bubble",$(".bubble").width(),$(".bubble").height(),that.source_name,that.source_link,that.display_credit);
    };


    //----------------------------------------------------------------------------------------
    //3. Render function to create the chart
    //----------------------------------------------------------------------------------------

    this.renderTooltip = function () {

        $("#pyk-bubble-tooltip").remove();
        this.tooltip = d3.select("body")
            .append("div").attr("id", "pyk-bubble-tooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("background", "#fff")
            .style("padding", "10px 20px")
            .style("box-shadow", "0 0 10px #000")
            .style("border-radius", "5px")
            .text("a simple tooltip");

    };
};
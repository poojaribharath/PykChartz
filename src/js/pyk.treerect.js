PykCharts.treerect = function (options) {


    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------
    this.execute = function () {
        //1.1 Assign Global variable var that to access function and variable throughout   
        var that = this;

        //1.2 set width height to local variable   
        width = this.options.width;
        height = this.options.height;

        that.source_name = this.options.sourceName;
        that.source_link = this.options.sourceLink;
        that.display_credit = this.options.displayCredit;

        // 1.3 Read Json File Get all the data and pass to render
        d3.json(options.data, function (e, data) {
            that.data = data;
            that.render();
            that.renderTooltip();

        });
    };

    //----------------------------------------------------------------------------------------
    //2. setting up options
    //----------------------------------------------------------------------------------------
    this.options = jQuery.extend({
        width: 550,
        height: 400
    }, options);

    //----------------------------------------------------------------------------------------
    //3. Render chart
    //----------------------------------------------------------------------------------------
    this.render = function () {
        var that = this;

        //2.1 Assign height and width to a local variable because if you are manipulating with h and w then the SVG height and width will not get affected
        var w = width - 60,
            h = height - 135,
            x = d3.scale.linear().range([0, w]),
            y = d3.scale.linear().range([0, h]),
            root,
            node;

        //2.2 Set D3 layout as tree layout
        var treemap = d3.layout.treemap()
            .round(false)
            .size([w, h])
            .sticky(true)
            .value(function (d) {
                return d.size;
            });

        //2.3 SVG Holder for Chart
        var svg = d3.select(options.selection).append("div")
            .attr("class", "chart")
            .style("width", w + "px")
            .style("height", h + "px")
            .append("svg:svg")
            .attr("class","pyk-treerect")
            .attr("width", w)
            .attr("height", h+20)
            .append("svg:g")
            .attr("transform", "translate(.5,.5)");

        d3.json(options.data, function (data) {
            node = root = data;

            var nodes = treemap.nodes(root)
                .filter(function (d) {
                    return !d.children;
                });

            //2.4 Append group element to hold chart
            var cell = svg.selectAll("g")
                .data(nodes)
                .enter().append("svg:g")
                .attr("class", "cell")
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });

            //2.5 Append rect element to chart
            cell.append("svg:rect")
                .attr("width", function (d) {
                    return d.dx - 1;
                })
                .attr("height", function (d) {
                    return d.dy - 1;
                })
                .on("mouseover", function (d) {
                    return that.tooltip.html(d.ttip).style("visibility", "visible");
                })
                .on("mousemove", function () {
                    return that.tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
                })
                .on("mouseout", function () {
                    return that.tooltip.style("visibility", "hidden");
                })
                .style("fill", function (d) {
                    return d.colors;
                });


            //2.6 Append logos element to rect
            cell.append("image")
                .attr("xlink:href", function (d) {
                    return d.img;
                })
                .attr("x", 10)
                .attr("y", 7)
                .attr("width", 17.92)
                .attr("height", 16);



            //2.6 Append text element to chart
            cell.append("svg:text")
                .attr("x", function (d) {
                    return d.dx / 2;
                })
                .attr("y", function (d) {
                    return d.dy / 2;
                })
                .attr("dy", ".35em")
                .attr("text-anchor", "middle")
                .text(function (d) {
                    return d.name;
                })
                .attr("fill", "white")
                .style("opacity", function (d) {
                    d.w = this.getComputedTextLength();
                    return d.dx > d.w ? 1 : 0;
                });

        });

        function size(d) {
            return d.size;
        }

        function count(d) {
            return 1;
        }
        renderCredits("pyk-treerect",$(".pyk-treerect").width(),$(".pyk-treerect").height(),that.source_name,that.source_link,that.display_credit);
    };

    //----------------------------------------------------------------------------------------
    //4. Render Tooltip
    //----------------------------------------------------------------------------------------
    this.renderTooltip = function () {

        $("#pyk-tree-tooltip").remove();
        this.tooltip = d3.select("body")
            .append("div").attr("id", "pyk-tree-tooltip")
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
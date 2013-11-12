PykCharts.compare_with_circles = function (options) {

    function truncate(str, maxLength, suffix) {
        if (str.length > maxLength) {
            str = str.substring(0, maxLength + 1);
            str = str.substring(0, Math.min(str.length, str.lastIndexOf(" ")));
            str = str + suffix;
        }
        return str;
    }

    var margin = {
        top: 20,
        right: 200,
        bottom: 0,
        left: 20
    },
        width = options.width,
        height = options.height;

    var start_year = 2007,
        end_year = 2013;

    var c = d3.scale.category20c();

    var x = d3.scale.linear()
        .range([0, width]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(5)
        .orient("top");

    var formatYears = d3.format("0000");
    xAxis.tickFormat(formatYears);

    var svg = d3.select(options.selection).append("svg")
        .attr("class", "pyk-compare_with_circles")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("margin-left", margin.left + "px")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.json(options.data, function (data) {
        x.domain([start_year, end_year]);
        var xScale = d3.scale.linear()
            .domain([start_year, end_year])
            .range([0, width]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + 0 + ")")
            .call(xAxis);

        for (var j = 0; j < data.length; j++) {
            var g = svg.append("g").attr("class", "first row");

            var circles = g.selectAll("circle")
                .data(data[j]['test'])
                .enter()
                .append("circle");

            var text = g.selectAll("text")
                .data(data[j]['test'])
                .enter()
                .append("text");

            var rScale = d3.scale.linear()
                .domain([0, d3.max(data[j]['test'], function (d) {
                    return d[1];
                })])
                .range([2, 12]);

            circles
                .attr("cx", function (d, i) {
                    return xScale(d[0]);
                })
                .attr("cy", j * 30 + 30)
                .attr("r", function (d) {
                    return rScale(d[1]);
                })
                .style("fill", function (d) {
                    return c(j);
                });

            text
                .attr("y", j * 30 + 35)
                .attr("x", function (d, i) {
                    return xScale(d[0]) - 5;
                })
                .attr("class", "value")
                .text(function (d) {
                    return d[1];
                })
                .style("fill", function (d) {
                    return c(j);
                })
                .style("display", "none");

            g.append("text")
                .attr("y", j * 30 + 35)
                .attr("x", width + 20)
                .attr("class", "label")
                .text(truncate(data[j]['name'], 30, "..."))
                .style("fill", function (d) {
                    return c(j);
                })
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);
        };

        function mouseover(p) {
            var g = d3.select(this).node().parentNode;
            d3.select(g).selectAll("circle").style("display", "none");
            d3.select(g).selectAll("text.value").style("display", "block");
        }

        function mouseout(p) {
            var g = d3.select(this).node().parentNode;
            d3.select(g).selectAll("circle").style("display", "block");
            d3.select(g).selectAll("text.value").style("display", "none");
        }
    });

}
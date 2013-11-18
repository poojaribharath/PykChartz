d3.chart("River", {
    initialize: function () {
        this.base.classed("pyk-river", true);
        this.h = this.base.attr("height");
        this.w = this.base.attr("width");

        var axisLinesTopLayer = this.base.append("g").classed("axis-lines-top", true);
        var axisLinesBottomLayer = this.base.append("g").classed("axis-lines-bottom", true);
        var leftAngleLinesLayer = this.base.append("g").classed("left-angle-lines", true);
        var rightAngleLinesLayer = this.base.append("g").classed("right-angle-lines", true);

        this.layer("axisLinesTop", axisLinesTopLayer, {
            dataBind: function (data) {
                return this.selectAll("line.top_line").data(data);
            },

            insert: function () {
                return this.append("line");
            },

            events: {
                "enter": function () {
                    var chart = this.chart();
                    return this.attr("class", "top_line")
                        .attr("x1", 0).attr("x2", chart.w)
                        .attr("y1", function(d, i){
                            return chart.yScale(i * chart.barMargin);
                        })
                        .attr("y2", function(d, i){
                            return chart.yScale(i * chart.barMargin);
                        });
                }
            }
        });

        this.layer("axisLinesBottom", axisLinesBottomLayer, {
            dataBind: function (data) {
                return this.selectAll("line.bottom_line").data(data);
            },

            insert: function () {
                return this.append("line");
            },

            events: {
                "enter": function () {
                    var chart = this.chart();
                    return this.attr("class", "bottom_line")
                        .attr("x1", 0).attr("x2", chart.w)
                        .attr("y1", function(d, i){
                            return chart.yScale((i * chart.barMargin) + chart.barHeight);
                        })
                        .attr("y2", function(d, i){
                            return chart.yScale((i * chart.barMargin) + chart.barHeight);
                        });
                }
            }
        });
    },

    transform: function (d) {
        maxTotal = function(d){
            var totals = [];
            // Get all the breakupTotals in an Array
            for(var i in d) totals.push(d[i].breakupTotal);
            // Sort them in ascending order
            totals = totals.sort(function(a,b){return a - b;});
            // Give the last one
            return totals[totals.length - 1];
        };

        totalInBreakup = function(breakup){
            var total = 0;
            // Add all the counts in breakup to total
            for(var i in breakup) total += breakup[i].count;
            return total;
        };

        // Calculate all breakup totals and add to the hash
        for(var i in d) d[i].breakupTotal = totalInBreakup(d[i].breakup);

        this.maxTotal = maxTotal(d);

        this.xScale = d3.scale.linear().domain([0, this.maxTotalVal]).range([0, this.w - 200]);
        this.yScale = d3.scale.linear().domain([0, this.h]).range([20, this.h]);
        this.barHeight = (this.h) / (d.length * 2);
        this.barMargin = this.barHeight * 2;


        return d;
    }
});

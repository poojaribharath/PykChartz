d3.chart("River", {
    initialize: function () {
        this.base.classed("pyk-river", true);
        var h = this.base.attr("height");
        var w = this.base.attr("width");

        var axisLinesLayer = this.base.append("g").classed("axis-lines", true);

        this.layer("axisLines", axisLinesLayer, {
            dataBind: function (data) {
                var chart = this.chart();
                chart.xScale = d3.scale.linear().domain([0, this.maxTotalVal]).range([0, w - 200]);
                chart.yScale = d3.scale.linear().domain([0, h]).range([20, h]);
                chart.barHeight = (h) / (data.length * 2);
                chart.barMargin = chart.barHeight * 2;

                return this.selectAll("line.top_line").data(data);
            },

            insert: function () {
                var chart = this.chart();

                return this.append("line").attr("class", "top_line")
                    .attr("x1", 0).attr("x2", w)
                    .attr("y1", function(d, i){
                        return chart.yScale(i * chart.barMargin);
                    })
                    .attr("y2", function(d, i){
                        return chart.yScale(i * chart.barMargin);
                    });
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
        return d;
    }
});

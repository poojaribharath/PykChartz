PykCharts = {};
var renderCredits = function(c,w,h,t,l){
    var b = true;
    var credits;
    if(b===true){
        d3.select("svg."+c)
            .append("text")
            .attr("x",10)
            .attr("y",h-2)
            .attr("font-size",11)
            .attr("fill","gray")
            .text("Visualization by");
        credits = d3.select("svg."+c)
            .append("a")
            .attr("xlink:href","http://pykih.com")
            .attr("target","_blank");
        credits.append("text")
            .attr("x",87)
            .attr("y",h-2)
            .attr("font-size",11)
            .attr("fill","blue")
            .style("text-decoration","underline")
            .text("pykih.com");
    }
    if(t==="" && l!==""){
        credits = d3.select("svg."+c)
            .append("a")
            .attr("xlink:href",l);
            .attr("target","_blank");
        credits.append("text")
            .attr("x",w-100)
            .attr("y",h-2)
            .attr("font-size",11)
            .attr("fill","blue")
            .style("text-decoration","underline")
            .text("Source");
    }
    else if(t!=="" && l===""){
        d3.select("svg."+c)
            .append("text")
            .attr("x",w-100)
            .attr("y",h-2)
            .attr("font-size",11)
            .attr("fill","gray")
            .text("Source: "+t);
    }
    else if(t!=="" && l!==""){
        d3.select("svg."+c)
            .append("text")
            .attr("x",w-100)
            .attr("y",h-2)
            .attr("font-size",11)
            .attr("fill","gray")
            .text("Source:");
        credits = d3.select("svg."+c)
            .append("a")
            .attr("xlink:href",l);
            .attr("target","_blank");
        credits.append("text")
            .attr("x",w-60)
            .attr("y",h-2)
            .attr("font-size",11)
            .attr("fill","blue")
            .style("text-decoration","underline")
            .text(t);
    }
};

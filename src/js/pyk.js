PykCharts = {};
var renderCredits = function(c,w,h,t,l){
    var b = true;
    var credits;
    if(b===true){
        d3.select("svg."+c)
            .append("text")
            .attr("x",10)
            .attr("y",h-2)
            .text("Visualization by")
            .attr("class","pyk-credits");
        credits = d3.select("svg."+c)
            .append("a")
            .attr("xlink:href","http://pykih.com")
            .attr("target","_blank");
        credits.append("text")
            .attr("x",87)
            .attr("y",h-2)
            .text("pykih.com")
            .attr("class","pyk-credits");
    }
    if(t==="" && l!==""){
        credits = d3.select("svg."+c)
            .append("a")
            .attr("xlink:href",l)
            .attr("target","_blank");
        credits.append("text")
            .attr("x",w-100)
            .attr("y",h-2)
            .text("Source")
            .attr("class","pyk-credits");
    }
    else if(t!=="" && l===""){
        d3.select("svg."+c)
            .append("text")
            .attr("x",w-100)
            .attr("y",h-2)
            .text("Source: "+t)
            .attr("class","pyk-credits");
    }
    else if(t!=="" && l!==""){
        d3.select("svg."+c)
            .append("text")
            .attr("x",w-100)
            .attr("y",h-2)
            .text("Source:")
            .style("class","pyk-credits");
        credits = d3.select("svg."+c)
            .append("a")
            .attr("xlink:href",l)
            .attr("target","_blank");
        credits.append("text")
            .attr("x",w-60)
            .attr("y",h-2)
            .text(t)
            .attr("class","pyk-credits");
    }
};

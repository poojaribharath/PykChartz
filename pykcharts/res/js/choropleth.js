
PykCharts.Choropleth = function(options){
 var color_domain = [20, 30, 40, 50, 60, 70,80,90];
  var ext_color_domain = [20, 30, 40, 50, 60, 70,80,90];
  var legend_labels = ["< 20", "30+","40+","50+", "60+", "70+", "80+", "> 90"] ;             
  var color = d3.scale.threshold()
  .domain(color_domain)
  .range(["#79C7FC", "#6BBDF4", "#5DB2EA", "#53A4DB", "#4A99CE", "#4293C9","#3788BF","#2E82BA","#1F77B4"]);
 var color1 = d3.scale.threshold()
  .domain(color_domain)
  .range(["#79F779","#6FED6F","#64E564","#5CDB5C","#52CE52","#4AC44A","#3FB53F","#37AD37","#42A142"]);

    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------

    this.execute = function(){
	//1.1 Validate the options passed   
	if(!this.validate_options()) return false;

		// 1.2 Preload animation
		$(this.options.selection).html("<img src='/pykcharts-images/spinner.gif'> Loading... Please wait");

		//1.3 Assign Global variable var that to access function and variable throughout   
	var that = this;
	var opt = this.options;


	// //1.3 Read Json File Get all the data and pass to render
	d3.json(opt.topojson, function(e, topology){
	    d3.json(opt.state_data, function(e, state_data){
		d3.json(opt.county_data, function(e, county_data){
		    that.render(topology, state_data, county_data);
		});
	    });
	});
    }

	//----------------------------------------------------------------------------------------
    //2. Validate Options
    //----------------------------------------------------------------------------------------
 	    this.validate_options = function(){
	if(this.options.selection === undefined) return false;
	if(this.options.topojson === undefined) return false;
	if(this.options.county_data === undefined) return false;
	if(this.options.state_data === undefined) return false;
	return true;
    }

    //----------------------------------------------------------------------------------------	
    //3. Assigning Attributes
    //----------------------------------------------------------------------------------------
    this.options = jQuery.extend({
	width: 960,
	height: 400,
	scale: 5,
	initScale: 0.6
	//topojson//state_data//county_data//selection
    }, options);


    //----------------------------------------------------------------------------------------
    //4. Render function to create the chart
    //----------------------------------------------------------------------------------------
   //4.1 Clear existing HTML inside Selection DIV ID
    this.render = function(t, s, c){
	$(this.options.selection).html("");

   //4.2 Assign height and width to a local variable 
	var h = this.options.height;
	var w = this.options.width;

	//4.3 Create SVG holders for legends
	this.legends_group = d3.select(this.options.selection).append("svg")
	    .attr("class", "pyk-choropleth-legend-holder")
	    .attr("height", 30)
	    .attr("width", w);
		
	//4.4 Create SVG holders for legends
	this.map_group = d3.select(this.options.selection).append("svg")
	    .attr("class", "pyk-choropleth-map-holder")
	    .attr("height", h - 100)
	    .attr("width", w);
this.downlegend_group = d3.select(this.options.selection).append("svg")
	    .attr("class", "pyk-choropleth-downlegends-holder")
	    .attr("height", 50)
	    .attr("width", w);
this.downlegend_group1 = d3.select(this.options.selection).append("svg")
	    .attr("class", "pyk-choropleth-downlegends-holder1")
	    .attr("height", 50)
	    .attr("width", w);
	//4.5 Set first parameter
	var params = Object.keys(s["0"]);
	this.param = params[0];

	//4.6 Draw the elements after creating the holder
	this.renderTooltip();
	this.draw(t, s, c);
 $ ('body').find(" .pyk-choropleth-downlegends-holder1").hide();

    }

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
    }

      //----------------------------------------------------------------------------------------
    // 6.Draw function to render chart with elements: 
    //----------------------------------------------------------------------------------------
   this.draw = function(t, s, c){
	// can pass any object to render the legends
	// TODO Check if 0 will always be an ID
	this.renderLegends(t,s,c);
	// 6.1 render map with t= topojson data, s= states data, c= county data
	this.renderMaps(t, s, c, function() {
});
	
    }

    //----------------------------------------------------------------------------------------
    // 7.Draw function to render Legends: 
    //----------------------------------------------------------------------------------------
    this.renderLegends = function(t, s, c){
	var that = this;
	var legends = Object.keys(s["0"]);
	var lWidth = this.options.width / legends.length;

	// 7.1 Append clickable text to group element
	var lText = this.legends_group.selectAll("text").data(legends);
	lText.enter().append("text");
	lText
	    .attr("y", 15)
	    .attr("x", function(d, i){
		return (i*lWidth) + 25;
	    })
	    .text(function(d, i){
		// capitalized string
		return d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
	    })
	    .on("click", function(d){
		that.param = d;
if (d=="revenue")
{
$ (" .pyk-choropleth-downlegends-holder1").hide();
$ (" .pyk-choropleth-downlegends-holder").show();

}
else
{ 
$ (" .pyk-choropleth-downlegends-holder1").css( "display", "block");

$ (" .pyk-choropleth-downlegends-holder1").show();
$ (" .pyk-choropleth-downlegends-holder").hide();

}		that.draw(t,s,c);
	    });

	// 7.2 Append clickable circle to group element
	var lCircle = this.legends_group.selectAll("circle").data(legends);
	lCircle.enter().append("circle");
	lCircle
	    .attr("cy", 10)
	    .attr("cx", function(d, i){
		return (i*lWidth) + 15;
	    })
	    .attr("r",7)
	    .attr("style", function(d, i){
		var color = (d === that.param) ? "#000" : "#fff";
		return "stroke-width: 3px; stroke: #000; fill: " + color;
	    })
	    .on("click", function(d){
		that.param = d;
if (d=="revenue")
{
$ (" .pyk-choropleth-downlegends-holder1").hide();
$ (" .pyk-choropleth-downlegends-holder").show();

}
else
{
$ (" .pyk-choropleth-downlegends-holder").hide();
$ (" .pyk-choropleth-downlegends-holder1").show();

}
		that.draw(t,s,c);
	    });
    }

    //----------------------------------------------------------------------------------------
    // 8.Draw function to render map: 
    //----------------------------------------------------------------------------------------
    this.renderMaps = function(t, s, c){
	var that = this;
	var path = d3.geo.path();

    // 8.1 set scale width and height map
	var scale = this.options.initScale * this.options.scale;
	var height = this.options.height;
	var width = this.options.width;

	var param = this.param;

    // 8.2 remove existing group before loading
	var map_group = this.map_group;
	this.map_group.selectAll("g").remove();

    // 8.3 Append group counties and states
	var counties_g = map_group.append("g").attr("class","counties");
	var states_g = map_group.append("g").attr("class","states");

	
     // 8.4 Append counties group  
 var legend1 = this.downlegend_group1.selectAll("g.legend")
  .data(ext_color_domain)
  .enter().append("g")
  .attr("class", "legend");

  var ls_w = 60, ls_h = 7;

  legend1.append("rect")
            .attr("x", function(d, i) { return ls_w * i; })
  .attr("y", 20)
  .attr("width", ls_w)
  .attr("height", ls_h)
  .style("fill", function(d, i) { return color1(d); })
  .style("opacity", 0.8);

  legend1.append("text")
            .attr("x", function(d, i) { return ls_w * i; })
  .attr("y", 40)
            .attr("class", "mono")
  .text(function(d, i){ return legend_labels[i]; });

  
	counties_g.selectAll("path")
	    .data(topojson.feature(t, t.objects.counties).features)
	    .enter().append("path").attr("class", "county")
	    .attr("d", path)
	    .attr("style", function(d, i){
		if(!c[d.id]) return;

		var color = c[d.id][param].color;
		var opacity = 1;
		if(c[d.id][param].data){
		    opacity = c[d.id][param].data / 100;
		}

		return "fill: "+color+"; opacity: "+opacity;
	    })
	    .attr("data-id", function(d,i){
		return d.id;
	    })
	    .attr("transform", function(d,i){
		return "scale(" + that.options.initScale + ")"
	    })
	    .on("click", function(d){
		var x,y,k;
		x = width/2;
		y = height/2;
		k = 1;

		states_g.transition().ease("back")
		    .duration(1200)
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

		counties_g.transition().ease("back")
		    .duration(1200)
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

		$("g.counties").fadeOut();
		$("g.states path").css("fill", function(){
		    return $(this).attr("data-color");
		});
		$("g.states path").css("opacity", function(){
		    return $(this).attr("data-heat");
		});
	    })
	    .on("mouseover", function(d, i){

		if(!c[d.id]) return;
		var tooltip = c[d.id][param].tooltip;
		that.tooltip.html(tooltip);
		that.tooltip.style("visibility", "visible");

	    })
	    .on("mousemove", function(){
		var yReduce = parseInt(that.tooltip.style("height")) + 40;
		var xReduce = parseInt(that.tooltip.style("width")) / 2;
		that.tooltip.style("top", (event.pageY- yReduce)+"px").style("left",(event.pageX-xReduce)+"px");
	    })
	    .on("mouseout", function(){
		that.tooltip.style("visibility", "hidden");
	    });

    // 8.4 Append state group  
	states_g.selectAll("path")
	    .data(topojson.feature(t, t.objects.states).features)
	    .enter().append("path").attr("class", "state")
	    .attr("d", path)
	    .attr("data-heat", function(d,i){
		if(!s[d.id]) return 1;
		if(!s[d.id][param].data) return 1;
		return s[d.id][param].data / 100;
	    })
	    .attr("data-color", function(d,i){
		if(!s[d.id]) return "black";
		return s[d.id][param].color;
	    })
	    .attr("data-id", function(d,i){
		return d.id;
	    })
	    .attr("transform", function(d,i){
		return "scale(" + that.options.initScale + ")"
	    })
	    .attr("style", function(d, i){
		if(!s[d.id]) {
		    return;
		}

		var color = s[d.id][param].color;
		var opacity = 1;
		if(s[d.id][param].data){
		    opacity = s[d.id][param].data / 100;
		}

		return "fill: "+color+"; opacity: "+opacity;
	    })
	    .on("click", function(d){
		var centroid = path.centroid(d);
		var x = centroid[0] * that.options.initScale;
		var y = centroid[1] * that.options.initScale;
		k = scale;

		counties_g.transition().delay(250).ease("elastic")
		    .duration(1200)
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

		states_g.transition().delay(250).ease("elastic")
		    .duration(1200)
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

		$("g.states path").css("fill", "#fff"); // Conceal all states
		$(this).css("fill", "none"); // Show the one that has been clicked on
		$("g.states path").animate({opacity: 0.9});
		$("g.counties").show();
	    })
	    .on("mouseover", function(d, i){
	
		if(!c[d.id]) return;	
		var tooltip = s[d.id][param].tooltip;
		that.tooltip.html(tooltip);
		that.tooltip.style("visibility", "visible");

	    })
	    .on("mousemove", function(){
		var yReduce = parseInt(that.tooltip.style("height")) + 40;
		var xReduce = parseInt(that.tooltip.style("width")) / 2;
		that.tooltip.style("top", (event.pageY- yReduce)+"px").style("left",(event.pageX-xReduce)+"px");
	    })
	    .on("mouseout", function(){
		that.tooltip.style("visibility", "hidden");
	    });

  var legend = this.downlegend_group.selectAll("g.legend")
  .data(ext_color_domain)
  .enter().append("g")
  .attr("class", "legend");

  var ls_w = 60, ls_h = 7;

  legend.append("rect")
            .attr("x", function(d, i) { return ls_w * i; })
  .attr("y", 20)
  .attr("width", ls_w)
  .attr("height", ls_h)
  .style("fill", function(d, i) { return color(d); })
  .style("opacity", 0.8);

  legend.append("text")
            .attr("x", function(d, i) { return ls_w * i; })
  .attr("y", 40)
              .attr("class", "mono")

  .text(function(d, i){ return legend_labels[i]; });


	$("g.counties").hide();

    }

    //----------------------------------------------------------------------------------------
    // 8. Return the Chart  
    //----------------------------------------------------------------------------------------  
  return this;
};
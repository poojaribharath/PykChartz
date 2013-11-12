PykCharts.UltimateNegative = function(options){
    this.execute = function(){
	if(!this.validate_options()) return false;

	var that = this;
	$(this.options.selection).html("<img src='/pykcharts-images/spinner.gif'> Loading... Please wait");

	d3.json(this.options.data, function(e, data){
	    that.data = data;
	    that.render();
	});
    }

    this.render = function(){
	$(this.options.selection).html("");

	var svg_height = this.options.svg_height;
	var svg_width = this.options.svg_width;
	var h = this.options.svg_height* this.options.barchartheightadjust;
	var w = this.options.svg_width * this.options.barchartwidthadjust;
	var height_translate =(svg_height - h)/2;
	var box_width =this.options.box_width;
	var box_gap =this.options.box_gap;
	
	
	// Create SVG holder for the chart and the legends
	this.svg = d3.select(this.options.selection)
	    .append("svg")
	    .attr("class", "pyk-ultimate")
	    .attr("height", svg_height)
	    .attr("width", svg_width);

	
this.barchartg=this.svg.append("g")	    
.attr("transform", "translate(0 ," + height_translate + ")")
.attr("class", "barchart")
.attr("height",h)
.attr("width",w)

this.barchartg.append("g").attr("class", "yaxis");
	this.barchartg.append("g").attr("class", "xaxis");


	this.legends_group = this.barchartg.append("g")
	    .attr("class", "legend-holder")
	    .attr("background", "Red")
	    .attr("transform", "translate(100,15)");

	this.chart_group = this.barchartg.append("g")
	    .attr("class", "chart-holder")
	    .attr("width", w - (this.options.margins.right + this.options.margins.left))
	    .attr("height", h - (this.options.margins.top + this.options.margins.bottom))
	    .attr("transform", "translate(" + this.options.margins.left + "," + this.options.margins.top + ")");

	var fD = this.flattenData(this.data);
	this.the_bars = fD[0];
	this.the_keys = fD[1];
	this.the_layers = this.layers(this.the_bars);


	// Render elements
	this.renderTooltip();
	this.draw();
    }

    this.getParameters = function(){
	var that = this;
	var p = []
	for(i in  that.the_layers){
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

    this.onlyFilter = function(f){
	var index = this.options.filterList.indexOf(f)
	if(this.options.filterList.length === 1 && index != -1){
	    // if its the only item on the list, get rid of it
	    this.options.filterList = [];
	}else{
	    // otherwise empty the list and add this one to it
	    this.options.filterList = [];
	    this.options.filterList.push(f);
	}
	this.draw();
    }

    this.toggleFilter = function(f){
	var index = this.options.filterList.indexOf(f)
	if(index === -1){
	    this.options.filterList.push(f);
	}else{
	    this.options.filterList.splice(index, 1);
	}
	this.draw();
    }


    this.renderLegends = function(){
	var that = this;
	var w = this.options.width;

	var params = this.getParameters();

	this.legends_group.selectAll("g.legend_group").remove();

	var legendGroups = this.legends_group.selectAll("g.legend_group").data(params)
	    .enter()
	    .append("g")
	    .attr("class", "legend_group")
	    .attr("transform", function(d,i){
		return "translate(" + (w-(i*80)-100) + ", 0)";
	    });

	for(i in params){
	    var g = d3.select(legendGroups[0][i]);
	    var p = params[i];

	    var texts = g.selectAll("text").data([p])

	    texts.enter().append("text")

	    texts.text(function(d){
		    return p.name;
		})
		.attr("x", function(d,i){
		    return i * 40;
		})
		.attr("dy", -3)
		.on("click", function(d,i){
		    that.toggleFilter(d.name);
		});

	    var circles = g.selectAll("circle").data([p])
	    circles.enter().append("circle");

	    circles
		.attr("cx", function(d,i){
		    return (i*100)-10;
		})
		.attr("cy",-6).attr("r", 6)
		.attr("style", function(d){
		    var fillColor = (that.options.filterList.indexOf(d.name) === -1) ? "#fff":d.color;
		    return "fill: "+ fillColor +"; stroke-width: 3px; stroke:" + d.color;
		})

	}
	// TODO Make legends
    }

    this.getGroups = function(){
	var groups = {};
	for(i in this.the_bars){
	    var bar = this.the_bars[i];
	    if(!bar.id) continue;
	    if(groups[bar.group]){
		groups[bar.group].push(bar.id);
	    }else{
		groups[bar.group] = [bar.id];
	    }
	}
	return groups;
    }

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

	var yValues = []
	layers.map(function(e, i){ // Get all values to create scale
	    for(i in e.values){
		var d = e.values[i];
	yValues.push(d.y + d.y0); // Adding up y0 and y to get total height
	//	console.log(("dyz="+d.y +"dy0z"+ d.y0));
	    }
	});

	var xScale = d3.scale.ordinal()
	    .domain(the_bars.map(function(e, i){
		return e.id || i; // Keep the ID for bars and numbers for integers
	    }))
	    .rangeBands([0,w - this.options.box_gap], 0.2);
		
		
			var v0 = Math.max(Math.abs(d3.min(yValues)), Math.abs(d3.max(yValues)));

var  
margin=10
,color = d3.scale.category10()

,x = d3.scale.ordinal()
	.domain(['J','F','M','A','M','J','J','A','S','O','N','D'])
	.rangeRoundBands([margin,w-margin], .1)

,y = d3.scale.linear()
	.range([h-margin,0+margin])
y.domain([-v0,v0])

//,xAxis = d3.svg.axis().scale(x).orient("bottom").tickSize(6, 0)
//,yAxis = d3.svg.axis().scale(y).orient("left")
		
	var yScale = d3.scale.linear().domain([-v0,v0]).range([0, h]).nice();
	var yScaleInvert = d3.scale.linear().domain([v0, -v0]).range([0, h]).nice(); // For the yAxis

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
	    });

	this.barchartg.select("g.yaxis").transition(1000)
	    .attr("transform", "translate("+ this.options.margins.left +", " + this.options.margins.top + ")")
	    .call(yAxis);


	var translateY = parseInt(this.options.margins.top) + parseInt(h);

	this.barchartg.select("g.xaxis").transition(1000)
	    .attr("transform", "translate("+ this.options.margins.left +", " + translateY + ")")
	    .call(xAxis)
	    .selectAll("text")
	    .style("text-anchor", "start")
	    .attr("dy", "2px")
	    .attr("dx", "20px")
	    .attr("transform", function(d) {
                return "rotate(90)"
            });;


	var group_label_data = [];
	for(i in groups){
	    var g = groups[i];
	    var x = xScale(g[0]);
	    var totalWidth = xScale.rangeBand() * g.length + that.options.box_width;
	    var x = x + (totalWidth/2);
	    group_label_data.push({x: x, name: i});
	}

	if(group_label_data.length > 1){
	    this.barchartg.selectAll("text.group_label").data(group_label_data).enter()
		.append("text").attr("class", "group_label")
		.attr("x", function(d){
		    return d.x + that.options.margins.left;
		})
		.attr("y", function(d){
		    return y(0) + 20;
		})
		.attr("text-anchor", "middle")
		.text(function(d){
		    return d.name;
		});
	}

	var bars = this.chart_group.selectAll("g.bars").data(this.barStack(layers))

	bars.enter().append("g")
	    .attr("class", "bars");


	var rect = bars.selectAll("rect")
	    .data(function(d){
		return d.values
	    });

	rect.enter().append("g.barchart:rect")
	    .attr("height", 0).attr("y", h)
	    .on("mouseover", function(d, i){
		that.tooltip.html(d.tooltip);
		that.tooltip.style("visibility", "visible");
	    })
	    .attr("fill", function(d){
		return d.color;
	    })
	    .on("mousemove", function(){
		var yReduce = parseInt(that.tooltip.style("height")) + 40;
		var xReduce = parseInt(that.tooltip.style("width")) / 2;
		that.tooltip.style("top", (event.pageY- yReduce)+"px").style("left",(event.pageX-xReduce)+"px");
	    })
	    .on("mouseout", function(){
		that.tooltip.style("visibility", "hidden");
	    })
	    .on("click", function(d){
		that.onlyFilter(d.name);
	    });


	rect
	    .transition().duration(1000)
		.attr("x", function(d){
		return xScale(d.x);
	    })
		
	    .attr("width", function(d){
		return xScale.rangeBand()+that.options.box_width;
	    })
		 
	    .attr("y",function(d) { 	return   y(d.y0)})

		.attr("height", function(d){
		return( Math.abs(y(0) - y(d.y)));
	    });
	

    }

    this.draw = function(){
	this.options.fullList = this.getParameters().map(function(d){
	    return d.name;
	});
	this.options.filterList = (this.options.filterList.length === 0) ? this.options.fullList : this.options.filterList;

	var tData = jQuery.extend(true, [], this.data);
	tData = this.filterData(tData);
	var fD = this.flattenData(tData);
	this.the_bars = fD[0];
	this.the_keys = fD[1];
	this.the_layers = this.layers(this.the_bars);

	this.renderLegends();
	this.renderChart();
    }

    this.filterData = function(data){
	var params = this.options.filterList;

	for(i in data){
	    var group = data[i];
	    for(j in group){
		var bars = group[j];
		for(k in bars){
		    var bar = bars[k];
		    for(l in bar){
			var slabs = bar[l];
			for(m in slabs){
			    var slab = slabs[m];
			    if(params.indexOf(slab.name) == -1){
				slab.val = 0;
			    }
			}
			break;
		    }
		}
	    }
	}
	return data;
    }

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
    }

    // Data Helpers
    // Takes the flattened data and returns layers
    // Each layer is a separate category
    // The structure of the layer is made so that is plays well with d3.stack.layout()
    // Docs - https://github.com/mbostock/d3/wiki/Stack-Layout#wiki-values
   
this.barStack = function (dz) {
var d = new Array()

console.log("changed input="+(dz.length));
			console.log("checking....dzz.="+(JSON.stringify(dz)));


var l = dz.length
console.log("length="+l);
	dz.forEach(function(dz) {
			console.log(">>>>>>>>>>>.="+(JSON.stringify (dz.values)));
		    d.push(
			dz.values
		   );

	})			
	console.log("~~~~~~~~~~~="+(JSON.stringify (d)));
var l = d[0].length
console.log("length="+l);

var l = d[0].length
console.log("length====***="+l);
while (l--) {
	var posBase = 0, negBase = 0;
	console.log("loopla");
	d.forEach(function(d) {
	console.log("starting,,posBase="+posBase);
	console.log("starting,,negBase="+negBase);

		d=d[l]
		d.size = Math.abs(d.y)
	console.log("dy="+d.y);
		if (d.y<0)  {
console.log("if====*** negBase="+negBase);
			d.y0 = negBase
			negBase-=d.size
console.log("if====*** y0="+d.y0);
		} else
		{ 
console.log("else====*** posBase="+posBase);
			d.y0 = posBase = posBase + d.size
console.log("else====*** y0="+d.y0);
		} 
	})
}


dz.extent= d3.extent(d3.merge(d3.merge(dz.map(function(e) { console.log("eeeeee	="+JSON.stringify(e));  return [e.y0,e.y0-e.size]}))))
console.log("output="+JSON.stringify(dz));
return dz;
}



   this.layers = function(the_bars){
	var layers = [];

	function findLayer(l){
	    for(i in layers){
		var layer = layers[i];
		if (layer.name == l) return layer;
	    }
	    return addLayer(l);
	}

	function addLayer(l){
	    var new_layer = {
		"name": l,
		"values": []
	    }
	    layers.push(new_layer);
	    return new_layer;
	}

	for(i in the_bars){
	    var bar = the_bars[i];
	    if(!bar.id) continue;
	    var id = bar.id;
	    for(k in bar){
		if(k === "id") continue;
		var icings = bar[k];
		for(j in icings){
		    var icing = icings[j];
		    if(!icing.name) continue;
		    var layer = findLayer(icing.name);
		    layer.values.push({
			"x": id,
			"y": icing.val,
			"color": icing.color,
			"tooltip": icing.tooltip,
			"name": icing.name
		    })
		}
	    }
	}
	return layers;
    }

    // Traverses the JSON and returns an array of the 'bars' that are to be rendered
    this.flattenData = function(data){
	var the_bars = [-1];
	var keys = {};
	for(i in data){
	    var d = data[i];
	    for(cat_name in d){
		for(j in d[cat_name]){
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


    // Options: Validations & Defaults
    this.validate_options = function(){
	if(this.options.selection == undefined) return false;
	if(this.options.data == undefined) return false;
	if(this.options.svg_width < 300) return false;
	return true;
    }

    this.options = jQuery.extend({
barchartwidthadjust: 0.8,
barchartheightadjust : 0.8,
box_gap : 10,
box_width : 10,
	svg_width: 900,
	svg_height: 500,
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

    return this;
};

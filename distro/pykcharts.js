PykCharts = {};


PykCharts.chord = function(options){
    this.init = function(){
	if(!this.validate_options()) return false;

	var that = this;

	d3.json(that.options.time, function(e, t){
	    that.time = t.sort(function(a, b){
		return a.hour - b.hour;
	    });
	    d3.json(that.options.relations, function(e, r){
		that.relations = r;
		d3.json(that.options.frequency, function(e, f){
		    that.frequency = f;
		    that.render();
		});
	    });
	});

    }

    this.render = function(){
	this.nicks = this.frequency.map(function(d){return d.nick;});
	this.generateMatrix();
	this.renderChord();
//	this.renderTime();
    }

    this.renderTime = function(){
	var that = this;

	var x = d3.scale
	    .ordinal()
	    .domain(this.time.map(function(d){
		return d.hour
	    }))
	    .rangeBands([0, $(document).width()], 0.90);

	var y = d3.scale.linear().domain(
	    [
		0,
		d3.max(this.time.map(function(d){
		    return d.messages;
		}))
	    ]
	).range([0, 100]);

	var svg = d3.select(this.options.selection).append("svg").attr("class", "time-bar");

	svg.selectAll("rect").data(that.time).enter()
	    .append("rect")
	    .attr("height", function(d){
		console.log(d);
		return y(d.messages);
	    })
	    .attr("x", function(d){
		return x(d.hour);
	    })
	    .attr("width", x.rangeBand())
	    .attr("y",0)
	    .style("fill", that.options.color);

    }

    this.renderChord = function(){
	var that = this;
	var h = this.options.height;
	var w = this.options.width;

	var svg = d3.select(this.options.selection)
	    .append("svg")
	    .attr("class", "chord")
	    .attr("width", w)
	    .attr("height", h)
	    .append("g")
	    .attr("transform","translate(" + w / 2 + "," + h / 2 + ")");


	var fill = d3.scale.ordinal().range([that.options.color]);
	var innerRadius = Math.min(w,h) * .31;
	var outerRadius = innerRadius * 1.1;
	var chord = d3.layout.chord()
	    .padding(.05)
	    .sortSubgroups(d3.descending)
	    .matrix(that.matrix);

	svg.append("g")
	    .selectAll("path")
	    .data(chord.groups)
	    .enter().append("path")
	    .style("fill", function(d) {
		return fill(d.index);
	    })
	    .style("stroke", function(d) {
		return fill(d.index);
	    })
	    .attr("d", d3.svg.arc()
		  .innerRadius(innerRadius)
		  .outerRadius(outerRadius)
		 )
	    .on("mouseover", fade(0))
	    .on("mouseout", fade(1));

	function fade(opacity) {
	    return function(g, i) {
		svg.selectAll("g.chord path")
		    .filter(function(d) {
			return d.source.index != i && d.target.index != i;
		    })
		    .transition()
		    .style("opacity", opacity);
	    };
	}

	svg.append("g")
	    .attr("class", "chord")
	    .selectAll("path")
	    .data(chord.chords)
	    .enter().append("path")
	    .style("fill", function(d) {
		return fill(d.target.index);
	    })
	    .attr("d", d3.svg.chord().radius(innerRadius))
	    .style("opacity", 1);

	var ticks = svg.append("svg:g")
	    .selectAll("g")
	    .data(chord.groups)
	    .enter().append("svg:g")
	    .attr("transform", function(d) {
		return "rotate(" + (d.startAngle * 180 / Math.PI - 90) + ")"
		    + "translate(" + outerRadius + ",0)";
	    });

	ticks.append("svg:text").attr("x", 8)
	    .attr("dy", ".35em")
	    .attr("text-anchor", function(d) {
		return d.angle > Math.PI ? "end" : null;
	    })
	    .attr("transform", function(d) {
		return d.angle > Math.PI ? "rotate(180)translate(-16)" : null;
	    })
	    .text(function(d) {
		return that.nicks[d.index];
	    });


    }


    // Data helpers
    this.generateMatrix = function(){
	var that = this;
	var matrix = [];
	function populateMatrix(){
	    for(var i = 0; i < that.nicks.length; i++){
		matrix[i] = [];
		for(var j = 0; j < that.nicks.length; j++){
		    matrix[i][j] = 0
		}
	    }
	}
	populateMatrix();
	for(i in this.relations){
	    var r = this.relations[i];
	    if( that.nicks.indexOf(r.from) == that.nicks.indexOf(r.to)) continue;
	    matrix[that.nicks.indexOf(r.from)][that.nicks.indexOf(r.to)] = r.messages
	}
	this.matrix = matrix;
    }

    // Options: Validations & Defaults
    this.validate_options = function(){
	if(this.options.selection == undefined) return false;
	if(this.options.time == undefined) return false;
	if(this.options.relations == undefined) return false;
	return true;
    }

    this.options = jQuery.extend({
	width: $(window).width(),
	height: $(window).height(),
    }, options);

    return this;
}

PykCharts.Choropleth = function(options){

    this.init = function(){
	if(!this.validate_options()) return false;

	var that = this;
	var opt = this.options;

	$(this.options.selection).html("<img src='/pykcharts/pykcharts/images/spinner.gif'> Loading... Please wait");

	// Get all the data and pass to render
	d3.json(opt.topojson, function(e, topology){
	    d3.json(opt.state_data, function(e, state_data){
		d3.json(opt.county_data, function(e, county_data){
		    that.render(topology, state_data, county_data);
		});
	    });
	});
    }

    this.render = function(t, s, c){
	$(this.options.selection).html("");

	var h = this.options.height;
	var w = this.options.width;

	// Create SVG holders for map and legends
	this.legends_group = d3.select(this.options.selection).append("svg")
	    .attr("class", "pyk-choropleth-legend-holder")
	    .attr("height", 30)
	    .attr("width", w);

	this.map_group = d3.select(this.options.selection).append("svg")
	    .attr("class", "pyk-choropleth-map-holder")
	    .attr("height", h - 30)
	    .attr("width", w);

	// Set first parameter
	var params = Object.keys(s["0"]);
	this.param = params[0];

	// Draw the elements after creating the holder
	this.renderTooltip();
	this.draw(t, s, c);
    }

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

    this.draw = function(t, s, c){
	// can pass any object to render the legends
	// TODO Check if 0 will always be an ID
	this.renderLegends(t,s,c);
	this.renderMaps(t, s, c);
    }

    this.renderLegends = function(t, s, c){
	var that = this;
	var legends = Object.keys(s["0"]);
	var lWidth = this.options.width / legends.length;

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
		that.draw(t,s,c);
	    });

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
		that.draw(t,s,c);
	    });
    }

    this.renderMaps = function(t, s, c){
	var that = this;
	var path = d3.geo.path();

	var scale = this.options.scale;
	var height = this.options.height;
	var width = this.options.width;

	var param = this.param;

	var map_group = this.map_group;
	this.map_group.selectAll("g").remove();

	var counties_g = map_group.append("g").attr("class","counties");
	var states_g = map_group.append("g").attr("class","states");

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
	    .attr("style", function(d, i){
		if(!s[d.id]) {
		    console.log(d.id);
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
		var x = centroid[0];
		var y = centroid[1];
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

	$("g.counties").hide();
    }

    this.validate_options = function(){
	if(this.options.selection === undefined) return false;
	if(this.options.topojson === undefined) return false;
	if(this.options.county_data === undefined) return false;
	if(this.options.state_data === undefined) return false;
	return true;
    }

    // Setting the Defaults
    this.options = jQuery.extend({
	width: 960,
	height: 500,
	scale: 4
	//topojson//state_data//county_data//selection
    }, options);

    return this;
};


PykCharts.GoogleHeat = function(options){
    this.init = function(){
	if(!this.validate_options()) return false;
	this.container = $(this.options.selection);
	this.div = $("<div>")
	    .css("height", this.options.height + "px")
	    .css("width", this.options.width + "px");

	this.container.append(this.div);

	var that = this;

	$.getJSON(this.options.data, function(data){
	    that.data = data;
	    that.render();
	});
    }

    this.render = function(){
	var that = this;
	var div = this.div.get(0);

	var mapOptions = {
            center: this.options.center,
            zoom: this.options.defaultZoom,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        this.map = new google.maps.Map(div, mapOptions);
	this.map.setOptions({styles: this.setupStyle()});

	this.setupHeat();
	this.setupMarkers();
    }

    this.setupStyle = function(){
	return [
	    {
		stylers: [
		    { hue: '#FFBB78' },
		    { visibility: 'simplified' },
		    { gamma: 0.5 },
		    { weight: 0.5 }
		]
	    },
	    {
		elementType: 'labels',
		stylers: [
		    { visibility: 'on' }
		]
	    },
	    {
		featureType: 'water',
		stylers: [
		    { color: '#1F77B4' }
		]
	    }
	];
    }

    this.setupHeat = function(){
	var pointArray = new google.maps.MVCArray(this.heatData());
	var heatmap = new google.maps.visualization.HeatmapLayer({
	    data: pointArray
	});
	heatmap.setMap(this.map);
    }

    this.setupMarkers = function(){
	var that = this;
	var mgr = new MarkerManager(that.map);

	var markers = [];
	for(i in this.data){
	    var p = this.data[i];
	    var marker = new google.maps.Marker({
		position: new google.maps.LatLng(p.latitude, p.longitude),
		title: p.tooltip,
		icon: p.marker
	    });
	    markers.push(marker);

	    var infowindow = new google.maps.InfoWindow({content: p.tooltip});

	    google.maps.event.addListener(marker, 'click', function(i) {
		return function(){
		    i.open(that.map, this);
		}
	    }(infowindow));
	}
	google.maps.event.addListener(mgr, 'loaded', function(){
	    mgr.addMarkers(markers, that.options.tooltipZoom);
	    mgr.refresh();
	});
    }

    this.heatData = function(){
	var d = []
	for(i in this.data){
	    var p = this.data[i];
	    var o = new google.maps.LatLng(p.latitude, p.longitude);
	    d.push({location: o, weight: p.count});
	}
	return d;
    }

    // Defatuls and Validations for the Options
    this.validate_options = function(){
	if(this.options.selection == undefined) return false;
	if(this.options.data == undefined) return false;
	return true;
    }

    this.options = jQuery.extend({
	width: 960,
	height: 500,
	center: new google.maps.LatLng(-25.363882,131.044922),
	defaultZoom: 3,
	tooltipZoom: 4

    }, options);

    return this;
};

PykCharts.River = function(options){

    this.init = function(){
	if(!this.validate_options()) return false;

	var that = this;
	var opt = this.options;

	$(this.options.selection).html("<img src='/pykcharts/pykcharts/res/img/spinner.gif'> Loading... Please wait");

	d3.json(opt.data, function(e, data){
	    that.data = data;
	    that.render();
	});
    }

    this.render = function(){
	$(this.options.selection).html("");

	var h = this.options.height;
	var w = this.options.width;

	// Create SVG holder for the chart and the legends
	this.svg = d3.select(this.options.selection)
	    .append("svg")
	    .attr("class", "pyk-river")
	    .attr("height", h)
	    .attr("width", w);

	this.legends_group = this.svg.append("g")
	    .attr("class", "legend-holder")
	    .attr("transform", "translate(0,15)");

	this.map_group = this.svg.append("g")
	    .attr("class", "map-holder");

	// Render elements
	this.renderTooltip();
	this.draw();
    }

    this.draw = function(){
	this.renderLegends();
	this.renderChart();
    }

    this.renderChart = function(){
	var tData = jQuery.extend(true, [], this.data);
	var legendHeight = 40;
	var that = this;

	// Filtering & Parsing Data
	tData = this.filter(tData);
	tData = this.parseData(tData);
	var maxTotalVal = this.maxTotal(tData);

	// Sizes & Scales
	var width = this.options.width;
	var height = this.options.height;
	var xScale = d3.scale.linear().domain([0, maxTotalVal]).range([0, width - 200]);
	var yScale = d3.scale.linear().domain([0, height]).range([legendHeight, height]);
	var barHeight = (height) / (tData.length * 2);
	var barMargin = barHeight * 2;

	var svg = this.map_group;

	// Top: Graph Lines
	svg.selectAll("line.top_line").data(tData).enter()
	    .append("line").attr("class", "top_line")
	    .attr("x1", 0).attr("x2", width)
	    .attr("y1", function(d, i){
		return yScale(i * barMargin);
	    })
	    .attr("y2", function(d, i){
		return yScale(i * barMargin);
	    });


	// Bottom: Graph Lines
	svg.selectAll("line.bottom_line").data(tData).enter()
	    .append("line").attr("class", "bottom_line")
	    .attr("x1", 0).attr("x2", width)
	    .attr("y1", function(d, i){
		return yScale((i * barMargin) + barHeight);
	    })
	    .attr("y2", function(d, i){
		return yScale((i * barMargin) + barHeight);
	    });

	// SVG Groups for holding the bars
	var groups = svg.selectAll("g.bar-holder").data(tData)

	groups.enter().append("g").attr("class", "bar-holder")
	    .attr("transform", function(d, i){
		var y = yScale(i * barMargin);
		var x = xScale((maxTotalVal - d.breakupTotal) / 2) + 100;
		return "translate("+x+","+y+")";
	    });


	groups.transition().duration(1000)
	    .attr("height", yScale(barHeight))
	    .attr("width", function(d){
		return xScale(d.breakupTotal);
	    })
	    .attr("transform", function(d, i){
		var y = yScale(i * barMargin);
		var x = xScale((maxTotalVal - d.breakupTotal) / 2) + 100;
		var scalex = 1;
		var scaley = 1;

		if(that.extended){
		    var barWidth = xScale(d.breakupTotal);
		    scalex = (width - 200) / barWidth;
		    scaley = 2;
		    x = yScale(100);
		}

		return "translate("+x+","+y+") scale("+ scalex +", "+ scaley  +")";
	    });

	groups.exit().remove();


	var bar_holder = d3.selectAll("g.bar-holder")[0];
	for(i in tData){
	    var group = bar_holder[i];
	    var breakup = tData[i].breakup;


	    // Rectangles
	    var rects = d3.select(group).selectAll("rect").data(breakup);

	    rects.enter().append("rect").attr("width", 0);

	    rects.transition().duration(1000)
		.attr("x", function(d, i){
		    if (i == 0) return 0
		    var shift = 0;
		    for(var j = 0; j < i; j++){
			shift += breakup[j].count;
		    }
		    return xScale(shift);
		})
		.attr("y", 0)
		.attr("height", function(d, i){
		    // Scale the height according to the available height
		    return (barHeight * (height - legendHeight)) / height

		})
		.attr("width", function(d,i){
		    return xScale(d.count);
		});

	    rects.attr("style", function(d,i){
		return "fill: " + d.color;
	    })
		.on("mouseover", function(d, i){
		    that.tooltip.html(d.tooltip);
		    that.tooltip.style("visibility", "visible");
		})
		.on("mousemove", function(){
		    var yReduce = parseInt(that.tooltip.style("height")) + 40;
		    var xReduce = parseInt(that.tooltip.style("width")) / 2;
		    that.tooltip.style("top", (event.pageY- yReduce)+"px").style("left",(event.pageX-xReduce)+"px");
		})
		.on("mouseout", function(){
		    that.tooltip.style("visibility", "hidden");
		})
		.on("click", function(d, i){
		    that.onlyFilter(d.name);
		});

	    rects.exit().transition().duration(1000).attr("width", 0).remove();
	}

	// Display Name labels
	var display_name = svg.selectAll("text.cool_label").data(tData);

	display_name.enter().append("text").attr("class", "cool_label");

	display_name.attr("x", width)
	    .attr("y", function(d, i){
		return yScale((i * barMargin) + (barHeight/2) + 5);
	    })
	    .text(function(d, i){
		return d.display_name;
	    });


	// Left side labels with totals
	var left_labels = svg.selectAll("text.left_label").data(tData);

	left_labels.enter().append("svg:text").attr("class", "left_label");

	left_labels
	    .attr("y", function(d, i){
		return yScale((i * barMargin) + (barHeight/2) + 5);
	    })
	    .attr("x", 0)
	    .text(function(d,i){
		return d.breakupTotal + " " + d.technical_name;
	    });


	// Right side labels with time duration
	var right_labels = svg.selectAll("text.right_label").data(tData);

	right_labels.enter().append("svg:text").attr("class", "right_label");

	right_labels
	    .attr("y", function(d, i){
		return yScale((i * barMargin) + (barHeight * 1.5) + 5);
	    })
	    .attr("x", width)
	    .text(function(d,i){
		if(tData[i+1] == undefined){
		    console.log("RiverChart: Error: Duration given for last bar");
		    return "";
		}
		return d.duration;
	    });



	if(this.extended) {
	    $("line.left_line").fadeOut();
	    $("line.right_line").fadeOut();
	    return;
	} //No need for angle lines if its extended

	// Left side angle lines
	var left_angles = svg.selectAll("line.left_line").data(tData);

	left_angles.enter().append("line").attr("class", "left_line")
	    .attr("y2", function(d,i){
		return yScale((i * barMargin) + barHeight);
	    })
	    .attr("x2", function(d,i){
		return xScale((maxTotalVal - d.breakupTotal) / 2) + 100;
	    });

	left_angles.transition().duration(1000)
	    .attr("style", function(d,i){
		if(!tData[i+1]) return "stroke-width: 0";
	    })
	    .attr("y1", function(d,i){
		return yScale((i * barMargin) + barHeight);
	    })
	    .attr("x1", function(d,i){
		return xScale((maxTotalVal - d.breakupTotal) / 2) + 100;
	    })
	    .attr("y2", function(d,i){
		return yScale(((i+1) * barMargin));
	    })
	    .attr("x2", function(d,i){
		if(!tData[i+1]) return 0;
		return xScale((maxTotalVal - tData[i+1].breakupTotal) / 2) + 100;

	    });


	// Right side angle lines
	var right_angles = svg.selectAll("line.right_line").data(tData)

	right_angles.enter().append("line").attr("class", "right_line")
	    .attr("y2", function(d,i){
		return yScale((i * barMargin) + barHeight);
	    })
	    .attr("x2", function(d,i){
		return xScale(((maxTotalVal - d.breakupTotal) / 2) + d.breakupTotal) + 100;
	    });

	right_angles.transition().duration(1000)
	    .attr("style", function(d,i){
		if(!tData[i+1]) return "stroke-width: 0";
	    })
	    .attr("y1", function(d,i){
		return yScale((i * barMargin) + barHeight);
	    })
	    .attr("x1", function(d,i){
		return xScale(((maxTotalVal - d.breakupTotal) / 2) + d.breakupTotal) + 100;
	    })
	    .attr("y2", function(d,i){
		return yScale(((i+1) * barMargin));
	    })
	    .attr("x2", function(d,i){
		if(!tData[i+1]) return 0;
		return xScale(((maxTotalVal - tData[i+1].breakupTotal) / 2) + tData[i+1].breakupTotal) + 100;
	    });


    }

    this.renderTooltip = function(){
	$("#river-tooltip").remove();
	this.tooltip = d3.select("body")
	    .append("div").attr("id","river-tooltip")
	    .style("position", "absolute")
	    .style("z-index", "10")
	    .style("visibility", "hidden")
	    .style("background", "#fff")
	    .style("padding", "10px 20px")
	    .style("box-shadow", "0 0 10px #000")
	    .style("border-radius", "5px")
	    .text("a simple tooltip");
    }

    this.renderLegends = function(){
	var that = this;

	// Extended & Stream Options
	var optionHolder = this.legends_group.append("g")
	    .attr("class", "option-holder")
	    .attr("transform", "translate(0,15)");

	var options = [
	    {
		"name": "Percentage",
		"on": this.extended
	    },
	    {
		"name": "Absolute",
		"on": !this.extended
	    }
	]

	var texts = d3.select("g.option-holder").selectAll("text").data(options);
	texts.enter().append("text")
	    .text(function(d,i){
		return d.name;
	    })
	    .attr("transform", function(d, i){
		return "translate(" + ((i*100) + 20) + ",0)";
	    })
	    .on("click", function(d,i){
		that.extended = !that.extended;
		that.draw();
	    });


	var circles = d3.select("g.option-holder").selectAll("circles").data(options);
	circles.enter().append("circle")
	    .attr("cx", function(d,i){
		return (i*100)+10;
	    })
	    .attr("cy",-6).attr("r", 6)
	    .attr("style", function(d){
		var fill = d.on ? "#000" : "#fff";
		return "fill: "+ fill +"; stroke-width: 3px; stroke:#000";
	    })
	    .on("click", function(d,i){
		that.extended = !that.extended;
		that.draw();
	    });

	// Legends for different datasets
	var legends = this.data[0].breakup;
	var lWidth = (this.options.width-250) / legends.length;

	var lg = this.legends_group.append("g").attr("class", "legend-holder")
	    .attr("transform", "translate(250,15)");

	lg.selectAll("g.legend")
	    .data(legends).enter()
	    .append("g").attr("class", "legend")
	    .attr("transform", function(d, i){
		var l = i * lWidth;
		return "translate("+l+",0)";
	    })
	    .on("click", function(d){
		that.toggleFilter(d.name);
	    });

	var groups = d3.selectAll("g.legend")[0];


	for(i in legends){
	    var group = d3.select(groups[i]);

	    group.selectAll("text").data([legends[i]]).enter().append("text")
		.text(function(d){
		    that.options.filterList.push(d.name);
		    that.options.fullList.push(d.name);
		    return d.name;
		})
		.attr("transform", "translate(20,-1)");

	    var c = group.selectAll("circle").data([legends[i]])

	    c.enter().append("circle")

	    c.attr("cx", 9).attr("cy",-6).attr("r", 6)
		.attr("style", function(d){
		    var fill = (that.options.filterList.indexOf(d.name) === -1) ? "#fff" : d.color;
		    if(that.options.filterList.length === 0) fill = d.color;
		    return "fill: "+ fill +"; stroke-width: 3px; stroke:" + d.color;
		});
	}
    }

    // Data Helpers
    this.filter = function(d){
	if(this.options.filterList.length < 1){
	    this.options.filterList = jQuery.extend(true, [], this.options.fullList);
	}

	for(i in d){
	    var media = d[i].breakup;
	    var newMedia = [];
	    for(j in media){
		if (jQuery.inArray(media[j].name, this.options.filterList) >= 0) newMedia.push(media[j]);
	    }
	    d[i].breakup = newMedia;
	}
	return d;
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

    this.totalInBreakup = function(breakup){
	var total = 0;
	for(i in breakup) total += breakup[i].count; // Add all the counts in breakup to total
	return total;
    }

    this.maxTotal = function(d){
	var totals = []
	for(i in d) totals.push(d[i].breakupTotal); // Get all the breakupTotals in an Array
	totals = totals.sort(function(a,b){return a - b}); // Sort them in ascending order
	return totals[totals.length - 1]; // Give the last one
    }

    this.parseData = function(d){
	for(i in d) d[i].breakupTotal = this.totalInBreakup(d[i].breakup); // Calculate all breakup totals and add to the hash
	return d;
    }


    // Options: Validations & Defaults
    this.validate_options = function(){
	if(this.options.selection == undefined) return false;
	if(this.options.data == undefined) return false;
	if(this.options.width < 300) return false;
	return true;
    }

    this.options = jQuery.extend({
	width: 960,
	height: 200,
	filterList: [],
	fullList: [],
	extended: false
    }, options);

    return this;
};

PykCharts.Ultimate = function(options){
    this.init = function(){
	if(!this.validate_options()) return false;

	var that = this;
	$(this.options.selection).html("<img src='/pykcharts/pykcharts/res/img/spinner.gif'> Loading... Please wait");

	d3.json(this.options.data, function(e, data){
	    that.data = data;
	    that.render();
	});
    }

    this.render = function(){
	$(this.options.selection).html("");

	var h = this.options.height;
	var w = this.options.width;

	// Create SVG holder for the chart and the legends
	this.svg = d3.select(this.options.selection)
	    .append("svg")
	    .attr("class", "pyk-ultimate")
	    .attr("height", h)
	    .attr("width", w);

	this.svg.append("g").attr("class", "yaxis");
	this.svg.append("g").attr("class", "xaxis");

	this.legends_group = this.svg.append("g")
	    .attr("class", "legend-holder")
	    .attr("transform", "translate(0,15)");

	this.chart_group = this.svg.append("g")
	    .attr("class", "chart-holder")
	    .attr("width", w - (this.options.margins.right + this.options.margins.left))
	    .attr("height", h - (this.options.margins.top + this.options.margins.bottom))
	    .attr("transform", "translate(" + this.options.margins.left + "," + this.options.margins.top + ")");

	var fD = this.flattenData();
	this.the_bars = fD[0];
	this.the_keys = fD[1];
	this.the_layers = this.layers(this.the_bars);

	// Render elements
	this.renderTooltip();
	this.draw();
    }

    this.renderLegends = function(){
	var that = this;

	function getParameters(){
	    var p = []
	    for(i in  that.the_layers){
		if(!that.the_layers[i].name) continue;
		p.push(that.the_layers[i].name);
	    }
	    return p;
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
	    }
	});

	var xScale = d3.scale.ordinal()
	    .domain(the_bars.map(function(e, i){
		return e.id || i; // Keep the ID for bars and numbers for integers
	    }))
	    .rangeBands([0,w], 0.2);

	var yScale = d3.scale.linear().domain([0,d3.max(yValues)]).range([that.options.margins.top, h]).nice();
	var yScaleInvert = d3.scale.linear().domain([d3.max(yValues), 0]).range([that.options.margins.top, h]).nice(); // For the yAxis
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
	    })
            .orient("bottom");

	this.svg.select("g.yaxis").transition(1000)
	    .attr("transform", "translate("+ this.options.margins.left +", " + this.options.margins.top + ")")
	    .call(yAxis);


	var translateY = parseInt(this.options.margins.top) + parseInt(h);

	this.svg.select("g.xaxis").transition(1000)
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
	    var totalWidth = xScale.rangeBand() * g.length;
	    var x = x + (totalWidth/2);
	    group_label_data.push({x: x, name: i});
	}

	this.svg.selectAll("text.group_label").data(group_label_data).enter()
	    .append("text").attr("class", "group_label")
	    .attr("x", function(d){
		return d.x + that.options.margins.left;
	    })
	    .attr("y", function(d){
		return parseInt(h) + 24;
	    })
	    .attr("text-anchor", "middle")
	    .text(function(d){
		return d.name;
	    });


	var bars = this.chart_group.selectAll("g.bars")
	    .data(layers).enter().append("g")
	    .attr("class", "bars");

	var rect = bars.selectAll("rect")
	    .data(function(d){
		return d.values
	    }).enter().append("svg:rect")
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
	    });

	rect.transition().duration(1000).attr("x", function(d){
		return xScale(d.x);
	    })
	    .attr("width", function(d){
		return xScale.rangeBand();
	    })
	    .attr("height", function(d){
		return yScale(d.y);
	    })
	    .attr("y", function(d){
		return h - yScale(d.y0 + d.y);
	    });
    }

    this.draw = function(){
	this.renderLegends();
	this.renderChart();
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
			"tooltip": icing.tooltip
		    })
		}
	    }
	}
	return layers;
    }

    // Traverses the JSON and returns an array of the 'bars' that are to be rendered
    this.flattenData = function(){
	var the_bars = [-1];
	var keys = {};
	for(i in this.data){
	    var d = this.data[i];
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
	if(this.options.width < 300) return false;
	return true;
    }

    this.options = jQuery.extend({
	width: 960,
	height: 400,
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

PykCharts.Chord = function(options){
    this.init = function(){
	if(!this.validate_options()) return false;

	var that = this;

	d3.json(that.options.relations, function(e, r){
	    that.relations = r;
	    d3.json(that.options.frequency, function(e, f){
		that.frequency = f;
		that.render();
	    });
	});

    }

    this.render = function(){
	this.nicks = this.frequency.map(function(d){return d.nick;});
	this.generateMatrix();
	this.renderChord();
    }

    this.renderChord = function(){
	var that = this;
	var h = this.options.height;
	var w = this.options.width;

	var svg = d3.select(this.options.selection)
	    .append("svg")
	    .attr("class", "pyk-chord spinning")
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

	svg.append("g").attr("class", "circumference")
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
		if(opacity == 0){
		    $(".spinning").css("-webkit-animation-play-state", "paused");
		    $(".spinning").css("animation-play-state", "paused");
		}else{
		    $(".spinning").css("-webkit-animation-play-state", "running");
		    $(".spinning").css("animation-play-state", "runnin");
		}
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
	    // Uncomment this if we don't want to messages to self to be shown here
	    // if( that.nicks.indexOf(r.from) == that.nicks.indexOf(r.to)) continue;
	    matrix[that.nicks.indexOf(r.from)][that.nicks.indexOf(r.to)] = r.messages
	}
	this.matrix = matrix;
    }

    // Options: Validations & Defaults
    this.validate_options = function(){
	if(this.options.selection == undefined) return false;
	if(this.options.relations == undefined) return false;
	if(this.options.frequency == undefined) return false;
	return true;
    }

    this.options = jQuery.extend({
	width: 850,
	height: 700,
    }, options);

    return this;
}

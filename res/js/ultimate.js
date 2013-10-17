Pyk.Ultimate = function(options){
    this.init = function(){
	if(!this.validate_options()) return false;

	var that = this;
	$(this.options.selection).html("<img src='/res/img/spinner.gif'> Loading... Please wait");

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

	this.legends_group = this.svg.append("g")
	    .attr("class", "legend-holder")
	    .attr("transform", "translate(0,15)");

	this.map_group = this.svg.append("g")
	    .attr("class", "chart-holder");

	// Render elements
	this.renderTooltip();
	this.draw();
    }

    this.renderLegends = function(){
	// TODO Implement this
    }

    this.renderChart = function(){
	var that = this;
	var n_of_groups = this.data.length;
	var n_of_bars = 0;
	for(i in this.data){
	    var d = this.data[i];
	    for(cat_name in d){
		n_of_bars += d[cat_name].length;
	    }
	}
	var bar_width = this.options.width / (n_of_groups + n_of_bars);

	for(i in this.data){
	    for(cat_name in this.data[i]){
		for(j in this.data[i][cat_name]){
		    var stack = this.data[i][cat_name][j];

		}
	    }
	}

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

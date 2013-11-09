PykCharts.Chord = function(options){

    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------
       this.execute = function(){
	//1.1 Validate the options passed   
	if(!this.validate_options()) return false;
	//1.2 Assign Global variable var that to access function and variable throughout   
	var that = this;
	//1.3 Read Json File   
	d3.json(that.options.relations, function(e, r){
		//1.4 Set Json Read data to global varibale   
    that.relations = r;
	    d3.json(that.options.frequency, function(e, f){
		//1.4 Set Json Read data to global varibale   
		that.frequency = f;
		//1.5 Render Chart   
		that.render();
	    });
	});

    }
	
   //----------------------------------------------------------------------------------------
    //2. Validate Options
    //----------------------------------------------------------------------------------------
     this.validate_options = function(){
	if(this.options.selection == undefined) return false;
	if(this.options.relations == undefined) return false;
	if(this.options.frequency == undefined) return false;
	return true;
    }
	
    //----------------------------------------------------------------------------------------	
    //3. Assigning Attributes
    //----------------------------------------------------------------------------------------
    this.options = jQuery.extend({
	width: 850,
	height: 700,
    }, options);

    //----------------------------------------------------------------------------------------
    //4. Render function to create the chart
    //----------------------------------------------------------------------------------------
    this.render = function(){
        //4.1 get the texts contents & assign to nick variable
	this.nicks = this.frequency.map(function(d){return d.nick;});
        //4.2 Manipulations Json data represent dataformat required by chors 
	this.rawdata_to_chartdata();
        //4.3 Call render chors to display chord svg
	this.renderChord();
    }

	//----------------------------------------------------------------------------------------
    //5. Render chords
    //----------------------------------------------------------------------------------------
    this.renderChord = function(){
	var that = this;
	      
    //5.1 Assign height and width to a local variable because if you are manipulating with h and w then the SVG height and width will not get affected
	var h = this.options.height;
	var w = this.options.width;
	
	//5.2 Create SVG holder for the chart and the legends
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

    //5.3 Append Group circumference to svg
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

    //5.4 Append Group Chord to svg
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

    //----------------------------------------------------------------------------------------
    // 6. Data Manipulations: 
    //----------------------------------------------------------------------------------------
    // Data helpers
    this.rawdata_to_chartdata = function(){
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

   
  //----------------------------------------------------------------------------------------
    // 7. Return the Chat  
    //----------------------------------------------------------------------------------------
      return this;
}

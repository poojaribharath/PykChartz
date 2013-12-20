PykCharts.Chord = function(options){

    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------
    this.execute = function(){
    //1.1 Validate the options passed   
    if(!this.validate_options()) return false;

    //1.2 Assign Global variable var that to access function and variable throughout   
    var that = this;

    that.source_name = this.options.sourceName;
    that.source_link = this.options.sourceLink;
    that.display_credit = this.options.displayCredit;

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

    };
    
    //----------------------------------------------------------------------------------------
    //2. Validate Options
    //----------------------------------------------------------------------------------------
       this.validate_options = function(){
    if(this.options.selection === undefined) return false;
    if(this.options.relations === undefined) return false;
    if(this.options.frequency === undefined) return false;
    return true;
    };

    //----------------------------------------------------------------------------------------  
    //3. Assigning Attributes
    //----------------------------------------------------------------------------------------
    this.options = jQuery.extend({
    width: 700,
    height: 500,
    }, options);

    
    //----------------------------------------------------------------------------------------
    //4. Render function to create the chart
    //----------------------------------------------------------------------------------------
    this.render = function(){
        var that = this;
        //4.1 get the texts contents & assign to nick variable
    this.nicks = this.frequency.map(function(d){return d.nick;});
        this.color = this.frequency.map(function(d){return d.color;});
        //4.2 Manipulations Json data represent dataformat required by chors 
    this.generateMatrix();
        //4.3 Call render chors to display chord svg
    this.renderChord();
    renderCredits("pyk-chord-credits",$(".pyk-chord-credits").width(),$(".pyk-chord-credits").height(),that.source_name,that.source_link,that.display_credit);
    };

    //----------------------------------------------------------------------------------------
    //5. Render chords
    //----------------------------------------------------------------------------------------
    this.renderChord = function(){
    var that = this;
    
    //5.1 Assign height and width to a local variable because if you are manipulating with h and w then the SVG height and width will not get affected
    var h = this.options.height;
    var w = this.options.width;
    var spinning = '';

    if (this.options.spinning==1)  
        spinning = "pyk-chord spinning";
    else
        spinning = "pyk-chord";
    
        //5.2 Create SVG holder for the chart and the legends
    var svg = d3.select(this.options.selection)
        .append("svg")
        .attr("class", spinning)
        .attr("width", w)
        .attr("height", h)
        .append("g")
        .attr("transform","translate(" + w / 2 + "," + h / 2 + ")");

    var fill = d3.scale.ordinal().range([that.options.color]);
    var innerRadius = Math.min(w,h) * 0.31;
    var outerRadius = innerRadius * 1.1;
    var chord = d3.layout.chord()
        .padding(0.05)
        .sortSubgroups(d3.descending)
        .matrix(that.matrix);

    //5.3 Append Group circumference to svg
    svg.append("g").attr("class", "circumference")
        .selectAll("path")
        .data(chord.groups)
        .enter().append("path")
        .style("fill", function(d) {
        

        return that.color[d.index];
        })
        .style("stroke", function(d) {
        

        return that.color[d.index];
        })
        .attr("d", d3.svg.arc()
          .innerRadius(innerRadius)
          .outerRadius(outerRadius)
         )
        .on("mouseover", fade(0))
        .on("mouseout", fade(1));

    function fade(opacity) {
        return function(g, i) {
        var dt;
        var st = [];
        var ust = [];

        if(opacity === 0){
            $(".spinning").css("-webkit-animation-play-state", "paused");
            $(".spinning").css("animation-play-state", "paused");
        }else{
            $(".spinning").css("-webkit-animation-play-state", "running");
            $(".spinning").css("animation-play-state", "runnin");
        }
        svg.selectAll("g.chord path")
            .filter(function(d,j) {
                dt = d.target.index;
                st[j] = d.source.index;
                return d.source.index != i && d.target.index != i;
            })
            .transition()
            .style("opacity", opacity);
            
                svg.selectAll("g.chordname text")
            .filter(function(d,j) {

                if (i == dt || i == (dt-1) || i == (dt-2) || i == (dt-3) || i == (dt-4) || i == (dt-5) || i == (dt-6) || i == (dt-7) || i == (dt-8) || i == (dt-9))
                {       
$.each(st, function(i, el){
    if($.inArray(el, ust) === -1) ust.push(el);
});
                
                return d.index != i && d.index != ust[0]&& d.index != ust[1]&& d.index != ust[2] && d.index != ust[3] && d.index != ust[4] && d.index != ust[5] && d.index != ust[6] && d.index != ust[7] && d.index != ust[8] && d.index != ust[9] ;

                }
                
            return d.index != i && d.index != dt && d.index != (dt-1) && d.index != (dt-2) && d.index != (dt-3) && d.index != (dt-4) && d.index != (dt-5)&& d.index != (dt-6) && d.index != (dt-7) && d.index != (dt-8) && d.index != (dt-9);
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

        return that.color[d.target.index];

        //return fill(d.target.index);
        })
        .attr("d", d3.svg.chord().radius(innerRadius))
        .style("opacity", 1);

    var ticks = svg.append("svg:g").attr("class", "chordname")
        .selectAll("g")
        .data(chord.groups)
        .enter().append("svg:g")
        .attr("transform", function(d) {
        return "rotate(" + (d.startAngle * 180 / Math.PI - 90) + ")" + "translate(" + outerRadius + ",0)";
        });

    ticks.append("svg:text").attr("x", 8)
        .attr("dy", ".35em")
                .attr("fill", function(d) {
return that.color[d.index];
        })
        .attr("text-anchor", function(d) {
        return d.angle > Math.PI ? "end" : null;
        })
        .attr("transform", function(d) {
        return d.angle > Math.PI ? "rotate(180)translate(-16)" : null;
        })
        .text(function(d) {
        return that.nicks[d.index];
        });

        d3.select(this.options.selection)
            .append("svg")
            .attr("class","pyk-chord-credits")
            .attr("width",w)
            .attr("height",10);
    };


    //----------------------------------------------------------------------------------------
    // 6. Data Manipulations: 
    //----------------------------------------------------------------------------------------
    // Data helpers
    this.generateMatrix = function(){
    var that = this;
    var matrix = [];
    function populateMatrix(){
        for(var i = 0; i < that.nicks.length; i++){
        matrix[i] = [];
        for(var j = 0; j < that.nicks.length; j++){
            matrix[i][j] = 0;
        }
        }
    }
    populateMatrix();
    for(var i in this.relations){
        var r = this.relations[i];
        // Uncomment this if we don't want to messages to self to be shown here
        // if( that.nicks.indexOf(r.from) == that.nicks.indexOf(r.to)) continue;
        matrix[that.nicks.indexOf(r.from)][that.nicks.indexOf(r.to)] = r.messages;
    }
    this.matrix = matrix;
    };

    //----------------------------------------------------------------------------------------
    // 7. Return the Chat  
    //----------------------------------------------------------------------------------------
  return this;
};
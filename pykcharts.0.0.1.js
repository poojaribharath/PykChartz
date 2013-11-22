
PykCharts.choroplethOneLayer = function(options){
    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------

    this.execute = function(){
    //1.1 Validate the options passed
        if(!this.validate_options()) return false;

        // 1.2 Preload animation
        $(this.options.selection).html("<img src='https://s3.amazonaws.com/PykCharts/spinner.gif'> Loading... Please wait");

        //1.3 Assign Global variable var that to access function and variable throughout
        var that = this;
        that.h = this.options.height;
        that.w = this.options.width;
        that.cs = this.options.colorscale;
        that.cc = this.options.colorcode;
        that.color_domain=[];

        var opt = this.options;


        // //1.3 Read Json File Get all the data and pass to render
        d3.json(opt.topojson, function(e, topology){
            d3.json(opt.state_data, function(e, state_data){
                that.render(topology, state_data);
            });
        });
    };

    //----------------------------------------------------------------------------------------
    //2. Validate Options
    //----------------------------------------------------------------------------------------
    this.validate_options = function(){
    if(this.options.selection === undefined) return false;
    if(this.options.topojson === undefined) return false;
    if(this.options.state_data === undefined) return false;
    if(this.options.width === undefined) return false;
    if(this.options.height === undefined) return false;
    if(this.options.colorscale === undefined) return false;
    if(this.options.colorcode === undefined) return false;
    return true;
    };

    //----------------------------------------------------------------------------------------
    //3. Assigning Attributes
    //----------------------------------------------------------------------------------------
    this.options = jQuery.extend({
    scale: 5,
    initScale: 1.0
    }, options);


    //----------------------------------------------------------------------------------------
    //4. Render function to create the chart
    //----------------------------------------------------------------------------------------
   //4.1 Clear existing HTML inside Selection DIV ID
    this.render = function(t, s){
    var that = this;
    $(this.options.selection).html("");

   //4.2 Get the maximum value from data to set ordinal scale
    if(that.cs=="ordinal")
    {
        for(var key in s)
        {
            that.color_domain.push(s[key].data);
        }
        that.max = d3.max(that.color_domain);
    }

    //4.3 Create SVG holders for legends
    this.legends_group = d3.select(this.options.selection).append("svg")
        .attr("class", "pyk-choropleth-legend-holder")
        .attr("height", 30)
        .attr("width", that.w);

    //4.4 Create SVG holders for map
    this.map_group = d3.select(this.options.selection).append("svg")
        .attr("class", "pyk-choropleth-map-holder")
        .attr("width", that.w)
        .attr("height", that.h-100);


    //4.5 Draw the elements after creating the holder
    this.renderTooltip();
    this.draw(t, s);

    };

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
    };

      //----------------------------------------------------------------------------------------
    // 6.Draw function to render chart with elements:
    //----------------------------------------------------------------------------------------
    this.draw = function(t, s){
        // can pass any object to render the legends
        // TODO Check if 0 will always be an ID
        this.renderLegends(t,s);
        // 6.1 render map with t= topojson data, s= states data
        this.renderMaps(t, s, function() {
    });

    };

    //----------------------------------------------------------------------------------------
    // 7.Draw function to render Legends:
    //----------------------------------------------------------------------------------------

    this.renderLegends = function(t, s){
        var that = this;
        if(that.cs=="ordinal")
        {
            onetenth = d3.format(".1f")(that.max/10);
            for(var k=1;k<=10;k++)
            {
                legend = d3.round(onetenth * (k + 0.5));
                this.legends_group.append("circle")
                    .attr("cx",k*50)
                    .attr("cy",20)
                    .attr("r",5)
                    .attr("fill","green")
                    .attr("opacity",k/10);
                this.legends_group.append("text")
                    .attr("x", (k*50)+7)
                    .attr("y", 24)
                    .style("font-size", 10)
                    .style("font", "Arial")
                    .text("< "+legend);
            }
        }
    }

    //----------------------------------------------------------------------------------------
    // 8.Draw function to render map:
    //----------------------------------------------------------------------------------------
    this.renderMaps = function(t, s){
    var that = this;
    var projection = d3.geo.mercator()
        .scale(800)
        .translate([-900,550 ]);

    var path = d3.geo.path()
        .projection(projection);

    // 8.1 set scale width and height map and variables to be used to implement ordinal scale
    var scale = this.options.initScale * this.options.scale;

    // 8.2 Set local variable
    var a=0,b=0;

    // 8.3 remove existing group before loading
    var map_group = this.map_group;
    this.map_group.selectAll("g").remove();

    // 8.4 Append state group
    var states_g = map_group.append("g").attr("class","states");


    // 8.5 Append state path
    states_g.selectAll("path")
    .data(topojson.feature(t, t.objects.collection).features)
        .enter().append("path")
        .attr("data-id", function(d,i){
        return d.id;
        })
        .attr("transform", function(d,i){
        return "scale(" + that.options.initScale + ")";
        })
        .attr("class", function (d,i) {return d.id;})
        .on("mouseover", function (d, i) {
            for(var key in s)
            {
                if(key==d.id)
                {
                    var tooltip = s[key].tooltip;
                    that.tooltip.html(tooltip);
                    that.tooltip.style("visibility", "visible");
                    break;
                }
            }
        })
        .on("mousemove", function(){
            var yReduce = parseInt(that.tooltip.style("height")) + 40;
            var xReduce = parseInt(that.tooltip.style("width")) / 2;
            that.tooltip.style("top", (event.pageY- yReduce)+"px")
                .style("left",(event.pageX-xReduce)+"px");
        })
        .on("mouseout", function(){
            that.tooltip.style("visibility", "hidden");
        })
        .attr("fill", function (d, i) {
            if(that.cs=="linear")
            {
                for(var key in s)
                {
                    if(key==d.id)
                    {
                        return s[key].color;
                        break;
                    }
                }
            }
            else if(that.cs=="ordinal")
            {
                return that.cc;
            }
        })
        .attr("opacity", function (d, i) {
            if(that.cs=="linear")
            {
                return 1;
            }
            else if(that.cs=="ordinal")
            {
                for(var key in s)
                {
                    if(key==d.id)
                    {
                        a++;
                        return that.colorOpacity(s[key].data);
                        break;
                    }
                }
                b++;
                if(a!=b)
                {
                    a++;
                    return 0.1;
                }
            }
        })
        .attr("d", path);
    };

    //----------------------------------------------------------------------------------------
    // 9. Do Maths
    //----------------------------------------------------------------------------------------
    this.colorOpacity = function (cdata){
        var that = this;
        that.opacity = d3.format(".1f")(cdata/that.max);
        if(that.opacity==0.0)
        {
            that.opacity=0.1;
        }
        return that.opacity;
    }

    //----------------------------------------------------------------------------------------
    // 10. Return the Chart
    //----------------------------------------------------------------------------------------

  return this;
};
PykCharts.BubblePack = function (options) {

    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------
    this.execute = function () {
        //1.3 Assign Global variable var that to access function and variable throughout   
        var that = this;

        // 1.2 Read Json File Get all the data and pass to render
        d3.json(options.data, function (e, data) {
            that.data = data;
            that.render();
            that.renderTooltip();

        });
    };


    //----------------------------------------------------------------------------------------
    //2. Render function to create the chart
    //----------------------------------------------------------------------------------------
    this.render = function () {
        var that = this;

        // 2.1 Set diameter and color scale
        var diameter = 600,
            format = d3.format(",d"),
            color = d3.scale.category20c();


        // 2.2 Set d3 Layout as bubble
        var bubble = d3.layout.pack()
            .sort(null)
            .size([diameter, diameter])
            .padding(1.5);

        // 2.3 Append Svg holder 
        var svg = d3.select(options.selection).append("svg")
            .attr("width", diameter)
            .attr("height", diameter)
            .attr("class", "bubble");

        var CircleScale = d3.scale.linear()
            .domain([0, 10000])
            .range([0, diameter]);


        d3.json(options.data, function (error, root) {
            var node = svg.selectAll(".node")
                .data(bubble.nodes(classes(root))
                    .filter(function (d) {
                        return !d.children;
                    }))
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });


            node.append("title")
                .text(function (d) {
                    return d.className + ": " + format(d.value);
                });

            node.append("circle")
                .attr("r", function (d) {
                    return d.r;
                })
                .on("mouseover", function (d) {
                    return that.tooltip.html(d.tip).style("visibility", "visible");
                })
            //	.on("mouseover", function(d){return   console.log("tooltip:" + d.tip);})

            .on("mousemove", function () {
                return that.tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
            })

            .on("mouseout", function () {
                return that.tooltip.style("visibility", "hidden");
            })

            .style("fill", function (d) {
                return color(d.packageName);
            });

            node.append("text")
                .attr("dy", ".3em")
                .style("text-anchor", "middle")
                .text(function (d) {
                    return d.className.substring(0, d.r / 3);
                });
        });

        // Returns a flattened hierarchy containing all leaf nodes under the root.
        function classes(root) {
            var classesArray = [];

            function recurse(name, node) {
                if (node.children) node.children.forEach(function (child) {
                    recurse(node.name, child);
                });
                else {
                    console.log("className:" + node);
                    console.log("ttip:" + node.ttip);
                    console.log("color:" + node.colors);

                    classesArray.push({
                        packageName: name,
                        className: node.name,
                        value: node.size,
                        tip: node.ttip,
                        color: node.colors
                    });
                }
            }

            recurse(null, root);
            console.log("classes:" + classesArray);
            return {
                children: classesArray
            };
        }

        d3.select(self.frameElement).style("height", diameter + "px");

    };


    //----------------------------------------------------------------------------------------
    //3. Render function to create the chart
    //----------------------------------------------------------------------------------------

    this.renderTooltip = function () {

        $("#pyk-bubble-tooltip").remove();
        this.tooltip = d3.select("body")
            .append("div").attr("id", "pyk-bubble-tooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("background", "#fff")
            .style("padding", "10px 20px")
            .style("box-shadow", "0 0 10px #000")
            .style("border-radius", "5px")
            .text("a simple tooltip");

    };
};
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
        //4.1 get the texts contents & assign to nick variable
    this.nicks = this.frequency.map(function(d){return d.nick;});
        this.color = this.frequency.map(function(d){return d.color;});
        //4.2 Manipulations Json data represent dataformat required by chors 
    this.generateMatrix();
        //4.3 Call render chors to display chord svg
    this.renderChord();
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
        $(this.options.selection).html("<img src='https://s3.amazonaws.com/PykCharts/spinner.gif'> Loading... Please wait");

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
    };

    //----------------------------------------------------------------------------------------
    //2. Validate Options
    //----------------------------------------------------------------------------------------
    this.validate_options = function(){
    if(this.options.selection === undefined) return false;
    if(this.options.topojson === undefined) return false;
    if(this.options.county_data === undefined) return false;
    if(this.options.state_data === undefined) return false;
    return true;
    };

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

    };

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
    };

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

    };

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

}       that.draw(t,s,c);
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
    };

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
        return "scale(" + that.options.initScale + ")";
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
        that.tooltip.style("top", (d3.event.pageY- yReduce)+"px").style("left",(d3.event.pageX-xReduce)+"px");
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
        return "scale(" + that.options.initScale + ")";
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
        that.tooltip.style("top", (d3.event.pageY- yReduce)+"px").style("left",(d3.event.pageX-xReduce)+"px");
        })
        .on("mouseout", function(){
        that.tooltip.style("visibility", "hidden");
        });

        var legend = this.downlegend_group.selectAll("g.legend")
        .data(ext_color_domain)
        .enter().append("g")
        .attr("class", "legend");

        ls_w = 60;
        ls_h = 7;

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
    };

    //----------------------------------------------------------------------------------------
    // 8. Return the Chart
    //----------------------------------------------------------------------------------------
  return this;
};

/*jshint -W083 */
PykCharts.GoogleHeat = function(options){
    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------
       this.execute = function(){
    //1.1 Validate the options passed   
    if(!this.validate_options()) return false;
    
    //1.2 Fetch container div set height width   
    this.container = $(this.options.selection);
    this.div = $("<div>")
        .css("height", this.options.height + "px")
        .css("width", this.options.width + "px");

    this.container.append(this.div);

    //1.3 Assign Global variable var that to access function and variable throughout   
    var that = this;

    // 1.4 Read Json File Get all the data and pass to render
    $.getJSON(this.options.data, function(data){
        that.data = data;
        that.render();
    });
    };

    //----------------------------------------------------------------------------------------
    //2. Validate Options
    //----------------------------------------------------------------------------------------
    this.validate_options = function(){
    if(this.options.selection === undefined) return false;
    if(this.options.data === undefined) return false;
    return true;
    };

    //----------------------------------------------------------------------------------------  
    //3. Assigning Attributes
    //----------------------------------------------------------------------------------------
    this.options = jQuery.extend({
    width: 960,
    height: 500,
    center: new google.maps.LatLng(-25.363882,131.044922),
    defaultZoom: 3,
    tooltipZoom: 4

    }, options);
    
    //----------------------------------------------------------------------------------------
    //4. Render function to create the chart
    //----------------------------------------------------------------------------------------
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
    };
    
    //----------------------------------------------------------------------------------------
    //5. Set up the styles to be displayed
    //----------------------------------------------------------------------------------------
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
    };

     //----------------------------------------------------------------------------------------
    //6. Set up Heat Map
    //----------------------------------------------------------------------------------------
   this.setupHeat = function(){
    var pointArray = new google.maps.MVCArray(this.heatData());
    var heatmap = new google.maps.visualization.HeatmapLayer({
        data: pointArray
    });
    heatmap.setMap(this.map);
    };

    this.setupMarkers = function(){
    var that = this;
    var mgr = new MarkerManager(that.map);

    var markers = [];
    for(var i in this.data){
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
            };
        }(infowindow));
    }
    google.maps.event.addListener(mgr, 'loaded', function(){
        mgr.addMarkers(markers, that.options.tooltipZoom);
        mgr.refresh();
    });
    };

    //----------------------------------------------------------------------------------------
    //7. Manuplating Data to the json format
    //----------------------------------------------------------------------------------------
    this.heatData = function(){
    var d = [];
    for(var i in this.data){
        var p = this.data[i];
        var o = new google.maps.LatLng(p.latitude, p.longitude);
        d.push({location: o, weight: p.count});
    }
    return d;
    };

    
    return this;
};

PykCharts = {};

/*jshint -W083 */
PykCharts.compare_with_circles = function (options) {

    function truncate(str, maxLength, suffix) {
        if (str.length > maxLength) {
            str = str.substring(0, maxLength + 1);
            str = str.substring(0, Math.min(str.length, str.lastIndexOf(" ")));
            str = str + suffix;
        }
        return str;
    }

    var margin = {
        top: 20,
        right: 200,
        bottom: 0,
        left: 20
    },
        width = options.width,
        height = options.height;

    var start_year = 2007,
        end_year = 2013;

    var c = d3.scale.category20c();

    var x = d3.scale.linear()
        .range([0, width]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(5)
        .orient("top");

    var formatYears = d3.format("0000");
    xAxis.tickFormat(formatYears);

    var svg = d3.select(options.selection).append("svg")
        .attr("class", "pyk-compare_with_circles")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("margin-left", margin.left + "px")
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.json(options.data, function (data) {
        x.domain([start_year, end_year]);
        var xScale = d3.scale.linear()
            .domain([start_year, end_year])
            .range([0, width]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + 0 + ")")
            .call(xAxis);

        for (var j = 0; j < data.length; j++) {
            var g = svg.append("g").attr("class", "first row");

            var circles = g.selectAll("circle")
                .data(data[j].test)
                .enter()
                .append("circle");

            var text = g.selectAll("text")
                .data(data[j].test)
                .enter()
                .append("text");

            var rScale = d3.scale.linear()
                .domain([0, d3.max(data[j].test, function (d) {
                    return d[1];
                })])
                .range([2, 12]);

            circles
                .attr("cx", function (d, i) {
                    return xScale(d[0]);
                })
                .attr("cy", j * 30 + 30)
                .attr("r", function (d) {
                    return rScale(d[1]);
                })
                .style("fill", function (d) {
                    return c(j);
                });

            text
                .attr("y", j * 30 + 35)
                .attr("x", function (d, i) {
                    return xScale(d[0]) - 5;
                })
                .attr("class", "value")
                .text(function (d) {
                    return d[1];
                })
                .style("fill", function (d) {
                    return c(j);
                })
                .style("display", "none");

            g.append("text")
                .attr("y", j * 30 + 35)
                .attr("x", width + 20)
                .attr("class", "label")
                .text(truncate(data[j].name, 30, "..."))
                .style("fill", function (d) {
                    return c(j);
                })
                .on("mouseover", mouseover)
                .on("mouseout", mouseout);
        }

        function mouseover(p) {
            var g = d3.select(this).node().parentNode;
            d3.select(g).selectAll("circle").style("display", "none");
            d3.select(g).selectAll("text.value").style("display", "block");
        }

        function mouseout(p) {
            var g = d3.select(this).node().parentNode;
            d3.select(g).selectAll("circle").style("display", "block");
            d3.select(g).selectAll("text.value").style("display", "none");
        }
    });

};
/* jshint -W083 */
PykCharts.River = function(options){

    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------
    this.execute = function(){

        //1.1 Validate the options passed
        if(!this.validate_options()) return false;

        // 1.2 Preload animation
        $(this.options.selection).html("<img src='https://s3.amazonaws.com/PykCharts/spinner.gif'> Loading... Please wait");

        //1.3 Assign Global variable var that to access function and variable throughout
        var that = this;
        var opt = this.options;

        // 1.4 Read Json File Get all the data and pass to render
        d3.json(opt.data, function(e, data){
            that.data = data;
            that.render();
        });
    };

    //----------------------------------------------------------------------------------------
    //2. Validate Options
    //----------------------------------------------------------------------------------------
    this.validate_options = function(){
        if(this.options.selection === undefined) return false;
        if(this.options.data === undefined) return false;
        if(this.options.width < 300) return false;
        return true;
    };

    //----------------------------------------------------------------------------------------
    //3. Assigning Attributes
    //----------------------------------------------------------------------------------------
    this.options = jQuery.extend({
        width: 960,
        height: 200,
        filterList: [],
        fullList: [],
        extended: false
    }, options);

    //----------------------------------------------------------------------------------------
    //4. Render function to create the chart
    //----------------------------------------------------------------------------------------
    this.render = function(){
        //4.1 Clear existing HTML inside Selection DIV ID
        $(this.options.selection).html("");

        //4.2 Assign height and width to a local variable
        var h = this.options.height;
        var w = this.options.width;

        //4.3 Create SVG holder for the chart and the legends
        this.svg = d3.select(this.options.selection)
            .append("svg")
            .attr("class", "pyk-river")
            .attr("height", h)
            .attr("width", w);

        //4.3 Create legends holder
        this.legends_group = this.svg.append("g")
            .attr("class", "legend-holder")
            .attr("transform", "translate(0,15)");

        //4.3 Create map holder
        this.map_group = this.svg.append("g")
            .attr("class", "map-holder");

        //4.4 Render elements
        this.renderTooltip();
        this.draw();
    };

    //----------------------------------------------------------------------------------------
    //5. Render Tooltip
    //----------------------------------------------------------------------------------------
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
    };

    //----------------------------------------------------------------------------------------
    //6. Draw function to render legends & charts
    //----------------------------------------------------------------------------------------
    this.draw = function(){

        //6.1 call render legends to display legends
        this.renderLegends();
        //6.2 call render legends to display charts
        this.renderChart();
    };

    //----------------------------------------------------------------------------------------
    //7. Draw function to render legends & charts
    //----------------------------------------------------------------------------------------
    this.renderLegends = function(){
        var that = this;

        //7.1 Extended & Stream Options
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
        ];

        //7.2 Append text data to legend holder
        var texts = this.legends_group.select("g.option-holder").selectAll("text").data(options);
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


        //7.3 Append circle to legend holder
        var circles = this.legends_group.select("g.option-holder").selectAll("circles").data(options);
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

        //7.4  Legends for different datasets
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


        for(var i in legends){
            var group = d3.select(groups[i]);

            group.selectAll("text").data([legends[i]]).enter().append("text")
                .text(function(d){
                    that.options.filterList.push(d.name);
                    that.options.fullList.push(d.name);
                    return d.name;
                })
                .attr("transform", "translate(20,-1)");

            var c = group.selectAll("circle").data([legends[i]]);

            c.enter().append("circle");

            c.attr("cx", 9).attr("cy",-6).attr("r", 6)
                .attr("style", function(d){
                    var fill = (that.options.filterList.indexOf(d.name) === -1) ? "#fff" : d.color;
                    if(that.options.filterList.length === 0) fill = d.color;
                    return "fill: "+ fill +"; stroke-width: 3px; stroke:" + d.color;
                });
        }
    };


    //----------------------------------------------------------------------------------------
    //8. Draw function to render legends & charts
    //----------------------------------------------------------------------------------------
    this.renderChart = function(){
        var tData = jQuery.extend(true, [], this.data);
        var legendHeight = 40;
        var that = this;


        //8.1 Filtering & Parsing Data
        tData = this.filter(tData);
        tData = this.parseData(tData);
        var maxTotalVal = this.maxTotal(tData);

        //8.2 Sizes & Scales
        var width = this.options.width;
        var height = this.options.height;
        var xScale = d3.scale.linear().domain([0, maxTotalVal]).range([0, width - 200]);
        var yScale = d3.scale.linear().domain([0, height]).range([legendHeight, height]);
        var barHeight = (height) / (tData.length * 2);
        var barMargin = barHeight * 2;

        var svg = this.map_group;

        //8.3 Setting up Top: Graph Lines
        svg.selectAll("line.top_line").data(tData).enter()
            .append("line").attr("class", "top_line")
            .attr("x1", 0).attr("x2", width)
            .attr("y1", function(d, i){
                return yScale(i * barMargin);
            })
            .attr("y2", function(d, i){
                return yScale(i * barMargin);
            });


        //8.4 Setting up Bottom: Graph Lines
        svg.selectAll("line.bottom_line").data(tData).enter()
            .append("line").attr("class", "bottom_line")
            .attr("x1", 0).attr("x2", width)
            .attr("y1", function(d, i){
                return yScale((i * barMargin) + barHeight);
            })
            .attr("y2", function(d, i){
                return yScale((i * barMargin) + barHeight);
            });

        //8.5 SVG Groups for holding the bars
        var groups = svg.selectAll("g.bar-holder").data(tData);

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

        //8.6 SVG Groups for holding the bars
        var bar_holder = svg.selectAll("g.bar-holder")[0];
        for(var i in tData){
            var group = bar_holder[i];
            var breakup = tData[i].breakup;


            //8.7 Append Rectangles elements to  bar holder
            var rects = d3.select(group).selectAll("rect").data(breakup);

            rects.enter().append("rect").attr("width", 0);

            rects.transition().duration(1000)
                .attr("x", function(d, i){
                    if (i === 0) return 0;
                    var shift = 0;
                    for(var j = 0; j < i; j++){
                        shift += breakup[j].count;
                    }
                    return xScale(shift);
                })
                .attr("y", 0)
                .attr("height", function(d, i){
                    //8.8 Scale the height according to the available height
                    return (barHeight * (height - legendHeight)) / height;

                })
                .attr("width", function(d,i){
                    return xScale(d.count);
                });

            rects.attr("style", function(d,i){
                return "fill: " + d.color;
            })
                .on("mouseover", function(d, i){
                    var tooltip = d3.select("#river-tooltip");
                    tooltip.html(d.tooltip);
                    tooltip.style("visibility", "visible");
                })
                .on("mousemove", function(){
                    var tooltip = d3.select("#river-tooltip");
                    var yReduce = parseInt(tooltip.style("height")) + 40;
                    var xReduce = parseInt(tooltip.style("width")) / 2;
                    tooltip.style("top", (d3.event.pageY- yReduce)+"px").style("left",(d3.event.pageX-xReduce)+"px");
                })
                .on("mouseout", function(){
                    var tooltip = d3.select("#river-tooltip");
                    tooltip.style("visibility", "hidden");
                })
                .on("click", function(d, i){
                    that.onlyFilter(d.name);
                });

            rects.exit().transition().duration(1000).attr("width", 0).remove();
        }

        //8.9 Display Name labels
        var display_name = svg.selectAll("text.cool_label").data(tData);

        display_name.enter().append("text").attr("class", "cool_label");

        display_name.attr("x", width)
            .attr("y", function(d, i){
                return yScale((i * barMargin) + (barHeight/2) + 5);
            })
            .text(function(d, i){
                return d.breakupTotal + " " + d.technical_name;
            });


        //8.10 Left side labels with totals
        var left_labels = svg.selectAll("text.left_label").data(tData);

        left_labels.enter().append("svg:text").attr("class", "left_label");

        left_labels
            .attr("y", function(d, i){
                return yScale((i * barMargin) + (barHeight/2) + 5);
            })
            .attr("x", 0)
            .text(function(d,i){
                return d.display_name;
            });


        //8.11 Right side labels with time duration
        var right_labels = svg.selectAll("text.right_label").data(tData);

        right_labels.enter().append("svg:text").attr("class", "right_label");

        right_labels
            .attr("y", function(d, i){
                return yScale((i * barMargin) + (barHeight * 1.5) + 5);
            })
            .attr("x", width)
            .text(function(d,i){
                if(tData[i+1] === undefined){
                    return "";
                }
                return d.duration;
            });



        if(this.extended) {
            $("line.left_line").fadeOut();
            $("line.right_line").fadeOut();
            return;
        } //No need for angle lines if its extended

        //8.12 Setting up Left side angle lines
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


        //8.13 Calibrating Right side angle lines
        var right_angles = svg.selectAll("line.right_line").data(tData);

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


    };

    //----------------------------------------------------------------------------------------
    //9. Data Manuplation
    //----------------------------------------------------------------------------------------
    // Data Helpers
    this.filter = function(d){
        if(this.options.filterList.length < 1){
            this.options.filterList = jQuery.extend(true, [], this.options.fullList);
        }

        for(var i in d){
            var media = d[i].breakup;
            var newMedia = [];
            for(var j in media){
                if (jQuery.inArray(media[j].name, this.options.filterList) >= 0) newMedia.push(media[j]);
            }
            d[i].breakup = newMedia;
        }
        return d;
    };

    this.onlyFilter = function(f){
        var index = this.options.filterList.indexOf(f);
        if(this.options.filterList.length === 1 && index != -1){
            // if its the only item on the list, get rid of it
            this.options.filterList = [];
        }else{
            // otherwise empty the list and add this one to it
            this.options.filterList = [];
            this.options.filterList.push(f);
        }
        this.draw();
    };

    this.toggleFilter = function(f){
        var index = this.options.filterList.indexOf(f);
        if(index === -1){
            this.options.filterList.push(f);
        }else{
            this.options.filterList.splice(index, 1);
        }
        this.draw();
    };

    this.totalInBreakup = function(breakup){
        var total = 0;
        for(var i in breakup) total += breakup[i].count; // Add all the counts in breakup to total
        return total;
    };

    this.maxTotal = function(d){
        var totals = [];
        for(var i in d) totals.push(d[i].breakupTotal); // Get all the breakupTotals in an Array
        totals = totals.sort(function(a,b){return a - b;}); // Sort them in ascending order
        return totals[totals.length - 1]; // Give the last one
    };

    this.parseData = function(d){
        for(var i in d) d[i].breakupTotal = this.totalInBreakup(d[i].breakup); // Calculate all breakup totals and add to the hash
        return d;
    };



    return this;
};

PykCharts.treerect = function (options) {


    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------
    this.execute = function () {
        //1.1 Assign Global variable var that to access function and variable throughout   
        var that = this;

        //1.2 set width height to local variable   
        width = this.options.width;
        height = this.options.height;

        // 1.3 Read Json File Get all the data and pass to render
        d3.json(options.data, function (e, data) {
            that.data = data;
            that.render();
            that.renderTooltip();

        });
    };

    //----------------------------------------------------------------------------------------
    //2. setting up options
    //----------------------------------------------------------------------------------------
    this.options = jQuery.extend({
        width: 550,
        height: 400
    }, options);

    //----------------------------------------------------------------------------------------
    //3. Render chart
    //----------------------------------------------------------------------------------------
    this.render = function () {
        var that = this;

        //2.1 Assign height and width to a local variable because if you are manipulating with h and w then the SVG height and width will not get affected
        var w = width - 60,
            h = height - 135,
            x = d3.scale.linear().range([0, w]),
            y = d3.scale.linear().range([0, h]),
            root,
            node;

        //2.2 Set D3 layout as tree layout
        var treemap = d3.layout.treemap()
            .round(false)
            .size([w, h])
            .sticky(true)
            .value(function (d) {
                return d.size;
            });

        //2.3 SVG Holder for Chart
        var svg = d3.select(options.selection).append("div")
            .attr("class", "chart")
            .style("width", w + "px")
            .style("height", h + "px")
            .append("svg:svg")
            .attr("width", w)
            .attr("height", h)
            .append("svg:g")
            .attr("transform", "translate(.5,.5)");

        d3.json(options.data, function (data) {
            node = root = data;

            var nodes = treemap.nodes(root)
                .filter(function (d) {
                    return !d.children;
                });

            //2.4 Append group element to hold chart
            var cell = svg.selectAll("g")
                .data(nodes)
                .enter().append("svg:g")
                .attr("class", "cell")
                .attr("transform", function (d) {
                    return "translate(" + d.x + "," + d.y + ")";
                });

            //2.5 Append rect element to chart
            cell.append("svg:rect")
                .attr("width", function (d) {
                    return d.dx - 1;
                })
                .attr("height", function (d) {
                    return d.dy - 1;
                })
                .on("mouseover", function (d) {
                    return that.tooltip.html(d.ttip).style("visibility", "visible");
                })
                .on("mousemove", function () {
                    return that.tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
                })
                .on("mouseout", function () {
                    return that.tooltip.style("visibility", "hidden");
                })
                .style("fill", function (d) {
                    return d.colors;
                });


            //2.6 Append logos element to rect
            cell.append("image")
                .attr("xlink:href", function (d) {
                    return d.img;
                })
                .attr("x", 10)
                .attr("y", 7)
                .attr("width", 17.92)
                .attr("height", 16);



            //2.6 Append text element to chart
            cell.append("svg:text")
                .attr("x", function (d) {
                    return d.dx / 2;
                })
                .attr("y", function (d) {
                    return d.dy / 2;
                })
                .attr("dy", ".35em")
                .attr("text-anchor", "middle")
                .text(function (d) {
                    return d.name;
                })
                .attr("fill", "white")
                .style("opacity", function (d) {
                    d.w = this.getComputedTextLength();
                    return d.dx > d.w ? 1 : 0;
                });

        });

        function size(d) {
            return d.size;
        }

        function count(d) {
            return 1;
        }

    };

    //----------------------------------------------------------------------------------------
    //4. Render Tooltip
    //----------------------------------------------------------------------------------------
    this.renderTooltip = function () {

        $("#pyk-tree-tooltip").remove();
        this.tooltip = d3.select("body")
            .append("div").attr("id", "pyk-tree-tooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("background", "#fff")
            .style("padding", "10px 20px")
            .style("box-shadow", "0 0 10px #000")
            .style("border-radius", "5px")
            .text("a simple tooltip");

    };
};
/*jshint -W083 */
PykCharts.Ultimate = function(options){
    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------
    this.execute = function(){
        // 1.1 Validate the option parameters
       if(!this.validate_options()) return false;

        // 1.2 Preload animation
        $(this.options.selection).html("<img src='https://s3.amazonaws.com/PykCharts/spinner.gif'> Loading... Please wait");

        // 1.3 Global Variable
        var that = this;

        // 1.4 Read the input data file(s)
        d3.json(this.options.data, function(e, data){
            // Assign it to global accesstor variable
            that.data = data;
            // Render Chart with the available data
            that.render();
        });
    };

    //----------------------------------------------------------------------------------------
    //2. Validate Options
    //----------------------------------------------------------------------------------------
    this.validate_options = function(){
        if(this.options.selection === undefined) return false;
        if(this.options.data === undefined) return false;
        if(this.options.width < 300) return false;
        return true;
    };

    //----------------------------------------------------------------------------------------
    //3. Assigning Attributes
    //----------------------------------------------------------------------------------------
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


    //----------------------------------------------------------------------------------------
    //4. Render function to create the chart
    //----------------------------------------------------------------------------------------
    this.render = function(){
        //4.1 Clear existing HTML inside Selection DIV ID
        $(this.options.selection).html("");

        //4.2 Assign height and width to a local variable because if you are manipulating with h and w then the SVG height and width will not get affected
        var h = this.options.height;
        var w = this.options.width;

        //4.3 SVG Holder for Chart, Legend, ... other elements
        this.svg = d3.select(this.options.selection)
            .append("svg")
            .attr("class", "pyk-ultimate")
            .attr("height", h)
            .attr("width", w);

              //4.4 Add other elements to the SVG Holder
        this.svg.append("g").attr("class", "yaxis");
        this.svg.append("g").attr("class", "xaxis");

        //4.5 Create Legend Holder
        this.legends_group = this.svg.append("g")
            .attr("class", "legend-holder")
            .attr("background", "Red")
            .attr("transform", "translate(0,15)");

        //4.5 Create Chart Holder
        this.chart_group = this.svg.append("g")
            .attr("class", "chart-holder")
            .attr("width", w - (this.options.margins.right + this.options.margins.left))
            .attr("height", h - (this.options.margins.top + this.options.margins.bottom))
            .attr("transform", "translate(" + this.options.margins.left + "," + this.options.margins.top + ")");

        //4.7 Data Manipulations
        var fD = this.flattenData();
        this.the_bars = fD[0];
        this.the_keys = fD[1];
        this.the_layers = this.layers(this.the_bars);

        // Render elements
        this.renderTooltip();
        this.draw();
    };

    //----------------------------------------------------------------------------------------
    // 5. Rendering Legends:
    //----------------------------------------------------------------------------------------
  this.renderLegends = function(){
        var that = this;
        var w = this.options.width;

        function getParameters(){
            var p = [];
            for(var i in  that.the_layers){
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

        var params = getParameters();

        var legendGroups = this.legends_group.selectAll("g.legend_group").data(params)
            .enter()
            .append("g")
            .attr("class", "legend_group")
            .attr("transform", function(d,i){
                return "translate(" + (w-(i*100)-100) + ", 0)";
            });

        for(var i in params){
            var g = d3.select(legendGroups[0][i]);
            var p = params[i];

            var texts = g.append("text")
                .text(function(d){
                    return p.name;
                })
                .attr("x", function(d,i){
                    return i * 40;
                })
                .attr("dy", -3);

            var circles = g.append("circle")
                .attr("cx", function(d,i){
                    return (i*100)-10;
                })
                .attr("cy",-6).attr("r", 6)
                .attr("style", function(d){
                    return "fill: "+ d.color +"; stroke-width: 3px; stroke:" + d.color;
                });

        }
        // TODO Make legends
    };

    //----------------------------------------------------------------------------------------
    // 6. Rendering Legends:
    //----------------------------------------------------------------------------------------
    this.getGroups = function(){
        var groups = {};
        for(var i in this.the_bars){
            var bar = this.the_bars[i];
            if(!bar.id) continue;
            if(groups[bar.group]){
                groups[bar.group].push(bar.id);
            }else{
                groups[bar.group] = [bar.id];
            }
        }
        return groups;
    };

    //----------------------------------------------------------------------------------------
    // 7. Rendering chart:
    //----------------------------------------------------------------------------------------
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

        var yValues = [];
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
                return "rotate(90)";
            });


        var group_label_data = [];
        for(var i in groups){
            var g = groups[i];
            var x = xScale(g[0]);
            var totalWidth = xScale.rangeBand() * g.length;
            x = x + (totalWidth/2);
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
                return d.values;
            }).enter().append("svg:rect")
            .attr("height", 0).attr("y", h)
            .on("mouseover", function(d, i){
                 var tooltip = d3.select("#pyk-ultimate-tooltip");
                tooltip.html(d.tooltip);
                tooltip.style("visibility", "visible");
            })
            .attr("fill", function(d){
                return d.color;
            })
            .on("mousemove", function(){
                      var tooltip = d3.select("#pyk-ultimate-tooltip");
           var yReduce = parseInt(tooltip.style("height")) + 40;
                var xReduce = parseInt(tooltip.style("width")) / 2;
                tooltip.style("top", (d3.event.pageY- yReduce)+"px").style("left",(d3.event.pageX-xReduce)+"px");
            })
            .on("mouseout", function(){
                 var tooltip = d3.select("#pyk-ultimate-tooltip");
                tooltip.style("visibility", "hidden");
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
    };

    //----------------------------------------------------------------------------------------
    // 8. Draw function to render chart with elements
    //----------------------------------------------------------------------------------------
    this.draw = function(){
        this.renderLegends();
        this.renderChart();
    };

    //----------------------------------------------------------------------------------------
    // 9. Rendering tooltip:
    //----------------------------------------------------------------------------------------
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
    };

    //----------------------------------------------------------------------------------------
    // 10.Data Manuplation:
    //----------------------------------------------------------------------------------------

    // Data Helpers
    // Takes the flattened data and returns layers
    // Each layer is a separate category
    // The structure of the layer is made so that is plays well with d3.stack.layout()
    // Docs - https://github.com/mbostock/d3/wiki/Stack-Layout#wiki-values
    this.layers = function(the_bars){
        var layers = [];

        function findLayer(l){
            for(var i in layers){
                var layer = layers[i];
                if (layer.name == l) return layer;
            }
            return addLayer(l);
        }

        function addLayer(l){
            var new_layer = {
                "name": l,
                "values": []
            };
            layers.push(new_layer);
            return new_layer;
        }

        for(var i in the_bars){
            var bar = the_bars[i];
            if(!bar.id) continue;
            var id = bar.id;
            for(var k in bar){
                if(k === "id") continue;
                var icings = bar[k];
                for(var j in icings){
                    var icing = icings[j];
                    if(!icing.name) continue;
                    var layer = findLayer(icing.name);
                    layer.values.push({
                        "x": id,
                        "y": icing.val,
                        "color": icing.color,
                        "tooltip": icing.tooltip
                    });
                }
            }
        }
        return layers;
    };

    // Traverses the JSON and returns an array of the 'bars' that are to be rendered
    this.flattenData = function(){
        var the_bars = [-1];
        var keys = {};
        for(var i in this.data){
            var d = this.data[i];
            for(var cat_name in d){
                for(var j in d[cat_name]){
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
    };

    //----------------------------------------------------------------------------------------
    // 11.Return Chart:
    //----------------------------------------------------------------------------------------

    return this;
};

/* jshint -W083 */
/*jshint laxcomma:true */
PykCharts.UltimateNegative = function (options) {
    //----------------------------------------------------------------------------------------
    //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
    //----------------------------------------------------------------------------------------
    this.execute = function () {
        // 1.1 Validate the option parameters
        if (!this.validate_options()) return false;

        // 1.2 Preload animation
        $(this.options.selection).html("<img src='https://s3.amazonaws.com/PykCharts/spinner.gif'> Loading... Please wait");

        // 1.3 Global Variable
        var that = this;

        // 1.4 Read the input data file(s)
        d3.json(this.options.data, function (e, data) {

            // Assign it to global accesstor variable
            that.data = data;
            // Render Chart with the available data
            that.render();
        });
    };

    //----------------------------------------------------------------------------------------
    //2. Validate Options
    //----------------------------------------------------------------------------------------
    this.validate_options = function () {
        if (this.options.selection === undefined) return false;
        if (this.options.data === undefined) return false;
        if (this.options.svg_width < 300) return false;
        return true;
    };

    //----------------------------------------------------------------------------------------
    //3. Assigning Attributes
    //----------------------------------------------------------------------------------------

    this.options = jQuery.extend({
        barchartwidthadjust: 0.8,
        barchartheightadjust: 0.8,
        box_gap: 10,
        box_width: 10,
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

    //----------------------------------------------------------------------------------------
    //4. Render function to create the chart
    //----------------------------------------------------------------------------------------
    this.render = function () {
        //4.1 Clear existing HTML inside Selection DIV ID
        $(this.options.selection).html("");

        //4.2 Assign height and width to a local variable because if you are manipulating with h and w then the SVG height and width will not get affected
        var svg_height = this.options.svg_height;
        var svg_width = this.options.svg_width;
        var h = this.options.svg_height * this.options.barchartheightadjust;
        var w = this.options.svg_width * this.options.barchartwidthadjust;
        var height_translate = (svg_height - h) / 2;
        var box_width = this.options.box_width;
        var box_gap = this.options.box_gap;


        //4.3 SVG Holder for Chart, Legend, ... other elements
        this.svg = d3.select(this.options.selection)
            .append("svg")
            .attr("class", "pyk-ultimate")
            .attr("height", svg_height)
            .attr("width", svg_width);


        this.barchartg = this.svg.append("g")
            .attr("transform", "translate(0 ," + height_translate + ")")
            .attr("class", "barchart")
            .attr("height", h)
            .attr("width", w);

        //4.4 Add other elements to the SVG Holder
        this.barchartg.append("g").attr("class", "yaxis");
        this.barchartg.append("g").attr("class", "xaxis");


        //4.5 Create Legend Holder
        this.legends_group = this.barchartg.append("g")
            .attr("class", "legend-holder")
            .attr("background", "Red")
            .attr("transform", "translate(100,15)");

        //4.5 Create Chart Holder
        this.chart_group = this.barchartg.append("g")
            .attr("class", "chart-holder")
            .attr("width", w - (this.options.margins.right + this.options.margins.left))
            .attr("height", h - (this.options.margins.top + this.options.margins.bottom))
            .attr("transform", "translate(" + this.options.margins.left + "," + this.options.margins.top + ")");

        //4.7 Data Manipulations
        var fD = this.flattenData(this.data);
        this.the_bars = fD[0];
        this.the_keys = fD[1];
        this.the_layers = this.layers(this.the_bars);


        // Render elements
        this.renderTooltip();
        this.draw();
    };

    //----------------------------------------------------------------------------------------
    // 5. Get the name of parameter for legends
    //----------------------------------------------------------------------------------------
    this.getParameters = function () {
        var that = this;
        var p = [];
        for (var i in that.the_layers) {
            if (!that.the_layers[i].name) continue;
            var name = that.the_layers[i].name;
            var color = that.the_layers[i].values[0].color;
            p.push({
                "name": name,
                "color": color
            });
        }
        return p;

    };

    //----------------------------------------------------------------------------------------
    // 5.Filtering on click
    //----------------------------------------------------------------------------------------
    this.onlyFilter = function (f) {
        var index = this.options.filterList.indexOf(f);
        if (this.options.filterList.length === 1 && index != -1) {
            // if its the only item on the list, get rid of it
            this.options.filterList = [];
        } else {
            // otherwise empty the list and add this one to it
            this.options.filterList = [];
            this.options.filterList.push(f);
        }
        this.draw();
    };

    //----------------------------------------------------------------------------------------
    // 6.Toggle Filter back to the original value
    //----------------------------------------------------------------------------------------
    this.toggleFilter = function (f) {
        var index = this.options.filterList.indexOf(f);
        if (index === -1) {
            this.options.filterList.push(f);
        } else {
            this.options.filterList.splice(index, 1);
        }
        this.draw();
    };


    //----------------------------------------------------------------------------------------
    // 7. Rendering Legends:
    //----------------------------------------------------------------------------------------
    this.renderLegends = function () {
        var that = this;
        var w = this.options.width;

        var params = this.getParameters();

        this.legends_group.selectAll("g.legend_group").remove();

        var legendGroups = this.legends_group.selectAll("g.legend_group").data(params)
            .enter()
            .append("g")
            .attr("class", "legend_group")
            .attr("transform", function (d, i) {
                return "translate(" + (w - (i * 80) - 100) + ", 0)";
            });

        for (var i in params) {
            var g = d3.select(legendGroups[0][i]);
            var p = params[i];

            var texts = g.selectAll("text").data([p]);

            texts.enter().append("text");

            texts.text(function (d) {
                return p.name;
            })
                .attr("x", function (d, i) {
                    return i * 40;
                })
                .attr("dy", -3)
                .on("click", function (d, i) {
                    that.toggleFilter(d.name);
                });

            var circles = g.selectAll("circle").data([p]);
            circles.enter().append("circle");

            circles
                .attr("cx", function (d, i) {
                    return (i * 100) - 10;
                })
                .attr("cy", -6).attr("r", 6)
                .attr("style", function (d) {
                    var fillColor = (that.options.filterList.indexOf(d.name) === -1) ? "#fff" : d.color;
                    return "fill: " + fillColor + "; stroke-width: 3px; stroke:" + d.color;
                });

        }
        // TODO Make legends
    };

    this.getGroups = function () {
        var groups = {};
        for (var i in this.the_bars) {
            var bar = this.the_bars[i];
            if (!bar.id) continue;
            if (groups[bar.group]) {
                groups[bar.group].push(bar.id);
            } else {
                groups[bar.group] = [bar.id];
            }
        }
        return groups;
    };

    //----------------------------------------------------------------------------------------
    // 8. Rendering Chart:
    //----------------------------------------------------------------------------------------
    this.renderChart = function () {
        var that = this;
        var w = this.chart_group.attr("width");
        var h = this.chart_group.attr("height");

        var the_bars = this.the_bars;
        var keys = this.the_keys;
        var layers = this.the_layers;
        var groups = this.getGroups();

        var stack = d3.layout.stack() // Create default stack
        .values(function (d) { // The values are present deep in the array, need to tell d3 where to find it
            return d.values;
        })(layers);

        var yValues = [];
        layers.map(function (e, i) { // Get all values to create scale
            for (i in e.values) {
                var d = e.values[i];
                yValues.push(d.y + d.y0); // Adding up y0 and y to get total height
                //  console.log(("dyz="+d.y +"dy0z"+ d.y0));
            }
        });

        var xScale = d3.scale.ordinal()
            .domain(the_bars.map(function (e, i) {
                return e.id || i; // Keep the ID for bars and numbers for integers
            }))
            .rangeBands([0, w - this.options.box_gap], 0.2);


        var v0 = Math.max(Math.abs(d3.min(yValues)), Math.abs(d3.max(yValues)));

        var
        margin = 10,
            color = d3.scale.category10()

            ,
            x = d3.scale.ordinal()
                .domain(['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'])
                .rangeRoundBands([margin, w - margin], 0.1)

            ,
            y = d3.scale.linear()
                .range([h - margin, 0 + margin]);
            y.domain([-v0, v0]);

            //,xAxis = d3.svg.axis().scale(x).orient("bottom").tickSize(6, 0)
            //,yAxis = d3.svg.axis().scale(y).orient("left")

            var yScale = d3.scale.linear().domain([-v0, v0]).range([0, h]).nice();
        var yScaleInvert = d3.scale.linear().domain([v0, -v0]).range([0, h]).nice(); // For the yAxis

        var zScale = d3.scale.category10();


        var yAxis = d3.svg.axis()
            .scale(yScaleInvert)
            .tickSize(-w, 0, 0)
            .orient("left");

        var xAxis = d3.svg.axis()
            .scale(xScale)
            .tickSize(-h, 0, 0)
            .tickFormat(function (d) {
                if (!keys[d]) return;
                return keys[d];
            });

        this.barchartg.select("g.yaxis").transition(1000)
            .attr("transform", "translate(" + this.options.margins.left + ", " + this.options.margins.top + ")")
            .call(yAxis);


        var translateY = parseInt(this.options.margins.top) + parseInt(h);

        this.barchartg.select("g.xaxis").transition(1000)
            .attr("transform", "translate(" + this.options.margins.left + ", " + translateY + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "start")
            .attr("dy", "2px")
            .attr("dx", "20px")
            .attr("transform", function (d) {
                return "rotate(90)";
            });


        var group_label_data = [];
        for (var i in groups) {
            var g = groups[i];
            var xpos = xScale(g[0]);
            var totalWidth = xScale.rangeBand() * g.length + that.options.box_width;
            xpos = xpos + (totalWidth / 2);
            group_label_data.push({
                x: xpos,
                name: i
            });
        }

        if (group_label_data.length > 1) {
            this.barchartg.selectAll("text.group_label").data(group_label_data).enter()
                .append("text").attr("class", "group_label")
                .attr("x", function (d) {
                    return d.x + that.options.margins.left;
                })
                .attr("y", function (d) {
                    return y(0) + 20;
                })
                .attr("text-anchor", "middle")
                .text(function (d) {
                    return d.name;
                });
        }

        var bars = this.chart_group.selectAll("g.bars").data(this.barStack(layers));

        bars.enter().append("g")
            .attr("class", "bars");


        var rect = bars.selectAll("rect")
            .data(function (d) {
                return d.values;
            });

        rect.enter().append("g.barchart:rect")
            .attr("height", 0).attr("y", h)
            .on("mouseover", function (d, i) {
                that.tooltip.html(d.tooltip);
                that.tooltip.style("visibility", "visible");
            })
            .attr("fill", function (d) {
                return d.color;
            })
            .on("mousemove", function () {
                var yReduce = parseInt(that.tooltip.style("height")) + 40;
                var xReduce = parseInt(that.tooltip.style("width")) / 2;
                that.tooltip.style("top", (d3.event.pageY - yReduce) + "px").style("left", (d3.event.pageX - xReduce) + "px");
            })
            .on("mouseout", function () {
                that.tooltip.style("visibility", "hidden");
            })
            .on("click", function (d) {
                that.onlyFilter(d.name);
            });


        rect
            .transition().duration(1000)
            .attr("x", function (d) {
                return xScale(d.x);
            })

        .attr("width", function (d) {
            return xScale.rangeBand() + that.options.box_width;
        })

        .attr("y", function (d) {
            return y(d.y0);
        })

        .attr("height", function (d) {
            return (Math.abs(y(0) - y(d.y)));
        });
    };


    //----------------------------------------------------------------------------------------
    // 9.Draw function to render chart with elements:
    //----------------------------------------------------------------------------------------
    this.draw = function () {
        this.options.fullList = this.getParameters().map(function (d) {
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
    };

    this.filterData = function (data) {
        var params = this.options.filterList;

        for (var i in data) {
            var group = data[i];
            for (var j in group) {
                var bars = group[j];
                for (var k in bars) {
                    var bar = bars[k];
                    for (var l in bar) {
                        var slabs = bar[l];
                        for (var m in slabs) {
                            var slab = slabs[m];
                            if (params.indexOf(slab.name) == -1) {
                                slab.val = 0;
                            }
                        }
                        break;
                    }
                }
            }
        }
        return data;
    };

    //----------------------------------------------------------------------------------------
    // 10.Render tooltip:
    //----------------------------------------------------------------------------------------
    this.renderTooltip = function () {
        $("#pyk-ultimate-tooltip").remove();
        this.tooltip = d3.select("body")
            .append("div").attr("id", "pyk-ultimate-tooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("background", "#fff")
            .style("padding", "10px 20px")
            .style("box-shadow", "0 0 10px #000")
            .style("border-radius", "5px")
            .text("a simple tooltip");
    };

    //----------------------------------------------------------------------------------------
    // 10.Data Manuplation
    //----------------------------------------------------------------------------------------
    // Data Helpers
    // Takes the flattened data and returns layers
    // Each layer is a separate category
    // The structure of the layer is made so that is plays well with d3.stack.layout()
    // Docs - https://github.com/mbostock/d3/wiki/Stack-Layout#wiki-values

    this.barStack = function (dz) {
        var d = [];

        console.log("changed input=" + (dz.length));
        console.log("checking....dzz.=" + (JSON.stringify(dz)));


        var l = dz.length;
        console.log("length=" + l);
        dz.forEach(function (dz) {
            console.log(">>>>>>>>>>>.=" + (JSON.stringify(dz.values)));
            d.push(
                dz.values
            );
        });
        console.log("~~~~~~~~~~~=" + (JSON.stringify(d)));
        l = d[0].length;
        console.log("length=" + l);

        l = d[0].length;
        console.log("length====***=" + l);
        while (l--) {
            var posBase = 0,
                negBase = 0;
            console.log("loopla");
            d.forEach(function (d) {
                console.log("starting,,posBase=" + posBase);
                console.log("starting,,negBase=" + negBase);

                d = d[l];
                d.size = Math.abs(d.y);
                console.log("dy=" + d.y);
                if (d.y < 0) {
                    console.log("if====*** negBase=" + negBase);
                    d.y0 = negBase;
                    negBase -= d.size;
                    console.log("if====*** y0=" + d.y0);
                } else {
                    console.log("else====*** posBase=" + posBase);
                    d.y0 = posBase = posBase + d.size;
                    console.log("else====*** y0=" + d.y0);
                }
            });
        }


        dz.extent = d3.extent(d3.merge(d3.merge(dz.map(function (e) {
            console.log("eeeeee =" + JSON.stringify(e));
            return [e.y0, e.y0 - e.size];
        }))));
        console.log("output=" + JSON.stringify(dz));
        return dz;
    };



    this.layers = function (the_bars) {
        var layers = [];

        function findLayer(l) {
            for (var i in layers) {
                var layer = layers[i];
                if (layer.name == l) return layer;
            }
            return addLayer(l);
        }

        function addLayer(l) {
            var new_layer = {
                "name": l,
                "values": []
            };
            layers.push(new_layer);
            return new_layer;
        }

        for (var i in the_bars) {
            var bar = the_bars[i];
            if (!bar.id) continue;
            var id = bar.id;
            for (var k in bar) {
                if (k === "id") continue;
                var icings = bar[k];
                for (var j in icings) {
                    var icing = icings[j];
                    if (!icing.name) continue;
                    var layer = findLayer(icing.name);
                    layer.values.push({
                        "x": id,
                        "y": icing.val,
                        "color": icing.color,
                        "tooltip": icing.tooltip,
                        "name": icing.name
                    });
                }
            }
        }
        return layers;
    };

    // Traverses the JSON and returns an array of the 'bars' that are to be rendered
    this.flattenData = function (data) {
        var the_bars = [-1];
        var keys = {};
        for (var i in data) {
            var d = data[i];
            for (var cat_name in d) {
                for (var j in d[cat_name]) {
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
    };


    //----------------------------------------------------------------------------------------
    // 11.Return Chart:
    //----------------------------------------------------------------------------------------

    return this;
};

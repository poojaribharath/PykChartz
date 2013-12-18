
PykCharts.HawkEye = function (options) {
  //----------------------------------------------------------------------------------------
  //1. This is the method that executes the various JS functions in the proper sequence to generate the chart
  //----------------------------------------------------------------------------------------
    
    this.init = function () {
      // 1.1 Validate the option parameters
              if (!this.validate_options()) return false;

        // 1.2 Preload text
                $(this.options.selection).html("Loading... Please wait");

        // 1.3 Make Variable value accesible throughout
        var that = this;
        that.h = that.options.svg_height * that.options.barchartheightadjust;
        that.w = that.options.svg_width * that.options.barchartwidthadjust;
        that.resized = 0;
        that.h_cell = that.options.h_cell; //height of cell in connector tabel
        that.w_cell = that.options.w_cell; //width of cell in connector tabel
                that.overlap = that.options.overlap;
                that.initial_bar_width_adjustment = that.options.barchartwidthadjust;
        that.opentabel = 1;
        that.bdtabel = 1;

        // 1.4 Read the main barchat input data file(s)
        d3.json(this.options.data, function (e, data) {
            that.data = data;
            that.render();
        });

        // 1.5 Read the tabel data input file(s)
        d3.json(this.options.subdata, function (e, data) {
            that.subdata = data;
        });
                
        // 1.6 Read the Column data input file(s)
        d3.json(this.options.breakdown, function (e, data) {
            that.breakdown = data;
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
                
        //4.2 Assign height and width, box_width, ... to a local variable to be rendered
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
            .attr("class", "pyk-hawkeye")
            .attr("height", svg_height)
            .attr("width", svg_width);

        this.vis = this.svg.append("g")
            .attr("class", "vis")
            .attr("height", svg_height)
            .attr("width", svg_width)
        .attr("transform", "translate(" + this.options.margins.left + "," + this.options.margins.top + ")");

                this.barchartg = this.svg.append("g")
            .attr("transform", "translate(0 ," + height_translate + ")")
            .attr("class", "barchart")
            .attr("height", h)
            .attr("width", w);

        this.chart_group = this.barchartg.append("g")
            .attr("class", "chart-holder")
            .attr("width", w)
            .attr("height", h)
            .attr("transform", "translate(" + this.options.margins.left + "," + this.options.margins.top + ")");

        var fD = this.flattenData(this.data); //flatten json data
        this.the_bars = fD[0];
        this.the_keys = fD[1];
        this.the_layers = this.layers(this.the_bars);

        // Render elements
        this.renderTooltip();
        this.draw();
    };

   
    //----------------------------------------------------------------------------------------
    // 5. Assembling the barchart json data in group of similar categories  
    //----------------------------------------------------------------------------------------
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
    // 6. fetching nodes of barchart json data   
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
     // 7. Rendering Chart:
     //----------------------------------------------------------------------------------------
    this.renderChart = function () {
        
      //7.1 Assign height and width, box_width, ... to a local variable to be rendered
                var that = this;
        var w = this.chart_group.attr("width");
        var h = this.chart_group.attr("height");
        var the_bars = this.the_bars;
        var keys = this.the_keys;
        var layers = this.the_layers;
        var groups = this.getGroups();

          //7.2 using stack layout to arrange rects & passing data returned from layer function
        var stack = d3.layout.stack() // Create default stack
        .values(function (d) { // The values are present deep in the array, need to tell d3 where to find it
            return d.values;
        })(layers);

          //7.3 geting the total Height values in array
        var yValues = [];
        layers.map(function (e, i) { // Get all values to create scale
            for (i in e.values) {
                var d = e.values[i];
                yValues.push(d.y + d.y0); // Adding up y0 and y to get total height
            }
        });

          //7.4 setting Up Xscale
        var xScale = d3.scale.ordinal()
            .domain(the_bars.map(function (e, i) {
                return e.id || i; // Keep the ID for bars and numbers for integers
            }))
            .rangeBands([0, w - this.options.box_gap], 0.2);

              //7.5 getting max & min for the Total height of Bar Chart
        var v0 = Math.max(Math.abs(d3.min(yValues)), Math.abs(d3.max(yValues)));
        var margin = 10;

          //7.6 setting Up yscale
        var y = d3.scale.linear()
            .range([h - margin, 0 + margin]);
        y.domain([-v0, v0]);
        var yScale = d3.scale.linear().domain([-v0, v0]).range([0, h]).nice();
              var yScaleInvert = d3.scale.linear().domain([v0, -v0]).range([0, h]).nice(); // For the yAxis
        var translateY = parseInt(this.options.margins.top) + parseInt(h);

          //7.6 get the Names of Of node Jan, Feb..
        var group_label_data = [];
        for (var i in groups) {
            var g = groups[i];
            var x = xScale(g[0]);
            var totalWidth = xScale.rangeBand() * g.length + that.options.box_width;
            var x1 = x + (totalWidth / 2);
            group_label_data.push({
                x: x1,
                name: i
            });
        }

          //7.7 Append TEXT Element For of Of node Jan, Feb.. to the Chart
        if (group_label_data.length > 1) {
            this.barchartg.selectAll("text.group_label").data(group_label_data).enter()
                .append("text").attr("class", "group_label")
                .attr("x", function (d) {
                    return d.x + that.options.margins.left;
                })
                .attr("y", function (d) {
                    return y(0) + 25;
                })
                .attr("text-anchor", "middle")
                .text(function (d) {
                    return d.name;
                });
                            }
                            
              //7.8 Append lines for Positive & negative Bar charts with names of months in between
        var wd = this.chart_group.attr("width");
        this.chart_group.append("line")
            .attr("x1", -40)
            .attr("y1", y(-0.1))
            .attr("x2", wd)
            .attr("y2", y(-0.1))
            .style("stroke-width", 1)
            .style("stroke", "black");

        this.chart_group.append("text")
            .attr("x", -20)
            .attr("y", y(1))
            .attr("text-anchor", "middle")
            .text("Overdue");

        this.chart_group.append("line")
            .attr("x1", -40)
            .attr("y1", y(-4.9))
            .attr("x2", wd)
            .attr("y2", y(-4.9))
            .style("stroke-width", 1)
            .style("stroke", "black");

        this.chart_group.append("text")
            .attr("x", -15)
            .attr("y", y(-8))
            .attr("text-anchor", "middle")
            .text("Consumed");


              //7.9 Append group Element named Bar & append rects to bars
        var bars = this.chart_group.selectAll("g.bars").data(this.barStack(layers));
        bars.enter().append("g")
            .attr("class", "bars");
        var tbars = [];
        var rect = bars.selectAll("rect")
            .data(function (d) { return d.values; });
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
                var yReduce =(parseInt(that.tooltip.style("height")) + 40);
                var xReduce = (parseInt(that.tooltip.style("width")) / 2);
                that.tooltip.style("top", (d3.event.pageY - yReduce) + "px").style("left", (d3.event.pageX - xReduce) + "px");
            })
            .on("mouseout", function () {
                that.tooltip.style("visibility", "hidden");
            })
            .on("click", function (d) {
                          d3.selectAll("svg g.vis .tabeldata").remove();
                            
                var tsize = [];
                var tvaluespos = [];
                var tvaluesneg =[];
                var tvalues = [];
                var maxval = 0;
                var upy = 0;
                var downy = 0;
                tbars.forEach(function (tbars) {
                    if (tbars.x == d.x) {
                        tsize.push(tbars.y0);
                        tvalues.push(tbars.y);
                        if (tbars.y > 0) {
                            tvaluespos.push(tbars.y);
                        } else {
                            tvaluesneg.push(tbars.y);
                        }
                    }
                });
                maxval = d3.max(tvalues);
                tbars.forEach(function (tbars) {
                    if (tbars.x == d.x && tbars.y0 > 0) {
                        upy = upy + tbars.size;
                    }
                });
                tbars.forEach(function (tbars) {
                    if (tbars.x == d.x && tbars.y0 < 0) {
                        downy = downy + tbars.y0;
                    }
                });

                              //7.10 Fetching X,Y,height,width etc.. to be passed to showdetails() for displaying connectors
                var ax1 = xScale(d.x);
                var ay1 = y(upy);
                var ay2 = y(downy);
                var wd = xScale.rangeBand() + that.options.box_width;
                var ht = (d.size);
                                var wd1,cl=0;
                var svgwidth = d3.select("svg").attr("width");
                var hh = d3.select(".chart-holder").attr("height");
                var ww = d3.select(".chart-holder").attr("width");
                                var maxjson = that.processmaxcol();
                var table = (that.w_cell*1.4) * maxjson;
                                var overlap = that.overlap;
                              
                                //7.11 resize towards left i.e. shrink the bar 
                                if(ww>svgwidth-table)
                                {
                                    var tx1=ww - (svgwidth-table);
                                    x_resize_option_2 =Math.abs(ww- (svgwidth-table));    
                                    new_bar_chart_adjust_ind = (that.options.barchartwidthadjust * x_resize_option_2)/(ww);
                  that.options.barchartwidthadjust = that.options.barchartwidthadjust-new_bar_chart_adjust_ind;
                                    that.initial_bar_width_adjustment = that.options.barchartwidthadjust;
                                    that.render();
                  that.renderTooltip();
                  that.draw();
                                }
                                
                                if (ax1>svgwidth-(overlap * table))
                                { 
                        that.resized = 1;
                                    x_resize_option_2 =Math.abs(svgwidth-(overlap * table)-ax1);    
                                    new_bar_chart_adjust_ind = (that.options.barchartwidthadjust * x_resize_option_2)/svgwidth;
                  that.options.barchartwidthadjust = that.options.barchartwidthadjust-new_bar_chart_adjust_ind;
                                    that.render();
                  that.renderTooltip();
                  that.draw();
                 }
                     else if (that.resized ==1)
                                  {
                                        //7.12 resize towards left i.e. shrink the bar 
                     if (ax1 < svgwidth-(overlap * table))
                                         { 
                             that.resized = 0;
                                    
                                         x_resize_option_2 = Math.abs(svgwidth- (overlap * table) - ax1);    
                                         new_bar_chart_adjust_ind = (that.options.barchartwidthadjust * x_resize_option_2)/svgwidth;
                                         that.options.barchartwidthadjust = that.options.barchartwidthadjust+new_bar_chart_adjust_ind;
                                         if (that.options.barchartwidthadjust > that.initial_bar_width_adjustment)
                                         {
                                             that.options.barchartwidthadjust = that.initial_bar_width_adjustment;
                                         }
                                         that.render();
                       that.renderTooltip();
                       that.draw();
                          }
                                 }
                       
                                //7.12 Draw Temprory Scale & pass new X,y Width as the Resized 
                                tempxScale = d3.scale.ordinal()
                    .domain(the_bars.map(function (e, i) {
                        return e.id || i; // Keep the ID for bars and numbers for integers
                    }))
                    .rangeBands([0, (svgwidth * that.options.barchartwidthadjust) - that.options.box_gap], 0.2);
                ax1 = (tempxScale(d.x));
                              wd1 = tempxScale.rangeBand()+ that.options.box_width; 
                        cl  = (that.options.svg_width) -  ax1 - table ;
                                var str=d.x;
                                var ni = str.indexOf("i")+1;
                                var nj = str.indexOf("j");
                                var res = str.slice(ni,nj);
                                var months =["January" , "February" ,"March" ,"April", "May" ,"June", "July","August","September","October","November","December" ];
                                var month_name = months[res];
                                that.showdetail(ax1, ay1, ay2, wd1,cl, maxval,month_name);
              });

        rect
            .transition().duration(1000)
            .attr("x", function (d) {

                tbars.push(d);

                return xScale(d.x);

            })
        .attr("width", function (d) {
            return xScale.rangeBand() + that.options.box_width;
        })
        .attr("y", function (d, i) {
            return y(d.y0);
        })
        .attr("height", function (d) {
            return (Math.abs(y(0) - y(d.y)));
        });
    };

    //----------------------------------------------------------------------------------------
    // 8. Process Json 2 to get the max Number of Child i.e max number of column:
    //----------------------------------------------------------------------------------------
    this.processmaxdata = function () {
        var that = this;

        var d = that.subdata;
        var length = [];

       for (var i in d) {
            for (var j in d[i]) {
                for (var k in d[i][j]) {
                    for (var l in d[i][j][k]) {
                        var lj = d[i][j][k][l];
                        length.push(lj.length);
                    }
                }
            }
        }
                
                var max = d3.max(length);
        return max;
    };

    //----------------------------------------------------------------------------------------
    // 8. Process Json 2 to get the max Number of Child i.e max number of column:
    //----------------------------------------------------------------------------------------
    this.processmaxcol = function () {
        var that = this;

        var d = that.subdata;
       
           var max = 0;
        for (var i in d) {
                    max = max +1;
        }
              return max;
    };

   

     //----------------------------------------------------------------------------------------
    // 9. Rendering Details:
    //----------------------------------------------------------------------------------------
    this.showdetail = function (ax1, ay1, ay2, barwd, cl, maxval,month) {
      
            //9.1 Remove Current connectoe & Tabel Data 
              d3.selectAll("svg g.vis path").remove();
        d3.selectAll("svg g.vis rect").remove();
        
                //9.2 Assign height and width, box_width, ... to a local variable to be rendered
                var that = this;
        var maxjson = this.processmaxdata();
                var month_name = month;
        var posvals = 3;
        var negvals = 2;
                var table =[];
        var x1 = ax1;
        var th = this.chart_group.attr("height");
        var vth = this.vis.attr("height");
        var y1 = (vth / 2 - (th / 2)) + ay1;
        var y2 = (vth / 2 - (th / 2)) + ay2 - 5;
        var wd = barwd;
        var tablewidth = that.w_cell * this.processmaxcol();
                
                //9.3 passed chordlength obtained from onclik 
        var chordlength = cl;
        var buff = 40;
        var theight = that.h_cell * posvals;
        var geom = [3, 4, 1, 2, 5];
        var counterwdth = 0;
        var curveradjestment = wd / counterwdth;
                
                //9.4 Getnrating P1 = P12 for upper connector 
        var p1 = {
            x: x1,
            y: y1
        };
        var p4x = (x1 + wd + chordlength);
        var p1x = x1;
        var p7y = (buff + theight);
        var p2y = (buff * 2);
                var p8_dx = ((p4x - p1x - (wd / curveradjestment)) / 10) * geom[0];
        var p9_dx = (p4x - p1x - wd / curveradjestment) / 10 * geom[1];
        var p10_dx = (p4x - p1x) / 10 * geom[2];
        var p8_dy = (p7y - p2y) / 10 * geom[3];
        var p9_dy = (p7y - p2y) / 10 * geom[4];
        var p2 = {
            x: x1,
            y: (buff * 2)
        };
        var pc = {
            x: x1,
            y: buff
        };
        var p3 = {
            x: x1 + wd,
            y: buff
        };
        var p4 = {
            x: (x1 + wd + chordlength),
            y: buff
        };
        var p5 = {
            x: (x1 + wd + chordlength + tablewidth),
            y: buff
        };
        var p6 = {
            x: (x1 + wd + chordlength + tablewidth),
            y: (buff + theight)
        };
        var p7 = {
            x: (x1 + wd + chordlength),
            y: (buff + theight)
        };
    that.p7=p7;

        var p8 = {
            x: ((x1 + wd + chordlength) - p8_dx),
            y: ((buff + theight) - p8_dy)
        };
        var p9 = {
            x: (((x1 + wd + chordlength) - p8_dx) - p9_dx),
            y: (((buff + theight) - p8_dy) - p9_dy)
        };
        var p10 = {
            x: ((((x1 + wd + chordlength) - p8_dx) - p9_dx) - p10_dx),
            y: (buff * 2)
        };
        var p11 = {
            x: (x1 + wd),
            y: (((buff + theight) - p8_dy) - p9_dy)
        };
        var p12 = {
            x: (x1 + wd),
            y: y1
        };
                
                //9.5 Getnrating P13 = P24 for upper connector 
        var buff_below = 20;
        var base = this.options.svg_height - buff_below;
        var p13 = {
            x: x1,
            y: y2
        };
        theight = that.h_cell * negvals;
        var p14y = base - (buff_below * 2);
        var p19y = (((base)) - (theight));
         p9_dy = (p7y - p2y) / 10 * geom[4];
        var p20_dy = (p14y - p19y) / 10 * geom[3];
        var p21_dy = (p14y - p19y) / 10 * geom[4];

        var p14 = {
            x: x1,
            y: base - (buff_below * 2)
        };
        var pc2 = {
            x: x1,
            y: (base)
        };
        var p15 = {
            x: x1 + wd,
            y: (base)
        };
        var p16 = {
            x: (x1 + wd + chordlength),
            y: (base)
        };
        var p17 = {
            x: (x1 + wd + chordlength + tablewidth),
            y: (base)
        };
        var p18 = {
            x: (x1 + wd + chordlength + tablewidth),
            y: (((base)) - (theight))
        };
        var p19 = {
            x: (x1 + wd + chordlength),
            y: (((base)) - (theight))
        };
            that.p19=p19;

        var p20 = {
            x: ((x1 + wd + chordlength) - p8_dx),
            y: ((((base)) - (theight)) + p20_dy)
        };
        var p21 = {
            x: (((x1 + wd + chordlength) - p8_dx) - p9_dx ),
            y: ((((((base)) - (theight)) + p20_dy)) + p21_dy )
        };
        var p22 = {
            x: ((((x1 + wd + chordlength) - p8_dx) - p9_dx ) - p10_dx),
            y: base - (buff_below * 2) 
        };
        var p23 = {
            x: (x1 + wd),
            y: ((((((base)) - (theight)) + p20_dy)))
        };
        var p24 = {
            x: (x1 + wd),
            y: y2
        };

                //9.6 line Generator which will be passed tp area generator for upper connector 
        var d3line = d3.svg.line()
            .x(function (d) {
                return d.x;
            })
            .y(function (d) {
                return d.y;
            })
            .interpolate("linear");

                //9.7 line Generator which will be passed tp area generator for lower connector 
        var d3line2 = d3.svg.line()
            .x(function (d) {
                return d.x;
            })
            .y(function (d) {
                return d.y;
            })
            .interpolate("linear");

                //9.8 Pushing Data points p1-p12 to array for path 
          var line = [];
        var mainline = [];
        line.push([p1, p2]);
        line.push([p2, pc, p3, p4]);
        line.push([p4, p5]);
              mainline.push([p1, p2]);
             mainline.push([p2, pc, p3]);
             mainline.push([p3, p4]);
             mainline.push([p4, p7]);
        var tempx1, tempy1;
        var tempx2, tempy2;
        var wtempx1, wtempy1;
        var wtempx2, wtempy2;
        var rowpointer, colpointer;

                //9.9 setting up row & col Pointer to generate tabel Structure
        rowpointer = p4.x;
        colpointer = p4.y;
        var count = 1;
        var xrectcordinates = [];
        var yrectcordinates = [];
				var tline1 ;
				var tline2 ;
				var wtline1 ;
				var wtline2 ;
        while (count <= posvals) {
            for (i = 0; i < maxjson; i++) {
                tempx1 = rowpointer + i * that.w_cell;
                tempy1 = colpointer;
                tempx2 = rowpointer + i * that.w_cell;
                tempy2 = colpointer + that.h_cell;

                tline1 = {
                    x: tempx1,
                    y: tempy1
                };
                 tline2 = {
                    x: tempx2,
                    y: tempy2
                };

                line.push([tline1, tline2]);

                wtempx1 = rowpointer;
                wtempy1 = colpointer + that.h_cell;
                wtempx2 = rowpointer + i * that.w_cell;
                wtempy2 = colpointer + that.h_cell;

                 wtline1 = {
                    x: wtempx1,
                    y: wtempy1
                };
                 wtline2 = {
                    x: wtempx2,
                    y: wtempy2
                };
                line.push([wtline1, wtline2]);

                xrectcordinates.push(tempx1 + 2);
                yrectcordinates.push(wtempy2 - 18);

                var colorscale = d3.scale.linear()
                    .domain([0, 70])
                    .range(["red", "blue"]);

            }
            colpointer = colpointer + that.h_cell;
            count = count + 1;
        }
        line.push([p5, p6]);
        line.push([p6, p7]);
        line.push([p7, p4]);
        line.push([p7, p8, p9, p10, p11]);
        line.push([p11, p12]);
        line.push([p12, p1]);
             mainline.push([p7, p8, p9, p10, p11]);
             mainline.push([p11, p12]);
             mainline.push([p12, p1]);

            //9.10 Pushing Data points p13-p24 to array for path 
       var line2 = [];
       var mainline2 = [];
        line2.push([p13, p14]);
        line2.push([p14, pc2, p15]);
        line2.push([p15, p16]);
        line2.push([p16, p17]);
             mainline2.push([p13, p14]);
             mainline2.push([p14, pc2, p15]);
             mainline2.push([p15, p16]);
             
            //9.11 setting up row & col Pointer to generate tabel Structure
        rowpointer = p19.x;
        colpointer = p19.y;
         count = 1;

        while (count <= negvals) {
            for (i = 0; i < maxjson; i++) {
                tempx1 = rowpointer + i * that.w_cell;
                tempy1 = colpointer;
                tempx2 = rowpointer + i * that.w_cell;
                tempy2 = colpointer + that.h_cell;

                 tline1 = {
                    x: tempx1,
                    y: tempy1
                };
                 tline2 = {
                    x: tempx2,
                    y: tempy2
                };

                line2.push([tline1, tline2]);

                wtempx1 = rowpointer;
                wtempy1 = colpointer + that.h_cell;
                wtempx2 = rowpointer + i * that.w_cell;
                wtempy2 = colpointer + that.h_cell;

                 wtline1 = {
                    x: wtempx1,
                    y: wtempy1
                };
                 wtline2 = {
                    x: wtempx2,
                    y: wtempy2
                };
                line2.push([wtline1, wtline2]);
                xrectcordinates.push(tempx1 + 2);
                yrectcordinates.push(wtempy2 - 18);
            }
            colpointer = colpointer + that.h_cell;
            count = count + 1;
        }

        line2.push([p17, p18]);
        line2.push([p18, p19]);
        line2.push([p19, p16]);
                line2.push([p19, p20, p21, p22, p23]);
        line2.push([p23, p24]);
        line2.push([p24, p13]);
             mainline2.push([p19,p16]);
        mainline2.push([p19, p20, p21, p22, p23]);
              mainline2.push([p23, p24]);
       mainline2.push([p24, p13]);
            
             var area1_data =(that.opentabel === 0? area1_data = line.slice(0) : area1_data = mainline.slice(0));
            
             var area2_data =(that.opentabel === 0? area2_data = line2.slice(0) : area2_data = mainline2.slice(0));


            //9.12 setting up area generator to show connectors
        var area = d3.svg.area()
            .defined(d3line.defined())
            .interpolate("basis")
            .x(d3line.x())
            .y1(d3line.y())
        .y0(buff*2);
                
        var area2 = d3.svg.area()
            .defined(d3line2.defined())
            .interpolate("basis")
            .x(d3line2.x())
            .y1(d3line2.y())
        .y0(base-buff_below);
        var minY = 10;
        var maxY = 210;

                //9.13 display connecotors from the area generators by appending path 
        this.vis.selectAll("path.area")
            .data(area1_data)
            .enter().append("path")
            .style("fill", "#FFF")
              .transition()
        .duration(1500)
        .ease("elastic")
        .style("shape-rendering", "crispEdges")
            .style("fill", "#dadae3")
        .attr("d", area);

        this.vis.selectAll("path.area")
            .data(area2_data)
            .enter().append("path")
            .style("fill", "#FFF")
         .transition()
        .duration(1500)
        .ease("elastic")
        .attr("class", "below")
            .style("fill", "#dadae3")
        .style("shape-rendering", "crispEdges")
            .attr("d", area2);

                        //9.14 read data from Json 2 to dispaly small rect inside tabel 
        var val = [];
        var RdataArray = [];
         colpointer = 0;
         rowpointer = 0;
        var counti = 0;
        var d = that.subdata;
            colpointer = p4.x;
            rowpointer = p4.y ;
                var irect = 0;
                
        for (var i in d) {

                        //9.15 transversing through Json 2 & store data in temp array  
            for (var j in d[i]) {

                for (var k in d[i][j]) {

                    for (var l in d[i][j][k]) {
                        var temp = [];
                                                var countt =0;
                        var tmp =0;
                                                irect=irect+1;
                                                for (var m in d[i][j][k][l]) {
                                                    countt = countt +1;
                                            if (countt > 3) {
                                        rowpointer = p19.y + (tmp * that.h_cell) ;
                                                    tmp = tmp+1;
                                                    
                                                }
                            var values = d[i][j][k][l][m].val;
                            var name = d[i][j][k][l][m].name;
                            var color = d[i][j][k][l][m].color;
                            var tooltip = d[i][j][k][l][m].tooltip;
                            temp.push({
                                name: name,
                                color: color,
                                x: colpointer,
                                y: rowpointer,
                                groupdelay: irect,
                                value: values,
                                tooltip: tooltip
                            });
                            rowpointer = rowpointer + that.h_cell;
                            count = count + 1;
                            val.push(values);
                                                        
                        }
                        RdataArray.push(temp);
                        colpointer = colpointer + that.w_cell;
                                    rowpointer = p4.y ;
                                                
                    }
                }
            }
        }

                //9.15 new Width Scal for the Small Rect in Table  
        var widthscale = d3.scale.linear()
            .domain([0, d3.max(val)])
            .range([0, that.w_cell*0.7]);
                        var crect= 0;
                         irect= 0;

                        //9.15 Append Group element in tabel & then append rect   
        var smallbars = this.vis.selectAll("g.smallbars").data(RdataArray);
        smallbars.enter().append("g")
            .attr("class", "bars");
        var rect1 = smallbars.selectAll("rect")
            .data(function (d) {
                            
                            var clone = d.slice(0);
                    var maxjson = that.processmaxdata();
                            if (clone.length < maxjson)
                            {
                                var lastx = clone[clone.length-1].x;
                                var lasty = clone[clone.length-1].y;
                                for (var i=clone.length;i<maxjson;i++)
                                {
                                    lastx = clone[clone.length-1].x + that.w_cell;
                                clone.push(
                                    {
                                        "name":"blank",
                                    "color":"none",
                                    "x":lastx,
                                    "y":lasty,
                                    "value":0});
                            }
                        }
                return clone;
            });


        rect1.enter().append("g.smallbars:rect")
           .attr("width", function(d) {  return (that.opentabel === 0 ? that.w_cell : 0); })
                     .attr("height", that.h_cell)
            .attr("fill", function (d) {
                if (d.y == buff)
                    return "#c6c6c6";
                else if (d.y == buff + that.h_cell)
                    return "#e0e0e0";
                else if (d.y == buff + that.h_cell + that.h_cell)
                    return "#f4f4f4";
                else if (d.y == base - that.h_cell)
                    return "#c6c6c6";
                else
                    return "#e0e0e0";
            })
            .style("stroke", "white")
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            });
              
                        if (that.opentabel==1)
                        {
                rect1
                    .transition().duration(150)
                                .delay(function(d, i) { 
                                    return d.groupdelay * 150; 
                                })
                    
                                .attr("width", function (d) {
                        return that.w_cell;
                    });
                        }

        rect1.enter().append("g.smallbars:rect")
                
            .attr("width", function(d) { return (that.opentabel === 0 ? widthscale(d.value) : 0); })
            .attr("height", (that.h_cell/2))
            .attr("class","valuebars")
            .attr("fill", function (d) {
                return d.color;
            })
            .attr("x", function (d) {
                return d.x + 5;
            })
            .attr("y", function (d) {
                return d.y + 7;
            })
        .on("mouseover", function (d, i) {
            that.tooltip.html((d.tooltip + " in " +month_name +": " +d.value ));
            that.tooltip.style("visibility", "visible");
        })
        .on("click", function (d) {
              d3.selectAll("svg g.vis g.bars rect.valuebars")
                    .attr("stroke", "none")
                    .attr("stroke-width",0);
                    
                    d3.select(this)
                    .attr("stroke","red")
                    .attr("stroke-width",2);
                    
                    var color = d3.select(this).attr("fill");
                    that.showtabel(p7.x,p7.y,p6.x,p6.y,p19.x,p19.y,p18.x,p18.y,d.x,d.y,color);
                })
            .on("mousemove", function () {
                var yReduce = parseInt(that.tooltip.style("height")) + 15;
                var xReduce = parseInt(that.tooltip.style("width")) / 2;
                that.tooltip.style("top", (d3.event.pageY - yReduce) + "px").style("left", (d3.event.pageX - xReduce) + "px");
            })
            .on("mouseout", function () {
                that.tooltip.style("visibility", "hidden");
            });
                        
                        //9.16 tabel Trasition if opened other then first time    
                        if (that.opentabel==1)
                        {
                rect1
                    .transition().duration(200)
                                
                                .delay(function(d, i) { return d.groupdelay * 200; })
                                
                    .attr("width", function (d) {
                        return widthscale(d.value);
                    });
                        }

                        //9.16 change tabel open flag to 1 as its been open for the first time    
                        that.showbreakdown(p7.x,p7.y,p19.x,p19.y);
        };
        
        
        
    //----------------------------------------------------------------------------------------
    // 9. Rendering Details:
    //----------------------------------------------------------------------------------------
    this.showtabel = function (tp7x,tp7y,tp6x,tp6y,tp19x,tp19y,tp18x,tp18y,dx,dy,clr) {
          d3.selectAll("svg g.vis path.tabeldata").remove();
      d3.selectAll("svg g.vis rect.tabeldata").remove();
      d3.selectAll("svg g.vis text.columns").remove();
      d3.selectAll("svg g.vis rect.columns").remove();
      d3.selectAll("svg g.vis line.columns").remove();
      d3.selectAll("svg g.vis g.bars text").remove();

            var that = this;
      var p7x = tp7x;
      var p7y = tp7y;
      var p6x = tp6x;
      var p6y = tp6y;
      var p19x = tp19x;
      var p19y = tp19y;
      var p18x = tp18x;
      var p18y = tp18y;
      var px = dx;
      var color = clr;
            var data;
      var buff = 38;
      var maxjson = this.processmaxcol();
            var tablewidth = that.w_cell * maxjson;
            var rowsize = 18;
            var gap=6;
            var margin = 10;
            
            var tabel = this.vis.append("rect")
                      .attr("x", p7x )
                            .attr("y", p7y+buff) 
                       .attr("width",p6x-p7x )
                       .attr("height",function(d) { return (that.bdtabel === 0 ? ((p19y- p7y -buff)- buff) : 0); })
                          .attr("stroke", color)
                         .attr("class", "tabeldata")
                            .attr("fill","#dadae3");
                            
                            if(that.bdtabel === 1)
                            {
                            if(dy>p7y)
                            {
                                tabel
                        .attr("transform", function(d,i) {
                                var x = p7x+(tablewidth/2);
                                    var y = p7y+buff+buff*2 + (margin /2) +1;
                              return "rotate(-180,"+x+","+y+")" ;
                        });
                        }
    
                        tabel
                        .transition().duration(200)
                                    .delay(function(d, i) { return i * 200; })
                          .attr("height", function (d) {
                            return ((p19y- p7y -buff)- buff);
                        });
                                }
         var line = d3.svg.line()
             .x(function(d){return d[0];})
             .y(function(d){return d[1];})
             .interpolate("linear-closed");
        
        if(dy<p7y)
        {         
         data = [[p7x,p7y+buff],[px,p7y],[px+that.w_cell,p7y],[p7x+(p6x-p7x), p7y+buff]];
        }
        else
        {
          data = [[p19x,p19y-buff],[px,p19y],[px+that.w_cell,p19y],[p19x+(p18x-p19x), p19y-buff]];
        
        }    
    
        var triangle = this.vis.append("path")
            .attr("fill", "#dadae3")
            .attr("stroke-width",1)
             .attr("class", "tabeldata")
             .attr("stroke", color)
        .style("shape-rendering", "crispEdges")
            .attr("d", line(data));
                
        var val = [];
        var RdataArray = [];
        var colpointer;
        var rowpointer;
        var counti = 0;
        var d = that.breakdown;
            colpointer = p7x+margin;
            rowpointer = p7y+buff+margin ;
                                        
              var rectangle = this.vis.append("rect")
                            .attr("x", colpointer)
                            .attr("y", rowpointer)
                                                     .attr("class", "tabeldata")
                                              .attr("height",rowsize)
                                              .attr("width",(((p6x-p7x)-(2*margin))))
                                              .attr("fill","white")
                                              .attr("stroke","steelblue");

             var text = this.vis.append("text")
                                 .attr("x", colpointer + ((((p6x-p7x)-(2*margin)))/3))
                                 .attr("y", rowpointer+(rowsize/1.4))
                                                     .style("font-size", "11px")
                                                 .attr("class", "tabeldata")
                                                 .style("font-weight", "bold")
                                                      .text( function (d,i) {
                                                         var str =  "Top 5 breakdown ";
                                                           return str ;
                                                   }) ;

        colpointer = p7x+margin;
        rowpointer = p7y+2*buff ;
                
                var irect = 0;
                
        for (var i in d) {

                        //9.15 transversing through Json 2 & store data in temp array  
            for (var j in d[i]) {

                for (var k in d[i][j]) {

                    for (var l in d[i][j][k]) {
                        var temp = [];
                                                var countt =0;
                        var tmp =0;
                                                irect=irect+1;
                                                for (var m in d[i][j][k][l]) {

                            var values = d[i][j][k][l][m].val;
                            var name = d[i][j][k][l][m].name;
                             color = d[i][j][k][l][m].color;
                                                        var Lineitem = d[i][j][k][l][m].Lineitem;
                                                        var po = d[i][j][k][l][m].PO;
                                                        var oustanding = d[i][j][k][l][m].Oustanding;
                                                        
                            temp.push({
                              name: name,
                              Lineitem: Lineitem,
                              po: po,
                              oustanding: oustanding,
                                color: color,
                                x: colpointer,
                                y: rowpointer,
                                value: values
                            });
                            rowpointer = rowpointer + rowsize;
                            val.push(values);
                                                        
                        }
                        RdataArray.push(temp);
                        colpointer = colpointer + that.w_cell;
                                    rowpointer = p7y ;
                                                
                    }
                }
            }
        }

                
        var coldatarect = this.vis.selectAll("g.coldatarect").data(RdataArray);
        coldatarect.enter().append("g")
            .attr("class", "bars");
        var rect2 = coldatarect.selectAll("rect")
             .data(function (d) { return d; });
            rect2.enter().append("g.barchart:rect")
          .attr("height",function(d) { return (that.bdtabel === 0 ? rowsize : 0); })
          .attr("width",(((p6x-p7x)-(2*margin))))
          .attr("fill","white")
                 .attr("class", "tabeldata")
          .attr("stroke","steelblue")
          .attr("x", function (d) { return (d.x); })
          .attr("y", function (d,i) { return (d.y +(i*gap)); });
                    
            var txt2 = coldatarect.selectAll("text")
                 .data(function (d) { return d; });
                txt2.enter().append("g.barchart:text")
                      .text( function (d,i) {
                         var str = d.name + " | " + "Lineitem " + d.Lineitem + " | " + "PO " + d.po+ " | " + "Oustanding " + d.oustanding ;
                           return str ;
                   }) 
              .attr("width",(((p6x-p7x)-(2*margin))))
              .attr("fill","black")
                     .attr("class", "tabeldata")
                        .style("font-size",function(d) { return (that.bdtabel === 0 ? "10px" : "0px"); })
                  .attr("x", function (d) { return (d.x +gap); })
              .attr("y", function (d,i) { return (d.y +(i*gap) +(rowsize/1.4)); });
                                    
                                        if(that.bdtabel === 1)
                                        {    
                                rect2
                        .transition().duration(200)
                                    .delay(function(d, i) { return i * 200; })
                          .attr("height", function (d) {
                            return (rowsize);
                        });
                                    
                                    var delay =[0,800,300,130.33,50,];
                                    if(dy>p7y)
                                    {
                                        rect2
                                .attr("transform", function(d,i) {
                                        var x = p7x+(tablewidth/2);
                                        var y = p7y+buff+buff*2 + (margin *2);
                                      return "rotate(-180,"+x+","+y+")" ;
                                });
                                    
                                    txt2
                                    .transition().duration(200)
                                                .delay(function(d, i) { if (i===0) { return 1000; }
                                                 return i * delay[i]; })
                                                 .style("font-size", "10px");
                                }
                                else{            
                                    txt2
                                    .transition().duration(200)
                                                .delay(function(d, i) { return i * 200; })
                                                 .style("font-size", "10px");
                                        }    
        
                                    }
                                    
                                    that.bdtabel = 1;
        };
    //----------------------------------------------------------------------------------------
    // 9. Rendering Details:
    //----------------------------------------------------------------------------------------
    this.showbreakdown = function (tp7x,tp7y,tp19x,tp19y) {
              d3.selectAll("svg g.vis text.columns").remove();
              d3.selectAll("svg g.vis line.columns").remove();

            var that = this;
            var lincol = [];

            //9.14 read data from Json 2 to dispaly small rect inside tabel 
            
            var    p7x = tp7x;
            var    p7y = tp7y;
            var    p19x = tp19x;
            var    p19y = tp19y;
            var d = that.subdata;
            var coldata = [];
    //9.15 transversing through Json 2 & store data in temp array  
  for (var i in d) {
      for (var j in d[i]) {
            coldata.push(j);
            lincol.push(j);
  }
}
lincol.push(0);

    var col = this.vis.selectAll("line.breakdown")
    .data( lincol )
  .enter().append("line")
  .attr("fill", "none")
  .attr("stroke",function(d) { return (that.opentabel === 0 ? "SteelBlue" : "none"); })
    .style("stroke-dasharray", ("3, 3"))
    .attr("x1",function (d,i) { return p7x +(i*that.w_cell)-1; })    
    .attr("y1",p7y )
    .attr("x2",function (d,i) { return p19x +(i*that.w_cell)-1; })
    .attr("y2",p19y )
  .attr("class", function (d,i) {
        return "columns" ;
  }); 
        
     var coltext = this.vis.selectAll("text")
        .data( coldata )
      .enter().append("text")
         .text( function (d,i) {
              return d ;
      }) 
        
        .style("font-size",function(d) { return (that.opentabel === 0 ? "14px" : "0px"); })
    .style("font-weight", "bold")
        
      .attr("x", function (d,i) {
          return p19x +(i*that.w_cell);
      })
      .attr("y", function (d,i) {
          return p19y-((p19y-p7y)/2);
      })
    .style("text-anchor", "middle")
    .attr("class", function (d,i) {
            return "columns" ;
      }) 
        
    .attr("transform", function(d,i) {
            
            var x = (that.w_cell/1.8) +p19x +(i*that.w_cell);
            var y =p19y-((p19y-p7y)/2);
          return "rotate(-90,"+x+","+y+")" ;
    });
        
        
    if (that.opentabel==1)
        {
    coltext
        .transition().duration(200)
                .delay(function(d, i) { return i * 200; })
                
                .style("font-size","14px");
       
        }
        if (that.opentabel==1)
        {
    col
        .transition().duration(200)
                .delay(function(d, i) { return i * 200; })
                
        .attr("stroke","SteelBlue");
        }
        
        
        that.opentabel =1 ;

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
    
    
    this.HawkEyeClick = function (e) {

            var that = this;
            
            e.stopPropagation();
      var x = e.target;
            if($(e.target).is('rect') || $(e.target).is('path') || $(e.target).is('text') )
            {
              
            }
            else {
                
                if( that.bdtabel === 1)
                {                    
              d3.selectAll("svg g.vis path.tabeldata").remove();
          d3.selectAll("svg g.vis rect.tabeldata").remove();
          d3.selectAll("svg g.vis text.tabeldata").remove();
          d3.selectAll("svg g.vis g.bars text").remove();
          d3.selectAll("svg g.vis g.bars rect.valuebars")
                .attr("stroke", "none")
                .attr("stroke-width",0);
            that.showbreakdown(that.p7.x,that.p7.y,that.p19.x,that.p19.y);
                that.bdtabel = 1;
                }
                
                else{
                    d3.selectAll("svg g.vis path").remove();
            d3.selectAll("svg g.vis rect").remove();
              d3.selectAll("svg g.vis text.columns").remove();
              d3.selectAll("svg g.vis rect.columns").remove();
              d3.selectAll("svg g.vis line.columns").remove();
                
                }
            }
      /*if (e.target.id == "myDiv" || $(e.target).parents("#myDiv").size()) { 
          alert("Inside div");
      } else { 
         alert("Outside div");
      }*/
            
    };
        //----------------------------------------------------------------------------------------
    // 11.Draw function to render chart with tooltips & other elements:
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

        //this.renderLegends();
        this.renderChart();
    };

    //----------------------------------------------------------------------------------------
    // 12.Data Manuplation
    //----------------------------------------------------------------------------------------
     
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
  
    // Data Helpers
    // Takes the flattened data and returns layers
    // Each layer is a separate category
    // The structure of the layer is made so that is plays well with d3.stack.layout()
    // Docs - https://github.com/mbostock/d3/wiki/Stack-Layout#wiki-values

    // 12.1 extends upon stack layout & does negative vales stacking downwards
    this.barStack = function (dz) {
        var d = [];

        var l = dz.length;
        dz.forEach(function (dz) {
            d.push(
                dz.values
            );

        });
         l = d[0].length;
        while (l--) {
            var posBase = 0,
                negBase = -5;
            d.forEach(function (d) {
                d = d[l];
                d.size = Math.abs(d.y);
                if (d.y < 0) {
                    d.y0 = negBase;
                    negBase -= d.size;
                } else {
                    d.y0 = posBase = posBase + d.size;
                }
            });
        }


        dz.extent = d3.extent(d3.merge(d3.merge(dz.map(function (e) {
            return [e.y0, e.y0 - e.size];
        }))));
        return dz;
    };
        
    // 12.2 arranges each node daat from json one avove the other assing it x & Y value recpetively         
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

    //12.3 Traverses the JSON and returns an array of the 'bars' that are to be rendered
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


     // 13.Return Chart:

    return this;
};
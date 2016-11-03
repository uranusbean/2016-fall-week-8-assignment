console.log('8.3');

var m = {t:100,r:100,b:100,l:100};
var outerWidth = document.getElementById('canvas').clientWidth,
    outerHeight = document.getElementById('canvas').clientHeight;
var w = outerWidth - m.l - m.r,
    h = outerHeight - m.t - m.b;

var plot = d3.select('.canvas')
    .append('svg')
    .attr('width',outerWidth)
    .attr('height',outerHeight)
    .append('g')
    .attr('transform','translate(' + m.l + ',' + m.t + ')');

//d3.set to hold a unique array of airlines
var airlines = d3.set();

//Scale
var scaleX = d3.scaleTime()
    .range([0,w]);
var scaleColor = d3.scaleOrdinal()
    .range(['#fd6b5a','#03afeb','orange','#06ce98','blue']);
var scaleY = d3.scaleLinear()
    .domain([0,1000])
    .range([h,0]);

//Axis
var axisX = d3.axisBottom()
    .scale(scaleX)
    .tickSize(-h);
var axisY = d3.axisLeft()
    .scale(scaleY)
    .tickSize(-w);

//Line generator
var lineGenerator = d3.line()
    .x(function(d){return scaleX(new Date(d.key));})
    .y(function(d){return scaleY(d.averagePrice);})
    .curve(d3.curveCardinal);

d3.queue()
    .defer(d3.csv, '../data/bos-sfo-flight-fare.csv',parse)
    .await(function(err, data){

        //Mine the data to set the scales
        scaleX.domain( d3.extent(data,function(d){return d.travelDate}) );
        scaleColor.domain( airlines.values() );

        //Apend the <path>
        plot.append('path').attr('class','time-series');
        plot.append('path').attr('class','average-all-flights');
        //Add buttons
        d3.select('.btn-group')
            .selectAll('.btn')
            .data( airlines.values() )
            .enter()
            .append('a')
            .html(function(d){return d})
            .attr('href','#')
            .attr('class','btn btn-default')
            .style('color','white')
            .style('background',function(d){return scaleColor(d)})
            .style('border-color','white')
            .on('click',function(d){
                //Hint: how do we filter flights for particular airlines?
                // console.log(d);
                // d3.selectAll('.node')
                //     .attr('hidden',null)
                //     .filter(function(e){
                //         return e.airline !== d
                //     })
                //     .attr('hidden', true);

                var filteredData = data.filter(function(e) {
                  return(e.airline == d);
                });
                draw(filteredData);

                // calculate average of all flights price
                var flightsByTravelDate = d3.nest().key(function(d){return d.travelDate})
                    .entries(data);

                flightsByTravelDate.forEach(function(day){
                   day.averagePrice = d3.mean(day.values, function(d){return d.price});
                });

                flightsByTravelDate = flightsByTravelDate.sort(function(a,b){
                    var aDate = new Date(a.key);
                    var bDate = new Date(b.key);
                    if (aDate.getTime() > bDate.getTime()) {
                        return 1;
                    } else if (aDate.getTime() < bDate.getTime()) {
                        return -1;
                    }
                    return 0;
                });

                plot.select('.average-all-flights')
                    .datum(flightsByTravelDate)
                    .transition()
                    .attr('d',function(array){
                        // console.log(array);
                        return lineGenerator(array);
                    })
                    .style('fill','none')
                    .style('stroke-width','2px')
                    .style('stroke','black')

                //How do we then update the dots?
            });

        //Draw axis
        plot.append('g').attr('class','axis axis-x')
            .attr('transform','translate(0,'+h+')')
            .call(axisX);
        plot.append('g').attr('class','axis axis-y')
            .call(axisY);

        draw(data);

    });

function draw(rows){
    //IMPORTANT: data transformation
    var flightsByTravelDate = d3.nest().key(function(d){return d.travelDate})
        .entries(rows);

    flightsByTravelDate.forEach(function(day){
       day.averagePrice = d3.mean(day.values, function(d){return d.price});
    });

    // console.log(flightsByTravelDate);
    flightsByTravelDate = flightsByTravelDate.sort(function(a,b){
        var aDate = new Date(a.key);
        var bDate = new Date(b.key);
        if (aDate.getTime() > bDate.getTime()) {
            return 1;
        } else if (aDate.getTime() < bDate.getTime()) {
            return -1;
        }
        return 0;
    });
    console.log(flightsByTravelDate);

    //Draw dots
    var node = plot.selectAll('.node')
        .data(rows,function(d){return d.id});
    //ENTER
    var nodeEnter = node.enter()
        .append('circle')
        .attr('class','node')
        .on('click',function(d,i){
            console.log(d);
            console.log(i);
            console.log(this);
        })
        .on('mouseenter',function(d){
            var tooltip = d3.select('.custom-tooltip');
            tooltip.selectAll('.title')
                .html((d.travelDate.getMonth()+1) + '/' + d.travelDate.getDate()  + '/' + d.travelDate.getFullYear() )
            tooltip.select('.value')
                .html('$'+ d.price);
            tooltip.transition().style('opacity',1);

            d3.select(this).style('stroke-width','3px');
        })
        .on('mousemove',function(d){
             var tooltip = d3.select('.custom-tooltip');
             var xy = d3.mouse(d3.select('.container').node());
             tooltip
                .style('left',xy[0]+10+'px')
                .style('top',xy[1]+10+'px');
        })
        .on('mouseleave',function(d){
             var tooltip = d3.select('.custom-tooltip');
             tooltip.transition().style('opacity',0);
             d3.select(this).style('stroke-width','0px');
        })
    //UPDATE+ ENTER
    nodeEnter
        .merge(node)
        .attr('cx',function(d){
            return scaleX(d.travelDate);
        })
        .attr('cy',function(d){
            return scaleY(d.price);
        })
        .attr('r',3)
        .style('fill',function(d){
            return scaleColor(d.airline);
        })
        .style('opacity',1);

    //EXIT
    node.exit().remove();

    //Draw <path>
    plot.select('.time-series')
        .datum(flightsByTravelDate)
        .transition()
        .attr('d',function(array){
            // console.log(array);
            return lineGenerator(array);
        })
        .style('fill','none')
        .style('stroke-width','2px')
        // .style('stroke','black')
        .style('stroke',function(array){
            return scaleColor(array[0].values[0].airline);
        });
}

function parse(d){

    if( !airlines.has(d.airline) ){
        airlines.add(d.airline);
    }

    return {
        airline: d.airline,
        price: +d.price,
        travelDate: new Date(d.travelDate),
        duration: +d.duration,
        id: d.id
    }
}

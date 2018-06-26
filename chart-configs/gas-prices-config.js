const dataSource = require('../data/gas-prices.json');
import { sharedLineMethods } from '../dev-js/shared-line-methods.js';

function customUpdate(isReplay){ // update function for this chart only
    
    console.log(this.Highchart.series);
    this.Highchart.series[1].update({
        zoneAxis:'x',
        zones: [{
            className: 'anchor',
            value: 2009
        },{
            className:'projection',
            value: undefined
        }]
    });
    this.Highchart.series[2].update({
        zoneAxis:'x',
        zones: [{
            className: 'anchor',
            value: 2011
        },{
            className:'projection',
            value: undefined
        }]
    });
    this.Highchart.series[3].update({
        zoneAxis:'x',
        zones: [{
            className: 'anchor',
            value: 2016
        },{
            className:'projection',
            value: undefined
        }]
    });
    function showInitialPoints(){
        sharedLineMethods.togglePoint.call(this,0,0);
        sharedLineMethods.togglePoint.call(this,0,17);
        sharedLineMethods.togglePoint.call(this,1,30);
        sharedLineMethods.togglePoint.call(this,2);            
        sharedLineMethods.togglePoint.call(this,3);    
    }

    this.previousChange = {
        points: [],
        annotations: []
    };
    this.currentStep = 0;

    if ( !isReplay ){
        this.Highchart.setClassName('predicted-gas-prices');
        showInitialPoints.call(this);
        sharedLineMethods.createPlayButton.call(this, animate);
        sharedLineMethods.createOverlayReplay.call(this, animate);
        this.hideShowElements = this.Highchart.renderTo.querySelectorAll('.overlay-replay'); // the elements to hide during animation and show when finished
    } 

   
    function animate(){ // TO DO: EVERYTHIGN BUT STEPS THEMSELVES SHOULD BE IN SHARED METHODS
        const annotateYear = sharedLineMethods.annotateYear;
        const annotate = sharedLineMethods.annotate;
        const backfillSeries = sharedLineMethods.backfillSeries;
        const animateSeries = sharedLineMethods.animateSeries;
        const togglePoint = sharedLineMethods.togglePoint;

       
        sharedLineMethods.prepAnimation.call(this).then(() => {
            console.log(this);
            this.animateNext();
        });

        this.animationSteps = [
            function(resolve){ // step 0
                annotate.call(this, 0, `From 2000 to 2009, natural gas prices ranged from a low of $${ Highcharts.numberFormat(this.dataSource[0]['2002'], 2) } per million Btu in 2002 to $${ Highcharts.numberFormat(this.dataSource[0]['2005'], 2) } in 2005.`);
                 backfillSeries.call(this, 0, 2000, 2009).then(() => {
                    this.Highchart.series[0].points[0].select(true, true);
                    togglePoint.call(this, 0, 'last');
                    resolve(true);
                });
            },
            
            function(resolve){ // step 2,3
                annotate.call(this, 1, `In 2009, an Annual Energy Outlook was released with projections pinned to 2006 numbers. It predicted prices increasing slightly to $${ Highcharts.numberFormat(this.dataSource[1]['2016'], 2) } in 2016.`);
                 backfillSeries.call(this, 1, 2006, 2009).then(() => {
                    togglePoint.call(this, 1);
                    setTimeout(() => {
                        togglePoint.call(this, 1);
                        backfillSeries.call(this, 1, 2010, 2016).then(() => {
                            togglePoint.call(this, 1);
                            resolve(true);
                        });
                    }, 1000);
                });
            },
            function(resolve){ // step 5
                annotate.call(this, 2, `In 2011, another Annual Energy Outlook was released, with projections pinned to 2008 numbers. It predicted gas prices falling slightly by 2016, to $${ Highcharts.numberFormat(this.dataSource[2]['2016'], 2) }.`);
                backfillSeries.call(this, 2, 2008, 2011).then(() => {
                    togglePoint.call(this, 2);
                    setTimeout(() => {
                        togglePoint.call(this, 2);
                        backfillSeries.call(this, 2, 2012, 2016).then(() => {
                            togglePoint.call(this, 2);
                            resolve(true);
                        });
                    }, 1000);
                });
            },
            function(resolve){ // step 6
                togglePoint.call(this,0);
                annotate.call(this, 0, `The actual prices, however, remained lower than both estimates.`);
                backfillSeries.call(this, 0, 2010, 2016).then(() => {
                    togglePoint.call(this,0);
                    resolve(true);
                });
            },
            function(resolve){ // step 8
                togglePoint.call(this,1);
                togglePoint.call(this,2);
                backfillSeries.call(this, 1, 2017, 2030).then(() => {
                    togglePoint.call(this,1);
                    backfillSeries.call(this, 2, 2017, 2035).then(() => {
                        togglePoint.call(this,2);
                        this.Highchart.axes[0].setExtremes(2000,2035);
                        setTimeout(() => {
                            annotate.call(this, 3, `The 2016 Annual Energy Outlook, with projections pinned to 2014 numbers, predicts lower gas prices than the previous two.`);
                            backfillSeries.call(this, 3, 2014, 2016).then(() => {
                                togglePoint.call(this, 3);
                                setTimeout(() => {
                                    togglePoint.call(this, 3);
                                    backfillSeries.call(this, 3, 2017, 2035)
                                    togglePoint.call(this, 3);
                                    resolve(true);
                                }, 1000);
                            });
                        }, 1000);
                    });
                });
            },
            function(resolve){ // step 6
                togglePoint.call(this,0);
                annotate.call(this, 0, `Prices have risen since then but remain below the estimates.`);
                backfillSeries.call(this, 0, 2017, 2017).then(() => {
                    togglePoint.call(this,0);
                    resolve(true);
                    //this.animateNext();
                });
            },
            
            function(resolve){ // step 12
                this.Highchart.annotations[this.Highchart.annotations.length - 1].setVisible(false);
                this.hideShowElements.forEach(el => {
                    el.style.opacity = 1;
                });
                this.Highchart.update({plotOptions: {series: {enableMouseTracking: true}}});
                resolve(true);
            }
        ];
        this.animateNext = function(){
            console.log(this.currentStep);
            this.previousChange.points[this.currentStep] = [];
            this.previousChange.annotations[this.currentStep] = [];
            
            var promise = new Promise((resolve, reject) => {
                this.animationSteps[this.currentStep].call(this,resolve);
            });
            console.log(promise);

            promise.then(() => {
                console.log('resolved');
                incrementStep.call(this);
            });
            function incrementStep(){
                this.renderedNext.classList.remove('disabled');
                this.renderedPrevious.classList.remove('disabled');
                this.currentStep++;
                console.log(this.currentStep);
                
                if ( this.currentStep < this.animationSteps.length ){
                    this.renderedNext.classList.add('show');
                } else {
                    this.renderedNext.classList.remove('show');
                }
                if ( this.currentStep > 1 ){
                    this.renderedPrevious.classList.add('show');
                } else {
                    this.renderedPrevious.classList.remove('show');
                }
            }
        };
        this.animatePrevious = function(){
            console.log(this.previousChange.annotations[this.currentStep - 1]);
            this.previousChange.annotations[this.currentStep - 1].forEach(note => {
                //note.setVisible(false);
                var index = this.Highchart.annotations.indexOf(note);
                this.Highchart.removeAnnotation(index);
            });
            this.previousChange.annotations[this.currentStep - 2].forEach((note,i,array) => {
                if ( i === array.length - 1 ){
                    note.setVisible(true);
                }
            });
            this.previousChange.points[this.currentStep - 1].forEach(pt => {
                pt.remove();
            });
          /*  this.previousChange.annotations[this.currentStep].forEach(note => {
               var index = console.log(this.Highchart.annotations.indexOf(note));
               this.Highchart.removeAnnotation(index);
            });*/
            this.currentStep--;
            console.log(this);
        };
    }
}

export default { 
     /*annotations: [{
        labelOptions: {
            allowOverlap: true,
            //backgroundColor: 'rgba(255,255,255,0.5)',
            verticalAlign: 'bottom',
            y: -15
        },
        labels: [{
            point: {
                xAxis: 0,
                yAxis: 0,
                x: 2000,
                y: 3592
            },
            text: `Hello!`
        }]    
    }],*/
    chart: { 
        animation: {
            duration: 550,
            easing: 'linear'
        },
        type: 'line',   
        height: 500,
    },
    plotOptions: {
        series: {
            allowPointSelect:true,
            connectNulls: true,
            enableMouseTracking: false,
            marker: {
                radius:0.01,
                states: {
                    select: {
                        radius:4
                    }
                },
                symbol: 'circle'
            },
            pointStart: 2000
        }
    },
    subtitle: {
        text: null
    },           
    title: {
        text: 'U.S. natural gas prices to the electric power sector, actual and estimated',
    },
    tooltip: {
        valueDecimals: 2,
        valueSuffix: ' per million Btu',
        valuePrefix: '$'
    },
    xAxis: {
        min: 2000,
        max: 2035,
        startMin: 2000,
        startMax: 2016
    },
    yAxis: {
        allowDecimals: false,
        min: 0,
        max: 10,
        startMin: 0,
        startMax: 10,
        title: {
            text: '$(2011) per million Btu',
            align:'high',
            rotation: 0,
            margin:0,
            y: -25,
            reserveSpace: false,
          //  offset: -110,
            x: -10
        }

    },
    // extends Highcharts options
    dataSource: dataSource,
    seriesCreator: sharedLineMethods.createSeries,
    updateFunction: function(){
        console.log('inUpdateFunction');
        sharedLineMethods.updateChart.call(this);
        customUpdate.call(this);
    },
    initialUpdateParams: [],
    note: 'Sources: U.S. Energy Information Administration (EIA), Annual Energy Outlook (2009, 2011, and 2016); EIA Monthly Energy Review, April 2018.',
};
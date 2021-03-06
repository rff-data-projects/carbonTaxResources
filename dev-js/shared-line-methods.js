import GAEventHandler from './ga-event-handler.js';
export const sharedLineMethods = { // as an exported module `this` depends on context in which method is called

    updateChart(){ 
        this.initialPointsToShow.forEach(pair => {
            sharedLineMethods.togglePoint.call(this,pair[0],pair[1]);
        });
        sharedLineMethods.createPlayButton.call(this);
        sharedLineMethods.createOverlayReplay.call(this);
    },
    prepAnimation(){

        this.previousChange = {
            points: [],
            annotations: [],
            extremes: []
        };
        this.currentStep = 0;
        var duration = this.Highchart.userOptions.chart.animation.duration;
        this.Highchart.update({plotOptions: {series: {
            enableMouseTracking: false,
            allowPointSelect: true
        }}});
        this.Highchart.renderTo.querySelector('.overlay-replay').style.opacity = 0;

        this.Highchart.renderTo.classList.remove('faded');
        this.Highchart.annotations.forEach(note => {
            note.destroy();
        });
        this.Highchart.annotations = []; // destroy notes and empty the array to keep from doubling annotations
                                         // on replay
        this.Highchart.yAxis[0].setExtremes(this.yAxis.startMin,this.yAxis.startMax);
        this.Highchart.xAxis[0].setExtremes(this.xAxis.startMin,this.xAxis.startMax);
        this.series = sharedLineMethods.createNullSeries(this.dataSource); // replace the series data with nulls as starting point for animation
        this.Highchart.update({series: this.series});

        sharedLineMethods.createNextAndPrevious.call(this);
        setTimeout(() => {
            sharedLineMethods.animateNext.call(this);
        }, duration);
    },
    animateNext(){
        console.log(this.currentStep);
        this.previousChange.points[this.currentStep] = [];
        this.previousChange.annotations[this.currentStep] = [];
        this.previousChange.extremes[this.currentStep] = [];
        
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
            if ( this.currentStep > 1 && this.currentStep < this.animationSteps.length  ){
                this.renderedPrevious.classList.add('show');
            } else {
                this.renderedPrevious.classList.remove('show');
            }
            if ( this.currentStep === this.animationSteps.length ){
                this.Highchart.renderTo.querySelector('.overlay-replay').style.opacity = 1;
                this.currentStep = 0;
            }
        }
    },
    animatePrevious(){
        if ( this.previousChange.extremes[this.currentStep - 1].length > 0 ){
            console.log(this.previousChange.extremes[this.currentStep - 1]);
            this.Highchart.xAxis[0].setExtremes(...this.previousChange.extremes[this.currentStep - 1][0]);
            this.Highchart.yAxis[0].setExtremes(...this.previousChange.extremes[this.currentStep - 1][1]);
        }
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
        this.previousChange.points[this.currentStep - 1].forEach((pt, i) => {
            console.log(pt)
            var seriesIndex = pt.series.index; // primitive value so shouldn't change after pt is removed
            pt.remove();
            //console.log(this.Highchart.series[seriesIndex]);
            sharedLineMethods.togglePoint.call(this,seriesIndex);
        });
      /*  this.previousChange.annotations[this.currentStep].forEach(note => {
           var index = console.log(this.Highchart.annotations.indexOf(note));
           this.Highchart.removeAnnotation(index);
        });*/
        this.renderedNext.classList.remove('disabled');
        this.renderedPrevious.classList.remove('disabled');
        this.currentStep--;
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
        this.previousChange.annotations.pop();
        this.previousChange.points.pop();
        console.log(this.previousChange);
    },
    createNextAndPrevious(){
        var triNext = document.createElement('div');
        triNext.className = 'triangle triangle-right triangle-next';
        triNext.setAttribute('tabindex',0);
        triNext.setAttribute('title','next');
        var triPrevious = document.createElement('div');
        triPrevious.className = 'triangle triangle-left triangle-previous';
        triPrevious.setAttribute('tabindex',0);
        triPrevious.setAttribute('title','previous');
        this.Highchart.renderTo.insertAdjacentHTML('afterbegin', triNext.outerHTML);
        this.Highchart.renderTo.insertAdjacentHTML('afterbegin', triPrevious.outerHTML);

        this.renderedNext = this.Highchart.renderTo.querySelector('.triangle-next');
        this.renderedPrevious = this.Highchart.renderTo.querySelector('.triangle-previous');
        this.renderedNext.onclick = () => {
            console.log(this);
            GAEventHandler('animateNext', this.chart.className);
            disableNextAndPrevious.call(this);
            sharedLineMethods.animateNext.call(this);
        };
        this.renderedPrevious.onclick = () => {
            GAEventHandler('animatePrevious', this.chart.className);
            disableNextAndPrevious.call(this);
            sharedLineMethods.animatePrevious.call(this);
        }
        function disableNextAndPrevious(){
            this.renderedPrevious.classList.add('disabled');
            this.renderedNext.classList.add('disabled');
        }
    },
    createOverlayReplay(){
        var replay = document.createElement('button');
        replay.className = 'overlay-replay magazine-button--small';
        replay.setAttribute('title','Click or tap replay the animation');
        replay.innerText = 'replay';
        this.Highchart.renderTo.insertAdjacentHTML('afterbegin',replay.outerHTML);
        var btn = this.Highchart.renderTo.querySelector('.overlay-replay');
        btn.style.opacity = 0;
        btn.onclick = () => {
            GAEventHandler('replayAnimation', this.chart.className);
            sharedLineMethods.prepAnimation.call(this);
        };
    },
    createSeries(data){ 
        var array = data.map((series, i) => {
            var data = [];
            for ( var year = 2000; year < 2036; year++ ){
                data.push(series[year.toString()]);
            }
            return {
                name: series.series,
                data: data,
                className: i === 0 ? 'solid' : 'shortdot'
            }
        });
        
        return array;
    },
    createNullSeries(data){ 
        var array = data.map((series, i) => {
            console.log(series);
            var data = [];
            for ( var year = 2000; year < 2036; year++ ){
                if ( series[year.toString()] === null ){
                    data.push(null);
                } else {
                    break;
                }
            }
            return {
                name: series.series,
                data: data,
                className: i === 0 ? 'solid' : 'shortdot'
            }
        });
        
        return array;
    },
    annotateYear(series, year, text, position){
        console.log('annotateYear', this);
        if (this.Highchart.annotations && this.Highchart.annotations.length > 0) {
            this.Highchart.annotations[this.Highchart.annotations.length - 1].setVisible(false);
        }
        var options = {
            id: this.Highchart.annotations.length,
            labelOptions: {
                allowOverlap: true,
                verticalAlign: 'top',
                visible: false,
                align: 'left',
                x: 10
            },
            labels: [{
                point: {
                    xAxis: 0,
                    yAxis: 0,
                    x: year,
                    y: this.dataSource[series][year.toString()]
                },
                text: text
            }]    
        };
        if ( position && Array.isArray(position) ){
            
            options.labels[0].point.x = position[0];
            options.labels[0].point.y = position[1];
        }
        if ( typeof position === 'string' ){
            options.labels[0].useHTML = true;
            options.labels[0].className = position + ' highcharts-color-' + series;
            options.labels[0].point.xAxis = undefined;
            //options.labels[0].point.yAxis = undefined;
            options.labels[0].point.x = 0;
            //options.labels[0].point.y = 0;

        }
       /* if ( position === 'top-right' ){
            options.labels[0].point.x = this.Highchart.axes[0].getExtremes().max;
            options.labels[0].point.y = this.Highchart.axes[1].getExtremes().max;
        }
        if ( position === 'bottom-right' ){
            options.labels[0].point.x = this.Highchart.axes[0].getExtremes().max;
            options.labels[0].point.y = this.Highchart.axes[1].getExtremes().min;
        }
        if ( position === 'bottom-left' ){
            options.labels[0].point.x = this.Highchart.axes[0].getExtremes().min;
            options.labels[0].point.y = this.Highchart.axes[1].getExtremes().min;
        }
        if ( position === 'top-left' ){
            options.labels[0].align = 'right';
            options.labels[0].point.x = this.Highchart.axes[0].getExtremes().min;
            options.labels[0].point.y = this.Highchart.axes[1].getExtremes().max;
        }
        if ( position === 'bottom-middle' ){
            options.labels[0].point.x = ( this.Highchart.axes[0].getExtremes().min + this.Highchart.axes[0].getExtremes().max) / 2;
            options.labels[0].point.y = this.Highchart.axes[1].getExtremes().min;
        }*/
       this.Highchart.addAnnotation(options);
      
       this.Highchart.annotations[this.Highchart.annotations.length - 1].setVisible(true);
       console.log(this.previousChange, this.currentStep);
       this.previousChange.annotations[this.currentStep].push(this.Highchart.annotations[this.Highchart.annotations.length - 1]);
       console.log('hello?', this.previousChange);
    },
    annotate(series, text){
        console.log(series,text,this);
        if (this.Highchart.annotations && this.Highchart.annotations.length > 0) {
            this.Highchart.annotations[this.Highchart.annotations.length - 1].setVisible(false);
        }
        var options = {
            id: this.Highchart.annotations.length,
            labelOptions: {
                allowOverlap: true,
                verticalAlign: 'top',
                visible: false,
                align: 'left',
                x: 10
            },
            labels: [{
                point: {
                    x:0,
                    y:0
                },
                useHTML: true,
                text: text,
                className: 'full highcharts-color-' + series
            }]    
        };
        
       this.Highchart.addAnnotation(options);
      
       this.Highchart.annotations[this.Highchart.annotations.length - 1].setVisible(true);
       this.previousChange.annotations[this.currentStep].push(this.Highchart.annotations[this.Highchart.annotations.length - 1]);
    },
    fillSeries(series, begin, end ){ // ie 2006, 2009


        return new Promise(resolve => {

           
            for ( let i = begin; i <= end; i++){
                this.Highchart.series[series].addPoint([i, this.dataSource[series][i.toString()]]); 
            }
           /* // place the first point
            this.Highchart.series[series].addPoint(begin, this.dataSource[series][begin.toString()]); 
            

            // place the last point
            if ( end > begin ){
                this.Highchart.series[series].addPoint(end, this.dataSource[series][end.toString()]); 
            }
            
            //update the placeholders with data
            for ( let i = yearSpan; i > 1; i-- ){ 
                this.Highchart.series[series].points[this.Highchart.series[series].points.length - i].update(this.dataSource[series][(end - i + 1).toString()]);
            }
            console.log('series: ' + series, 'begin :' +  begin, 'end: ' + end);
*/
            // save state to previousChange object
            var yearSpan = end - begin; // ie 0
            for ( let i = yearSpan; i >= 0; i-- ){
                console.log('i: ' + i);
                this.previousChange.points[this.currentStep].push(this.Highchart.series[series].points[this.Highchart.series[series].points.length - 1 - i]);
            }
            console.log(this.previousChange.points[this.currentStep]);
            resolve(true);

        });

    },
    animateSeries(series, begin, end, delay = 500){
        //console.log(this);
        return new Promise((resolve,reject) => {
          //  console.log(this);
            var current = begin;
            var interval = setInterval(() => {
                if ( current <= end ){
                    console.log(this);
                    // below you have to specify the x value or the points won't bein thr right place if you redo the animation
                    this.Highchart.series[series].addPoint([current, this.dataSource[series][current.toString()]]);
                    this.previousChange.points[this.currentStep - 1].push(this.Highchart.series[series].points[this.Highchart.series[series].points.length - 1]);
                    current++;
                } else {
                    sharedLineMethods.togglePoint.call(this, series);
                    setTimeout(() => {
                        resolve(true);
                    },delay);
                    clearInterval(interval);
                }
            },500);  // set bac to 500;
        });
    },
    togglePoint(series, point = 'last'){
        var lastPoint;
        if ( point === 'last' ){
            lastPoint = this.Highchart.series[series].points[this.Highchart.series[series].points.length - 1];
        } else {
            lastPoint = this.Highchart.series[series].points[point];
        }
        lastPoint.select(null, true);
    },
    createPlayButton(){
        var playButton = document.createElement('div');
        playButton.setAttribute('title','Click or tap to start animation');
        playButton.setAttribute('tabindex', 0);
        playButton.className = 'triangle triangle-right';
        playButton.setAttribute('id','play-button');
        var dismiss = document.createElement('button');
        dismiss.innerText = 'skip animation';
        dismiss.className = 'dismiss-button magazine-button--small';
        dismiss.setAttribute('title','Click or tap to skip the animation');
        this.Highchart.renderTo.classList.add('faded');
        this.Highchart.renderTo.insertAdjacentHTML('afterbegin', playButton.outerHTML);
        this.Highchart.renderTo.insertAdjacentHTML('afterbegin', dismiss.outerHTML);
        var renderedPlayButton = this.Highchart.renderTo.querySelector('#play-button');
        var renderedDismiss = this.Highchart.renderTo.querySelector('.dismiss-button');
        renderedPlayButton.onclick = () => {
            GAEventHandler('playAnimation', this.chart.className);
            sharedLineMethods.prepAnimation.call(this);
            removeOverlay.call(this);
        };
        renderedDismiss.onclick = (e) => {
            GAEventHandler('skipAnimation', this.chart.className);
            this.Highchart.update({plotOptions: {series: {
                enableMouseTracking: true,
                allowPointSelect: false
            }}});
            removeOverlay.call(this);
        };
        function removeOverlay(){
            this.Highchart.renderTo.classList.remove('faded');
            renderedPlayButton.onclick = '';
            renderedPlayButton.classList.add('clicked');
            renderedDismiss.classList.add('clicked');

            setTimeout(() => {
                renderedPlayButton.style.display = 'none';
                renderedDismiss.style.display = 'none';
            },250);
        }

    }
};
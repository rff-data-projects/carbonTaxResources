export default function(options){
    //var container = document.createElement('div');
    //container.className = ' form-container flex space-between';

    var form = document.createElement('form');
    form.className = options.userOptions.type;
    var set = document.createElement('fieldset');
    var optionsContainer = document.createElement('div');
    var legend = document.createElement('legend');
    legend.innerText = options.userOptions.legend;
    set.appendChild(legend);
    options.userOptions.options.forEach((s,i) => {
        var label = document.createElement('label');
        label.setAttribute('for', 'r-' + options.Highchart.container.id + '-' + i);
        var option = document.createElement('input');
        option.setAttribute('type','radio');
        option.setAttribute('id','r-' + options.Highchart.container.id + '-' + i);
        option.setAttribute('name','tax-level');
        option.setAttribute('value',s.key);
        if ( options.initialCategory === s.key ){
            option.setAttribute('checked','');
        }
        label.appendChild(option);
        label.insertAdjacentHTML('beforeend',s.value);
        optionsContainer.appendChild(label);
    });
    set.appendChild(optionsContainer);
    form.appendChild(set);
    options.Highchart.renderTo.insertAdjacentHTML('afterbegin', form.outerHTML);
    //console.log(options.Highchart.renderTo);
    var rendered = options.Highchart.renderTo.querySelector('form');
    rendered.querySelectorAll('input').forEach(input => {
        input.onchange = function(){
            options.updateFunction.call(options,this.value);
        };
    }); 
    rendered.value = options.initialCategory;
    /*rendered.onchange = function(){
        options.updateFunction.call(options,rendered.value);
    };*/
};
Pyk.Ultimate = function(options){
    this.init = function(){
	if(!this.validate_options()) return false;
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

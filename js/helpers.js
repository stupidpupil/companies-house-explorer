var prettify_company_name = function(company_name){
	ret = company_name.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
	return(ret);
}

var fix_company_id = function(company_id){
	return(company_id.padStart(8, '0'))
}


var api_key;

$(function(){

	const params = new Proxy(new URLSearchParams(window.location.search), {
  		get: (searchParams, prop) => searchParams.get(prop),
	});

	api_key = params.api_key;

});
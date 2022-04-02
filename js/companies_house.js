var get_details_for_company = function(company_id){
	var the_promise = $.get({
		url: "https://api.company-information.service.gov.uk/company/" + company_id,
		headers: {
			Authorization: "Basic " + btoa(api_key+":")
		},
		crossDomain: true
	});

	return(the_promise);
}

var get_psc_for_company = function(company_id){
	var the_promise = $.get({
		url: "https://api.company-information.service.gov.uk/company/" + company_id + "/persons-with-significant-control",
		headers: {
			Authorization: "Basic " + btoa(api_key+":")
		},
		crossDomain: true
	});

	return(the_promise);
}

var get_officers_for_company = function(company_id){
	var the_promise = $.get({
		url: "https://api.company-information.service.gov.uk/company/" + company_id + "/officers",
		headers: {
			Authorization: "Basic " + btoa(api_key+":")
		},
		crossDomain: true
	});

	return(the_promise);
}
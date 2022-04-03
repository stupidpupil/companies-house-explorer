var cy;
var cy_selection_data;

$(function(){

	cy = cytoscape({
	  	container: $('#cy'),

		style: [ // the stylesheet for the graph
		    {
		      selector: 'node',
		      style: {
		        'background-color': '#666',
		        'label': 'data(pretty_name)'
		      }
		    },

		    {
		    	selector: "node[cy_type='uk-company']",
		    	style: {
		    		'background-color' : '#833'
		    	}

		    },

		    {
		    	selector: "node[cy_type='foreign']",
		    	style: {
		    		'background-color' : 'green'
		    	}

		    },


		    {
		    	selector: "node[?marked_as_important]",
		    	style: {
		    		'border-width' : 3,
		    		'border-color' : 'red'
		    	}

		    },


		    {
		      selector: 'edge',
		      style: {
		        'width': 3,
		        'line-color': '#ccc',
		        'target-arrow-color': '#ccc',
		        'target-arrow-shape': 'triangle',
		        'arrow-scale': 2,
		        'curve-style': 'bezier',
		        'color': '#777',
		        'font-size': '0.7em'
		      }
		    },

		    {
		    	selector: "edge[cy_type='officer']",
		    	style:{
		    		'label': 'data(role)'
		    	}
		    },


		    {
		    	selector: "edge[cy_type='psc']",
		    	style:{
		    		'label': 'data(pretty_name)'
		    	}
		    }

		  ],

	});




	$("#add_new_company").click(function(){
		cy.$("*").unselect();
		var company_id = $("#new_registration_number").val();
		add_company_to_cy_from_id(company_id, {marked_as_important:true, selected:true});
	});

	$("#add_officers").click(function(){
		add_officers_to_cy_for_company(cy_selection_data.company_id);
	});

	$("#add_pscs").click(function(){
		add_psc_to_cy_for_company(cy_selection_data.company_id);
	});

	$("#add_address").click(function(){

		var address = cy_selection_data.address;

		address.id = "address_" + address.address_line_1 + address.postal_code;
		address.pretty_name = address.address_line_1 + ", " + address.postal_code;

		cy.add([
			{data:cy_selection_data.address},
			{data:{
				source: address.id,
				target: cy_selection_data.id,
				id: "address_edge_" + address.id + "-" + cy_selection_data.id
			}}
		]);
	});

	$("#relayout").click(function () {
		cy.layout({name:'breadthfirst'}).run();
	});

	$("#remove_node").click(function () {
		cy.$("node[id='" + cy_selection_data.id +"']").remove();
	});


	cy.on('select', 'node', function(evt){
		cy_selection_data = evt.target[0].data();

		$("#add_officers").prop('disabled', true);
		$("#add_pscs").prop('disabled', true);
		$("#add_address").prop('disabled', true);


		$("#selection_name").text(cy_selection_data.pretty_name);

		if(cy_selection_data?.link){
			$("#selection_link").attr('href', cy_selection_data.link);
			$("#selection_link").text('Link');
		}else{
			$("#selection_link").text('');
		}

		$("#selection_info_dictionary").empty();

		Object.entries(cy_selection_data).forEach(e => {
			$("#selection_info_dictionary").append(
				"<dt>" + JSON.stringify(e[0], null, 1) + "</dt>" +
				"<dd>" + JSON.stringify(e[1], null, 1) + "</dd>"
			)
		});



		if(cy_selection_data?.company_id){
			$("#add_officers").prop('disabled', false);
			$("#add_pscs").prop('disabled', false);
		}

		if(cy_selection_data?.address){
			$("#add_address").prop('disabled', false);
		}

	})

	cy.on('add', 'node', function(evt){
		evt.target.data('needs_layout', true);
		cy.$('node').lock();
		cy.$('node[?needs_layout]').unlock();
		cy.$('node').layout({name:'cose', nodeRepulsion: 8000, nodeDimensionsIncludeLabels:true, animate:false}).on('layoutstop',
			function(){
				console.log('here')
				evt.target.data('needs_layout', false);
				cy.$('node').unlock();
			}
		).run()
	})

})



var add_company_to_cy_from_id = function(company_id, extra_data = {}) {
	var ret = get_details_for_company(company_id).done(function(data){
		data.pretty_name = prettify_company_name(data.company_name);
		data.company_id = company_id;
		data.id = "company_" + company_id;
		data.cy_type = 'uk-company';
		data.link = "https://find-and-update.company-information.service.gov.uk/" + data.links.self;
		data.address = data.registered_office_address;
		data.address_type = 'registered_office';
		data = {...data, ...extra_data};
		console.log(data);
		cy.add([{data:data}]);

		if(extra_data?.selected){
			cy.$("node[company_id='" + company_id + "']").select();
		}
	});

	return(ret);
}

var add_officers_to_cy_for_company = function(company_id, extra_data = {}){
	get_officers_for_company(company_id).done(function(data){
		var data_for_cy = [];

		data.items.forEach(officer => {


			var edge = {
 				target: "company_"+company_id, 
 				role: officer.officer_role, 
 				cy_type: 'officer',
 				appointed_on: officer.appointed_on,
 				resigned_on: officer.resigned_on
			}


			if(edge?.resigned_on){
				return;
			}

			if(officer?.identification?.identification_type == "uk-limited-company" |
				officer?.identification?.place_registered == "Companies House" |
				officer?.identification?.place_registered == "Uk Register Of Companies" |
				officer?.identification?.place_registered == "England And Wales Company Registry" |
				officer?.identification?.place_registered?.toUpperCase() == "United Kingdom"?.toUpperCase() |
				officer?.identification?.country_registered?.toUpperCase() == "England And Wales"?.toUpperCase() |
				officer?.identification?.country_registered?.toUpperCase() == "England"?.toUpperCase() |
				officer?.identification?.country_registered?.toUpperCase() == "Wales"?.toUpperCase() |
				officer?.identification?.country_registered?.toUpperCase() == "Scotland"?.toUpperCase() |
				officer?.identification?.country_registered?.toUpperCase() == "Uk"?.toUpperCase() |
				officer?.identification?.country_registered?.toUpperCase() == "United Kingdom"?.toUpperCase()
				){
				var office_company_id = fix_company_id(officer.identification.registration_number);
				add_company_to_cy_from_id(office_company_id).done(
					function(){
						edge.source = "company_"+office_company_id;
						edge.id = "officer_appt_" + edge.target + "-" + edge.source + ":" + edge.role + edge.appointed_on;
						cy.add([{data: edge}])
					});
			}else{
				officer.pretty_name = officer.name;
				officer.id = "person_"+officer.name+officer?.date_of_birth?.month+officer?.date_of_birth?.year;

				officer.link = "https://find-and-update.company-information.service.gov.uk/" + officer.links.officer.appointments;

				data_for_cy.push({data: officer})
				
				edge.source = officer.id;
				edge.id = "officer_appt_" + edge.target + "-" + edge.source + ":" + edge.role + edge.appointed_on;

				data_for_cy.push({data:edge})
			}
		})

		console.log(data_for_cy);
		cy.add(data_for_cy);
	})
}

var add_psc_to_cy_for_company = function(company_id, extra_data = {}){
	get_psc_for_company(company_id).done(function(data){
		var data_for_cy = [];

		data.items.forEach(psc => {


			var edge = {
 				target: "company_"+company_id, 
 				cy_type: 'psc',
 				pretty_name: psc.natures_of_control[0],
 				ceased_on: psc?.ceased_on
			}

			if(edge?.ceased_on){
				return;
			}


			if(
				psc?.identification?.place_registered == "Companies House" |
				psc?.identification?.place_registered == "Uk Register Of Companies" |
				psc?.identification?.place_registered == "England And Wales Company Registry" |
				psc?.identification?.place_registered?.toUpperCase() == "United Kingdom"?.toUpperCase() |
				psc?.identification?.country_registered?.toUpperCase() == "England And Wales"?.toUpperCase() |
				psc?.identification?.country_registered?.toUpperCase() == "England"?.toUpperCase() |
				psc?.identification?.country_registered?.toUpperCase() == "Wales"?.toUpperCase() |
				psc?.identification?.country_registered?.toUpperCase() == "Scotland"?.toUpperCase() |
				psc?.identification?.country_registered?.toUpperCase() == "Uk"?.toUpperCase() |
				psc?.identification?.country_registered?.toUpperCase() == "United Kingdom"?.toUpperCase()
				){
				var office_company_id = fix_company_id(psc.identification.registration_number);
				add_company_to_cy_from_id(office_company_id).done(
					function(){
					edge.source = "company_"+office_company_id;
					edge.id = "psc_" + edge.target + "-" + edge.source;
					cy.add([{data: edge}])
				});
			}else{
				psc.pretty_name = psc.name;

				if(psc?.identification?.legal_form){
					psc.id = "foreign_"+psc.name;
					psc.cy_type = "foreign";
				}else{
					psc.id = "person_"+psc.name+psc?.date_of_birth?.month+psc?.date_of_birth?.year;
					psc.cy_type = "person";		
				}
				data_for_cy.push({data: psc})

				edge.source = psc.id;
				edge.id = "psc_" + edge.target + "-" + edge.source;

				data_for_cy.push({data:edge})
			}
		})

		console.log(data_for_cy);
		cy.add(data_for_cy);
	})
}
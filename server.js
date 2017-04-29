var express = require('express')
var app = express()
var http = require('http')
var https = require('https')
var json = require('./secrets.json');
var firebase = require('firebase');


app.get('/upc/:upcCode', function(req, res) {
	var config = {
		apiKey: "AIzaSyDa7CpASbxArYtrSARNkJy36FmuHdm7GpU",
		databaseURL: "https://eligo-ca1b0.firebaseio.com",
	};
	firebase.initializeApp(config);

	var drtiRef = firebase.database().ref("/drti");
	var results = drtiRef.orderByChild("restrictions").equalTo("egg").toString();

	//details of api call with upc code
	// var options = {
	//   host: "api.nutritionix.com",
	//   path: '/v1_1/item?upc='+req.params.upcCode+'&appId='+json.nutritionix.users.alex.id+'&appKey='+json.nutritionix.users.alex.key,
	//   method: 'GET',
	// };

	//GET request to personally hosted json file for cocktail peanuts, regardless of upc sent. 
	var options = {
	  host: "students.washington.edu",
	  path: '/adtroupe/capstone/example.json',
	  method: 'GET',
	};

	callback = function(response) {
		var str = '';

		//receives data and appends to str
		response.on('data', function (chunk) {
			str += chunk;
		});

		//on end of api call, json sent
		response.on('end', function () {
			var ingredients = JSON.parse(str).nf_ingredient_statement;
			var ingArray = ingredients.split(', ');
			res.send(ingArray + " : " + results);
		});
	};
	https.request(options, callback).end();
})


//for testing, call >node index.js to create server. then call localserver:3000/upc/[upcCode]
var server = app.listen(process.env.PORT || 8080, function () {
	var port = server.address().port;
	console.log('Example app listening on port ', port)
})

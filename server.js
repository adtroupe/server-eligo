var express = require('express')
var app = express()
var http = require('http')
var https = require('https')
var json = require('./secrets.json');
var firebase = require('firebase');

var config = {
	apiKey: "AIzaSyDa7CpASbxArYtrSARNkJy36FmuHdm7GpU",
	databaseURL: "https://eligo-ca1b0.firebaseio.com",
};
firebase.initializeApp(config);

var user = JSON.parse('{ "0" : ["peanut", "dairy"],' +
  '"1" : ["soy"],' +
  '"2" : ["egg"]}');

function getDrtiInfo(callback) {
	var drtiRef = firebase.database().ref("/drti");
	drtiRef.on('value', function(snapshot) {
		callback(snapshot.child("restrictions").val());
	});
};

function compareRestrictions(str, callback) {
	var ingredients = JSON.parse(str).nf_ingredient_statement;
	var ingArray = ingredients.split(', ');	
	var userAndRestriction = '';
	getDrtiInfo(function(object) {
		for (var subuser in user) {
			subuser.forEach(function(dr) {
				var drIngredients = object.child(dr.toLowerCase()).val();
				ingArray.forEach(function(i) {
					drIngredients.forEach(function(i2) {
						var regex = new RegExp("\b"+i2+"\b", "ig");
						if (regex.test(i)) {
							if (userAndRestriction != '') {
								userAndRestriction += "," + i + ":" + dr;
							} else {
								userAndRestriction += i + ":" + dr;
							};
						};
					});
				});
			});
		};
		callback(userAndRestriction);
	});
}

app.get('/upc/:upcCode', function(req, res) {
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
			// Compares restrictions to ingredients
			compareRestrictions(str, function(results) {
				res.send(JSON.stringify(results));
			});

			//Gets only api returned string
			//res.send(str);

			//Breaks up api ingredients
			// var ingredients = JSON.parse(str).nf_ingredient_statement;
			// var ingArray = ingredients.split(', ');

			// Testing ingredient array and api returned string
			// getDrtiInfo(function(item) {
			// 	res.send(ingArray + " : " + JSON.stringify(item)); 
			// });
		});
	};
	https.request(options, callback).end();
});


//for testing, call >node index.js to create server. then call localserver:3000/upc/[upcCode]
var server = app.listen(process.env.PORT || 8080, function () {
	var port = server.address().port;
	console.log('Example app listening on port ', port)
})

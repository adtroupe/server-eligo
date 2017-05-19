var express = require('express')
var app = express()
var http = require('http')
var https = require('https')
var json = require('./secrets.json');
var firebase = require('firebase');
var bodyParser = require("body-parser");

app.use(bodyParser.json());
var config = {
	apiKey: "AIzaSyDa7CpASbxArYtrSARNkJy36FmuHdm7GpU",
	databaseURL: "https://eligo-ca1b0.firebaseio.com",
};
firebase.initializeApp(config);

//test user
// var user = JSON.parse('{ "0" : ["dairy"],' +
//   '"1" : ["peanut"]}');

var userAndRestriction = '';

function getDrtiInfo(callback) {
	var drtiRef = firebase.database().ref("/drti");
	drtiRef.on('value', function(snapshot) {
		callback(snapshot.child("restrictions"));
	});
};

function getAccountInfo(ref, callback) {
	// ref.on('value', function(snapshot) {
	// 	callback(snapshot);
	// });
	ref.once('value').then(function(snapshot) {
		callback(snapshot);
	});
};

function compareRestrictions(id, str, callback) {
	var ingredients = JSON.parse(str).nf_ingredient_statement;
	var ingArray = ingredients.split(', ');
	var userRef = firebase.database().ref("/accounts/"+id);
	getDrtiInfo(function(object) {
		userRef.once('value').then(function(snapshot) {
		//userRef.on('value', function(snapshot) {
			for (var user in snapshot.child('users').val()) {
				for (var dr in snapshot.child('users').child(user).child('dr').val()) {
					var drVal = snapshot.child('users').child(user).child('dr').val();
					var drIngredients = object.child(drVal[dr]).val();
					for (var i in ingArray) {
						for (var i2 in drIngredients) {
							var regex = new RegExp(drIngredients[i2], 'ig');
							if (regex.test(ingArray[i])) {
								userAndRestriction = userAndRestriction.concat("***", user, "$", snapshot.child('users').child(user).child('first').val(), "$", snapshot.child('users').child(user).child('last').val(), "$", drVal[dr], "$", drIngredients[i2], "$", ingArray[i]);
							};
						};
					};
				};
			};
			callback(userAndRestriction);
		});
	});
}


//req.query.userId --> get a snapshot and then parse through by user.dr.value
app.get('/upc/:upcCode', function(req, res) {
	var account = req.query.accountId;
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
		response.once('data', function (chunk) {
			str += chunk;
			var read = JSON.parse(str);
			var historyRef = firebase.database().ref("/accounts/"+account+"/history");
			var dateString = '';
			var dt = new Date();
			var newHistoryPostRef = historyRef.push();
			newHistoryPostRef.set({
				upc : req.params.upcCode,
				name : read["item_name"],
				dateTime : dt.getTime()				
			});	
		});
		//on end of api call, json sent
		response.once('end', function () {
			//Compares restrictions to ingredients and returns JSON object
			compareRestrictions(account, str, function(results) {
				var retJson = JSON.parse(str);
				retJson["Restrictions"]=results;
				res.send(retJson);
			})
		});
	};
	https.request(options, callback).end();
});


app.post('/login', function(req, res) {
	var auth = req.body.auth;
	var account = req.body.accountId;
	var accountRef = firebase.database().ref("/accounts/"+account);
	accountRef.update({
		auth : auth
	}).then(getAccountInfo(accountRef, function(object) {
		res.send(object.val());
	}));
});


app.post('/users', function(req, res) {
	var account = req.body.accountId;
	var sub = req.body.subUserId;
	var first = req.body.first;
	var last = req.body.last;
	var dr = req.body.dr;
	//var accountRef = firebase.database().ref("/accounts/" + id);
	var usersRef = firebase.database().ref("/accounts/" + account + "/users/" + sub);
	usersRef.update({
		first : first,
		last : last,
		dr : dr
	}).then(getAccountInfo(firebase.database().ref("/accounts/" + account), function(object) {
		res.send(object.val());
	}));
});

app.post('/deleteUser', function(req, res) {
	var account = req.body.accountId;
	var user = req.body.subUserId;
	//var accountRef = firebase.database().ref("/accounts/" + account);
	var usersRef = firebase.database().ref("/accounts/"+account+"/users/"+user);
	usersRef.remove().then(getAccountInfo(firebase.database().ref("/accounts/" + account), function(object) {
		res.send(object.val());
	}));
});

app.post('/deleteAccount', function(req, res) {
	var account = req.body.accountId;
	var accountRef = firebase.database().ref('/accounts/' + account);
	accountRef.remove().then(function() {
		res.send("Account Deleted");
	});
});

app.post('/history', function(req, res) {
	var account = req.body.accountId;
	var historyRef = firebase.database().ref('/accounts/' + account + '/history');
	//res.send(historyRef.orderByKey().limitToFirst(10).val());
	historyRef.orderByKey().limitToFirst(10).once('value').then(function(object) {
		res.send(object);
	});
});

app.post('/list', function(req, res) {
	var account = req.body.accountId;
	var groceryList = req.body.list;
	var accountRef = firebase.database().ref('/accounts/' + account);
	accountRef.update({
		list : groceryList
	}).then(function() {
		res.send("200 OK")
	});
});

//for testing, call >node index.js to create server. then call localserver:3000/upc/[upcCode]
var server = app.listen(process.env.PORT || 8080, function () {
	var port = server.address().port;
	console.log('Example app listening on port ', port)
});

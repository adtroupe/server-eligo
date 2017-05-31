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
	databaseURL: "https://eligo-ca1b0.firebaseio.com"
};
firebase.initializeApp(config);

//Gets Dietary Restriction info from Firebase and returns a snapshot of it
function getDrtiInfo(callback) {
	var drtiRef = firebase.database().ref("/drti");
	drtiRef.on('value', function(snapshot) {
		callback(snapshot.child("restrictions"));
	});
};

//Gets Account Info from Firebase based on ref and returns a snapshot of the account
function getAccountInfo(ref, callback) {
	ref.once('value').then(function(snapshot) {
		callback(snapshot);
	});
};

//Compares user dietary restrictions within an account with the ingredients received from the API call
function compareRestrictions(id, str, callback) {
	var userAndRestriction = '';
	var ingredients = JSON.parse(str).nf_ingredient_statement;
	var ingArray = ingredients.split(', ');
	var userRef = firebase.database().ref("/accounts/"+id);
	getDrtiInfo(function(object) {
		userRef.once('value').then(function(snapshot) {
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

//Gets UPC & Product information from nutritionix API, parses through data, adds certain product data to firebase history.
//Then appends restriction data to JSON and returns
app.get('/upc/:upcCode', function(req, res, next) {
	var array = ['884912129512','077290772009','051000167750','015300430532','041196010008','027271112287','028400039796','070292153210','044000031107','021000658831','016000264694'];
	var account = req.query.accountId;
	var num = req.params.upcCode;
	var options;
	if(array.indexOf(num) > -1) {
	//GET request to personally hosted json file for cocktail peanuts, regardless of upc sent. 
		options = {
		  host: "students.washington.edu",
		  path: '/adtroupe/capstone/'+num+'.json',
		  method: 'GET',
		};
	} else {
	//details of api call with upc code
		options = {
		  host: "api.nutritionix.com",
		  path: '/v1_1/item?upc='+num+'&appId='+json.nutritionix.users.alex.id+'&appKey='+json.nutritionix.users.alex.key,
		  method: 'GET',
		};
	}

	callback = function(response) {
		var str = '';
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
		response.once('end', function () {
			compareRestrictions(account, str, function(results) {
				var retJson = JSON.parse(str);
				retJson["Restrictions"]=results;
				res.send(retJson);
			})
		});
	};
	https.request(options, callback).end();
});

//Creates or updates an account with accountId and auth token
//Returns all data within that account
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

//Creates or updates subuser data
//Returns all data within that account
app.post('/users', function(req, res) {
	var account = req.body.accountId;
	var sub = req.body.subUserId;
	var first = req.body.first;
	var last = req.body.last;
	var dr = req.body.dr;
	var img = req.body.image;
	var usersRef = firebase.database().ref("/accounts/" + account + "/users/" + sub);
	usersRef.update({
		first : first,
		last : last,
		dr : dr,
		image : img
	}).then(getAccountInfo(firebase.database().ref("/accounts/" + account), function(object) {
		res.send(object.val());
	}));
});

//Deletes all data pertaining to a subuser
//Returns all data within that acccount
app.post('/deleteUser', function(req, res) {
	var account = req.body.accountId;
	var user = req.body.subUserId;
	var usersRef = firebase.database().ref("/accounts/"+account+"/users/"+user);
	usersRef.remove().then(getAccountInfo(firebase.database().ref("/accounts/" + account), function(object) {
		res.send(object.val());
	}));
});

//Deletes all account data
//Returns string verifying account deletion
app.post('/deleteAccount', function(req, res) {
	var account = req.body.accountId;
	var accountRef = firebase.database().ref('/accounts/' + account);
	accountRef.remove().then(function() {
		res.send("Account Deleted");
	});
});

//Returns 10 most recent scans from history object in firebase
app.post('/history', function(req, res) {
	var account = req.body.accountId;
	var historyRef = firebase.database().ref('/accounts/' + account + '/history');
	historyRef.orderByKey().limitToFirst(10).once('value').then(function(object) {
		res.send(object);
	});
});

//Creates or updates an accounts grocery list within firebase
//Returns string verifying list creation or update
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

//Creates a user suggestion within firebase if a user thinks an ingredient is missing from a dietary restriction
//Returns a string verifying suggestion submission
app.post('/suggest', function(req, res) {
	var account = req.body.accountId;
	var dr = req.body.dr;
	var suggestion = req.body.suggestion;
	var ref = firebase.database().ref('/suggestions/' + account);
	var newRef = ref.push();
	newRef.set({
		dr : dr,
		suggestion : suggestion
	}).then(function() {
		res.send("200 OK");
	});
})

//for testing, call >node index.js to create server. then call localserver:3000/upc/[upcCode]
var server = app.listen(process.env.PORT || 8080, function () {
	var port = server.address().port;
	console.log('Example app listening on port ', port)
});
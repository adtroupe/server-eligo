var express = require('express')
var app = express()
var http = require('http')
var https = require('https')
var json = require('./secrets.json');

app.get('/upc/:upcCode', function(req, res) {
	//details of api call with upc code
	var options = {
	  host: "api.nutritionix.com",
	  path: '/v1_1/item?upc='+req.params.upcCode+'&appId='+json.nutritionix.users.alex.id+'&appKey='+json.nutritionix.users.alex.key,
	  method: 'GET',
	};

	callback = function(response) {
		var str = '';

		//receives data and appends to str
		response.on('data', function (chunk) {
		str += chunk;
		});

		//response has been sent back
		response.on('end', function () {
			res.send(str)
		});
	};
	
	https.request(options, callback).end();
})


//for testing, call >node index.js to create server. then call localserver:3000/upc/[upcCode]
app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
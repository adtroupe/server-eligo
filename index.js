//Alex's appId and appKey
var appId = '5233da9c';
var appKey = '2b335d0e9fed977f20895d80fa90e079';

var express = require('express')
var app = express()
var http = require('http')
var https = require('https')

app.get('/upc/:upcCode', function(req, res) {
	//details of api call with upc code
	var options = {
	  host: "api.nutritionix.com",
	  path: '/v1_1/item?upc='+req.params.upcCode+'&appId='+appId+'&appKey='+appKey,
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



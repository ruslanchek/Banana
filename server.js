var express = require('express'),
	serveStatic = require('serve-static'),
	app = express();

app.use(serveStatic(__dirname + '/public'));

app.listen(3000);
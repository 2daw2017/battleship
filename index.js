'use strict';

let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);

app.use(express.static(__dirname + '/www'));

app.get('/', function(req, res) {
	console.log('sending homepage');
	res.sendFile(__dirname + '/www/index.html');
});

app.get('*', function(req, res) {
	console.log('sending 404 message');
	res.status(404).send(':( 404 Error');
});

io.on('connection', (socket) => {
  console.log('user connected');
  
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

let port_number = process.env.PORT || 3000;
http.listen(port_number, () => {
    console.log('Escuchando el puerto ' + port_number);
});

'use strict';

let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);

app.get('/', function(req, res) {
	console.log('request recived');
	res.sendFile(__dirname + '/www/index.html');
});

io.on('connection', (socket) => {
  console.log('user connected');
  
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});


http.listen(3000, () => {
    console.log('Escuchando el puerto ' + 3000);
});

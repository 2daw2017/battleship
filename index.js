'use strict';

let express = require('express');
let app = express();

app.use(express.static(__dirname + '/www'));

let server = app.listen(3000, () => {
    console.log('Escuchando el puerto ' + 3000);
});

let io = require('socket.io')(http);

io.on('connection', (socket) => {
  console.log('user connected');
  
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

var express = require('express')
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static("static"));

io.on('connection', (socket) => {
    var room = "Default"

    socket.on('content' , (data)=>{
        io.to(room).emit('server_character',data)
    })

    socket.on('room' , (data)=>{
        room = data
        socket.join(room)
        var clients = io.sockets.adapter.rooms[room];   
        var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;

        socket.broadcast.to(room).emit('sync_up' , numClients+1)
    })


});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
var express = require('express');
const { type } = require('os');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const diff3Merge = require('node-diff3').diff3Merge; 


const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./db/docs.db', (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the docs database.');
  });

db.serialize(()=>{
    db.run("CREATE TABLE doc(socket text primary key,room text, content text)",(res,err)=>{

    })
    .run(`INSERT INTO doc VALUES(
        'ROOT','Default' , 'demo content'
    )` , (res,err)=>{
        if(err){
            console.log("Already exists")
        }
    })
    .each(`SELECT * FROM doc`, (err, row) => {
        if (err){
          throw err;
        }
        console.log(row.room);
        console.log(row.content);
    });            
})

app.use(express.static("static"));

function merger(s1,s2,s3){
    res = diff3Merge(s1,s2,s3)
    return res.result
}

io.on('connection', (socket) => {
    var room = "Default"

    socket.on('content' , (data)=>{
        var sql =  `SELECT * FROM doc WHERE room='`+room+`'`;
        var upd = `UPDATE doc SET content='`+data+`' WHERE room='`+room+`'`;
        var old = ""
        db.serialize(()=>{
            db.each(sql,(err,row)=>{
                if(err){
                    console.log("error")
                }
                if(old == ""){
                    old = row.content
                }else if(old != row.content){
                data = merger(row.content,old,data)
                }
                upd = `UPDATE doc SET content='`+data+`' WHERE room='`+room+`'`;

            }).run(upd , (res,err)=>{
                io.to(room).emit('server_character',data)
            })
        })
    })

    socket.on('room' , (data)=>{
        room = data
        socket.join(room)
        var clients = io.sockets.adapter.rooms[room];   
        var numClients = (typeof clients !== 'undefined') ? Object.keys(clients).length : 0;
        console.log(socket.id)
        var sql = `INSERT INTO doc VALUES('`+socket.id+`'`+room+`' , '')`
        db.run(sql, (res, err) => {
            if (err){
                console.log("already exists")
            }
        });
        socket.broadcast.to(room).emit('sync_up' , numClients+1)
        
        
    })


});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
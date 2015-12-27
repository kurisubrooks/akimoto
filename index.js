const express = require('express'),
      app = express(),
      http = require('http').Server(app),
      io = require('socket.io')(http);

const core = require('./modules/core'),
      logger = require('crimson'),
      moment = require('moment'),
      _ = require('lodash')
      fs = require('fs');
      
var users = {};
var db = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
var db_values = Object.keys(db.users);

/*
// Cause i've got a
// Blank
// Space
// Baby,

// And I'll
// Write Your
// Name (y)
*/

// Express Config
app.use('/assets', express.static(__dirname + '/assets'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

// Get Timestamp
function timestamp() {
    return moment().format('X');
}

function socket_error(api, error) {
    io.emit(api, {
        "ok": false,
        "reason": error,
        "ts": timestamp()
    });
    
    return;
}

/*
// Socket
*/

io.on('connection', function (socket) {
    //console.log(io.sockets.connected);
    console.log(socket.id);

    socket.on('disconnect', function () {
        //console.log(socket);
        logger.error('Client disconnected.');
    });

    socket.on('auth.user', function (data) {
        if (db_values.indexOf((data.username).toLowerCase()) >= 0) {            
            socket.username = data.username;
            users[socket.id] = data.username;

            io.emit('auth.user', {
                "ok": true,
                "ts": timestamp(),
                "username": socket.username
            });

            logger.success(socket.username + ' authenticated successfully.');
        }

        else if (db_values.indexOf(data.username) == -1) {
            socket_error('auth.user', 'User does not exist.');
        }
        
        /*
        else if ((data.username).length >= 16) {
            socket_error('auth.user', 'Username must be less than 16 characters');
        }
        
        else if (_.where(io.sockets.connected, {username: data.username}, 'id').length > 0) {
            socket_error('auth.user', 'User is already connected');
        }
        
        else {
            socket.username = data.username;
            users[socket.id] = data.username;

            io.emit('auth.user', {
                "ok": true,
                "ts": timestamp(),
                "username": socket.username
            });

            logger.success(socket.username + ' authenticated successfully.');
        }
        */
    });

    socket.on('chat.post', function (data) {
        io.emit('chat.post', {
            "ok": true,
            "ts": timestamp(),
            "username": socket.username,
            "message": core.check_msg(data.message)
        });

        logger.info(socket.username + ': ' + data.message);
    });
});

// Init Server
http.listen(3000, function () {
    logger.success('Listening on 127.0.0.1:3000');
});

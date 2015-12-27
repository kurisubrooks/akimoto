const express = require('express'),
      app = express(),
      http = require('http').Server(app),
      io = require('socket.io')(http);

const core = require('./modules/core'),
      logger = require('crimson'),
      moment = require('moment'),
      _ = require('lodash');
      
var users = {};

/*
// Blank
// Space

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

/*
// Socket
*/

function socket_error(api, error) {
    io.emit(api, {
        "ok": false,
        "reason": error,
        "ts": timestamp();
    });
}

io.on('connection', function (socket) {
    //console.log(io.sockets.connected);
    console.log(socket.id);

    socket.on('disconnect', function () {
        //console.log(socket);
        logger.error('Client disconnected.');
    });

    socket.on('auth.user_auth', function (data) {
        if ((data.username).length >= 16) socket_error('auth.user_auth', 'Username must be less than 16 characters');
        else if (_.where(io.sockets.connected, {username: data.username}, "id").length > 0) socket_error('auth.user_auth', 'User is already connected');
        else {
            // Authentication Successful
            socket.username = data.username;
            users[socket.id] = data.username;

            io.emit('auth.user_auth', {
                "ok": true,
                "ts": timestamp(),
                "username": socket.username
            });

            logger.success(socket.username + ' authenticated successfully.');
        }
    });

    socket.on('chat.post_message', function (data) {
        io.emit('chat.post_message', {
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

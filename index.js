var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    crimson = require('crimson'),
    moment = require('moment');

var port = 8080;
app.use('/assets', express.static(__dirname + '/assets'));
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});

http.listen(port, function () {
    console.log('Listening on 127.0.0.1:' + port);
});

/*
// Blank Space
// ..aaaaand sued
*/

var online_users = 0;

function time() {
    return moment().format('X');
}

io.on('connection', function (socket) {
    var user_authed = false;

    socket.on('user.auth', function (data) {
        if (user_authed) return;

        socket.username = data.username;
        user_authed = true;
        ++online_users;

        crimson.success(socket.username + ' joined.');

        io.emit('user.count', {
            "ok": true,
            "ts": time(),
            "online": online_users
        });

        socket.emit('user.auth', {
            "ok": true,
            "ts": time(),
            "username": socket.username
        })

        io.emit('user.join', {
            "ok": true,
            "ts": time(),
            "username": socket.username,
            "online": online_users
        });
    });

    socket.on('chat.post', function (data) {
        crimson.info(socket.username + ': ' + data.message);

        io.emit('chat.post', {
            "ok": true,
            "ts": time(),
            "username": socket.username,
            "message": data.message
        });
    });

    socket.on('disconnect', function () {
        if (user_authed) {
            crimson.error(socket.username + ' left.');
            --online_users;

            io.emit('user.quit', {
                "ok": true,
                "ts": time(),
                "username": socket.username,
                "online": online_users
            });

            io.emit('chat.post', {
                "ok": true,
                "ts": time(),
                "username": socket.username,
                "message": socket.username + ' left.'
            });
        }
    });

    /*
	socket.on('chat.typing', function() {
		socket.emit('user.typing', {
			"ok": true,
			"ts": time(),
			"username": socket.username
		});
	});

	socket.on('chat.typing.stop', function() {
		socket.emit('user.typing.stop', {
			"ok": true,
			"ts": time(),
			"username": socket.username
		});
	});
    */
});
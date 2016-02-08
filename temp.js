/*
io.on('connection', (socket) => {
    socket.on('user.auth', (data) => {
        // Global Emit
        io.emit('user.count', {
            "ok": true,
            "ts": time(),
            "online": online_count
        });

        // Local Emit
        socket.emit('user.auth', {
            "ok": true,
            "ts": time(),
            "username": socket.username
        });
    });
});
*/



var online_count = 0;
var online_users = [];

io.on('connection', (socket) => {
    var user_authed = false;

    socket.on('user.auth', (data) => {
        if (user_authed) return;
        console.log(data);

        auth.login(data, function(response) {
            if (response.ok) {
                console.log('response == ok');
            }
            
            else {
                console.log('response == not ok');
            }
        });

        socket.username = data.username;
        user_authed = true;
        ++online_count;

        crimson.success(socket.username + ' joined.');

        io.emit('user.count', {
            "ok": true,
            "ts": time(),
            "online": online_count
        });

        socket.emit('user.auth', {
            "ok": true,
            "ts": time(),
            "username": socket.username
        });

        io.emit('user.join', {
            "ok": true,
            "ts": time(),
            "username": socket.username,
            "online": online_count
        });
    });

    socket.on('chat.post', (data) => {
        crimson.info(socket.username + ': ' + data.message);

        io.emit('chat.post', {
            "ok": true,
            "ts": time(),
            "username": socket.username,
            "message": data.message
        });

        if (data.message.startsWith('/')) {
            crimson.debug('yay, a command :D');
            var text = data.message;
                text.slice(0, 1);
                text.split(' ');
                console.log(text);

            if (text.length > 1 && commands.indexOf(text[0]) >= 0) {
                crimson.debug('k great, the command exists');
                console.log(text);
            }

            else {
                socket.emit('chat.post', {
                    "ok": false,
                    "ts": time(),
                    "username": socket.username,
                    "reason": "Invalid Command",
                    "message": text
                });
            }
        }
    });

    socket.on('disconnect', () => {
        if (user_authed) {
            crimson.error(socket.username + ' left.');
            --online_count;

            io.emit('user.quit', {
                "ok": true,
                "ts": time(),
                "username": socket.username,
                "online": online_count
            });

            io.emit('chat.post', {
                "ok": true,
                "ts": time(),
                "username": socket.username,
                "message": socket.username + ' left.'
            });
        }
    });
    
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
});

/*
// Client Status 
socket.on('connect', function () {$status.css('color', '#4ecc71');});
socket.on('reconnect', function () {$status.css('color', '#4ecc71');});
socket.on('timeout', function () {$status.css('color', '#e65757');});
socket.on('connect_timeout', function () {$status.css('color', '#e65757');});
socket.on('error', function () {$status.css('color', '#e65757');});
socket.on('disconnect', function () {$status.css('color', '#e65757');});
socket.on('reconnect_error', function () {$status.css('color', '#e65757');});
socket.on('reconnect_failed', function () {$status.css('color', '#e65757');});
*/
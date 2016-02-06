const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyParser = require('body-parser');
const session = require('express-session');

const crimson = require('crimson');
const moment = require('moment');
const crypto = require('crypto');
const uuid = require('node-uuid');

const keychain = require('./keychain');
const auth = require('./auth');
const port = 8080;

app.use('/assets', express.static(__dirname + '/public/assets'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: keychain.session}));

function time() {
    return moment().format('X');
}

app.get('/',         (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/login',    (req, res) => res.sendFile(__dirname + '/public/login.html'));
app.get('/register', (req, res) => res.sendFile(__dirname + '/public/register.html'));

app.post('/api', (req, res) => {
    var post = req.body;

    if (post.type == 'login') {
        
    }
    
    if (post.type == 'register') {
        auth.new_user(post);
    }

    console.log(type);
    console.log(post);
});

http.listen(port, () => {
    crimson.success('Listening on 127.0.0.1:' + port);
});

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

        /*
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
        */
    });

    socket.on('chat.post', (data) => {
        crimson.info(socket.username + ': ' + data.message);

        io.emit('chat.post', {
            "ok": true,
            "ts": time(),
            "username": socket.username,
            "message": data.message
        });

        /*if (data.message.startsWith('/')) {
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
        }*/
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

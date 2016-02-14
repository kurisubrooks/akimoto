const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const postman = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const crimson = require('crimson');
const moment = require('moment');
const crypto = require('crypto');
const uuid = require('node-uuid');
const _ = require('lodash');

const database = require('./database.json');
const keychain = require('./keychain');
const auth = require('./auth');
const ip = require('ip');
const port = 3000;

app.use('/assets', express.static(__dirname + '/public/assets'));
app.use(cookieParser(keychain.session));
app.use(postman.json());
app.use(postman.urlencoded({extended: true}));
app.use(session({secret: keychain.session}));

var users = {};
var bots = {};

function cache() {
    _.forEach(database.users, (v, k) => {
        if (typeof v !== "object") return;
        users[v.token] = {
            uuid: v.uuid,
            username: v.username,
            token: v.token,
            icon: v.icon,
            online: false
        };
    });

    _.forEach(database.bots, (v, k) => {
        if (typeof v !== "object") return;
        bots[v.token] = {
            uuid: v.uuid,
            username: v.username,
            token: v.token,
            icon: v.icon,
            online: false
        };
    });
}
cache();

function presence() {
    var toReturn = {};
    _.map(users, (o) => toReturn[o.username] = o.online);
    return toReturn;
}

function time() {
    return moment().format('X');
}

function safe(input) {
    input.replace('<', '&lt;');
    input.replace('>', '&gt;');
    return input;
}

app.get('/', (req, res) => {
    var cookie = req.session;
    if (cookie.token) {
        var token = _.findKey(database.users, {token: cookie.token});
        if (token) {
            res.redirect('/chat');
        } else {
            res.redirect('/login');
        }
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    if (req.session.token) res.redirect('/chat');
    else res.sendFile(__dirname + '/public/login.html');
});

app.get('/chat', (req, res) => {
    if (!req.session.token) res.redirect('/login');
    else res.sendFile(__dirname + '/public/index.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.get('/logout', (req, res) => {
    req.session.token = '';
    res.redirect('/login');
});

app.all('/api/auth.login', (req, res) => {
    var session = req.session;
    var data = (req.query.username) ? req.query : req.body;
    var username = data.username.toLowerCase();
    var password = data.password;
    var hash = auth.hash(username, password);
    crimson.debug('auth.login: {"ok":' + hash.ok + ',"username":' + data.username + '}');

    if (hash.ok) {
        session.user = hash.username;
        session.token = hash.token;
        res.cookie('user', hash.username);
        res.cookie('token', hash.token);
        res.redirect('/chat');
    } else {
        res.redirect('/login?error=' + encodeURIComponent(hash.reason));
    }
});

app.post('/api/auth.register', (req, res) => {
    var post = req.body;
    cache();
});

app.all('/api/chat.post', (req, res) => {
    var session = req.session;
    var data = (req.query.username) ? req.query : req.body;
    crimson.debug('chat.post: ' + JSON.stringify(data));

    if (data.token && data.text) {
        if (bots[data.token]) {
            var object = {
                "ok": true,
                "ts": time(),
                "username": bots[data.token].username,
                "icon": bots[data.token].icon,
                "message": safe(data.text)
            };

            res.send(object);
            io.emit('chat.post', object);
        } else {
            res.send({"ok": false, "ts": time(), "reason": "Bot Doesn\'t Exist"});
        }
    } else if (!data.token) {
        res.send({"ok": false, "ts": time(), "reason": "Token Required"});
    } else if (!data.text) {
        res.send({"ok": false, "ts": time(), "reason": "Text Required"});
    }

    // get token
    /*
    {
        "token": "",
        "text": "",
        "attachments": {
            "title": "",
            "text": "",
            "image": ""
        }
    }
    */
});

io.on('connection', (socket) => {
    socket.on('auth.user', (data) => {
        if (data.ok) {
            socket.token = data.token;
            socket.username = users[socket.token].username;
            socket.id = users[socket.token].uuid;
            socket.icon = users[socket.token].icon;
            users[socket.token].online = true;
            crimson.success(socket.username + ' is now active!');
            socket.emit('user.auth', {
                "ok": true,
                "ts": time(),
                "username": socket.username,
                "token": socket.token
            });
            io.emit('presence.change', {
                "ok": true,
                "ts": time(),
                "presence": presence()
            });
        } else {
            crimson.error(data);
            socket.emit('error', {
                "ok": false,
                "ts": time(),
                "disconnect": true,
                "reason": data.reason
            });
        }
    });

    socket.on('chat.post', (data) => {
        crimson.info(socket.username + ': ' + data.message);
        io.emit('chat.post', {
            "ok": true,
            "ts": time(),
            "username": socket.username,
            "icon": users[socket.token].icon,
            "message": safe(data.message)
        });
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            crimson.error(socket.username + ' is now away.');
            users[socket.token].online = false;
            io.emit('presence.change', {
                "ok": true,
                "ts": time(),
                "presence": presence()
            });
        }
    });
});

http.listen(port, () => {
    crimson.success('Listening on ' + ip.address() + ':' + port);
});

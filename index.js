const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const postman = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const crimson = require('crimson');
const moment = require('moment');
const crypto = require('crypto');
const uuid = require('node-uuid');
const path = require('path');
const fs = require('fs');
const ip = require('ip');
const _ = require('lodash');

const database = require('./database.json');
const keychain = require('./keychain');
const auth = require('./auth');
const port = 3000;

app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.use(morgan('short'));
app.use(cookieParser(keychain.session));
app.use(postman.json());
app.use(postman.urlencoded({extended: true}));
app.use(session({secret: keychain.session}));

var users = {};
var count = 0;

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
}

function presence() {
    var toReturn = {};
    _.map(users, o => toReturn[o.username] = o.online);

    return toReturn;
}

function time() {
    return moment().format('X');
}

function safe(input) {
    var one = input.replace(/</g, '&lt;');
    var two = one.replace(/>/g, '&gt;');

    return two;
}

function save(type, ts, user, msg) {
    var file = path.join(__dirname, 'data', 'chat.json');
    var json = require(file);
    var object = [{ "type": type, "ts": ts, "user": user, "message": msg }];

    json.chat.push(object);

    fs.writeFile(file, JSON.stringify(json, null, 4), (err) => {
        if (err) crimson.fatal(err);
    });
}

/* // // //// // // */
/* // HTTP Pages // */
/* // // //// // // */

app.get('/', (req, res) => {
    var cookie = req.session;

    if (cookie.token) {
        (_.findKey(database.users, { token: cookie.token })) ? res.redirect('/chat') : res.redirect('/login');
    } else {
        res.redirect('/login');
    }
});

app.get('/login', (req, res) => {
    (req.session.token) ? res.redirect('/chat'): res.sendFile(__dirname + '/public/login.html');
});

app.get('/chat', (req, res) => {
    (!req.session.token) ? res.redirect('/login') : res.sendFile(__dirname + '/public/index.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/register.html');
});

app.get('/logout', (req, res) => {
    req.session.token = '';
    res.redirect('/login');
});

/* // // /// // // */
/* //    API    // */
/* // // /// // // */

app.all('/api/auth.login', (req, res) => {
    var session = req.session;
    var data = (req.query.username) ? req.query : req.body;
    var username = data.username.toLowerCase();
    var password = data.password;
    var hash = auth.hash(username, password);

    crimson.debug('api/auth.login: ' + JSON.stringify({
        "ok": hash.ok,
        "ip": req.ip||req.connection.remoteAddress,
        "username": data.username
    }));

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

/*app.all('/api/auth.register', (req, res) => {
    var post = req.body;
    cache();
});*/

app.all('/api/chat.post', (req, res) => {
    var session = req.session;
    var data = (req.query.username) ? req.query : req.body;

    if (data.token && data.text || data.html) {
        if (users[data.token]) {
            crimson.debug(users[data.token].username + ': ' + safe(data.text));

            save('message', time(), users[data.token].uuid, safe(data.text));

            var object = {
                "ok": true,
                "ts": time(),
                "username": users[data.token].username,
                "icon": users[data.token].icon,
                "message": safe(data.text)
            };

            res.status(200);
            res.json(object);
            io.emit('chat.post', object);
        } else {
            res.status(400);
            res.json({
                "ok": false, 
                "ts": time(), 
                "code": "ERR_USER_NOEXIST",
                "reason": "User doesn\'t exist"
            });

            crimson.debug('api/chat.post: ' + JSON.stringify({
                "ok": false,
                "ts": time(),
                "code": "ERR_USER_NOEXIST"
            }));
        }
    } else if (!data.token) {
        res.status(401);
        res.json({
            "ok": false, 
            "ts": time(), 
            "code": "ERR_MISSING_TOKEN", 
            "reason": "Missing required field: Token"
        });

        crimson.debug('api/chat.post: ' + JSON.stringify({
            "ok": false,
            "ts": time(),
            "code": "ERR_MISSING_TOKEN"
        }));
    } else if (!data.text || !data.html) {
        res.status(400);
        res.json({
            "ok": false, 
            "ts": time(), 
            "code": "ERR_MISSING_TEXT", 
            "reason": "Missing required field: Text (or HTML)"
        });

        crimson.debug('api/chat.post: ' + JSON.stringify({
            "ok": false,
            "ts": time(),
            "code": "ERR_MISSING_TEXT"
        }));
    }

    // { "token": "", "text": "", "html": { "title": "", "text": "", "image": "" } }
});

app.all('/api/chat.delete', (req, res) => {
    var session = req.session;
    var data = (req.query.username) ? req.query : req.body;
    res.status(405)
    res.json({ "ok": false })
});

app.use((req, res) => {
    res.send('<pre>"ok": false, "code": "ERR_NOT_FOUND"</pre>', 404);
});

/* // // //// // // */
/* // Web Socket // */
/* // // //// // // */

io.on('connection', (socket) => {
    socket.on('auth.user', (data) => {
        if (data.ok) {
            socket.token = data.token;
            socket.username = users[socket.token].username;
            socket.id = users[socket.token].uuid;
            socket.icon = users[socket.token].icon;

            users[socket.token].online = true;
            crimson.success(socket.username + ' is now active!');

            ++count;

            socket.emit('user.auth', {
                "ok": true,
                "ts": time(),
                "username": socket.username,
                "token": socket.token
            });

            io.emit('presence.change', {
                "ok": true,
                "ts": time(),
                "presence": presence(),
                "count": count
            });
        } else {
            crimson.error(data);

            socket.emit('error', {
                "ok": false,
                "ts": time(),
                "code": "ERR_BADAUTH",
                "disconnect": true,
                "reason": data.reason
            });
        }
    });

    socket.on('chat.post', (data) => {
        var message = safe(data.message);

        crimson.info(socket.username + ': ' + message);
        save('message', time(), users[socket.token].uuid, message);

        io.emit('chat.post', {
            "ok": true,
            "ts": time(),
            "username": socket.username,
            "icon": users[socket.token].icon,
            "message": message
        });
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            crimson.error(socket.username + ' is now away.');

            users[socket.token].online = false;
            --count;

            io.emit('presence.change', {
                "ok": true,
                "ts": time(),
                "presence": presence(),
                "count": count
            });
        }
    });
});

/* // // /// // // */
/* //   Start   // */
/* // // /// // // */

cache();

http.listen(port, () => {
    crimson.success('Listening on ' + ip.address() + ':' + port);
});

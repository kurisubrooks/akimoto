const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const crimson = require('crimson');
const moment = require('moment');
const crypto = require('crypto');
const path = require('path');
const jade = require('jade');
const fs = require('fs');
const _ = require('lodash');

const postman = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const port = 3000;

try {
    const database = require('./database.json');
    const keychain = require('./keychain.js');
    const chat = require('./data/chat.json');
    const auth = require('./auth.js');
} catch(e) {
    crimson.error('a module is missing, run `node setup` to generate the files');
    throw e;
}

app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));
app.use('/data', express.static(path.join(__dirname, 'data')));
app.set('view engine', 'jade');
app.set('view options', { pretty: true });
app.set('views', path.join(__dirname, 'public', 'pages'));
app.use(morgan('short'));
app.use(cookieParser(keychain.session));
app.use(postman.json());
app.use(postman.urlencoded({ extended: true }));
app.use(session({
    secret: keychain.session,
    resave: true,
    saveUninitialized: true
}));

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
            admin: v.admin,
            online: false
        };
    });
}

function presence() {
    var toReturn = {};
    _.map(users, o => toReturn[o.username] = {
        uuid: o.uuid,
        admin: o.admin,
        username: o.username,
        presence: o.online,
        icon: o.icon
    });

    return toReturn;
}

function time() {
    return moment().format('X');
}

function safe(input) {
    return input.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function save(type, ts, user, msg) {
    var file = path.join(__dirname, 'data', 'chat.json');
    var json = require(file);
    var object = { "type": type, "ts": ts, "user": user, "message": msg };

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
    res.redirect(cookie.token && _.findKey(database.users, { token: cookie.token }) ? '/chat' : '/login');
});

app.get('/login', (req, res) => {
    if (req.session.token) res.redirect('/chat');
    else res.render('login');
});

app.get('/chat', (req, res) => {
    if (!req.session.token) res.redirect('/login');
    else res.render('chat');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/logout', (req, res) => {
    req.session.user = '';
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

    crimson.debug('auth.login - ok: ' + hash.ok + ', user: ' +  data.username + ', ip: ' + req.ip);

    if (hash.ok) {
        session.user = hash.username;
        session.token = hash.token;
        res.cookie('user', hash.username);
        res.cookie('token', hash.token);
        res.redirect('/chat');
    } else {
        res.redirect('/login?error=' + encodeURIComponent(hash.code));
    }
});

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
                "message": safe(data.text)
            };

            res.json(object).status(200);
            io.emit('chat.post', object);
        } else {
            res.json({
                "ok": false,
                "code": "ERR_USER_NOEXIST"
            }).status(400);

            crimson.debug('chat.post - ok: false, code: ERR_USER_NOEXIST');
        }
    } else if (!data.token) {
        res.json({
            "ok": false,
            "code": "ERR_MISSING_TOKEN"
        }).status(401);

        crimson.debug('chat.post - ok: false, code: ERR_MISSING_TOKEN');
    } else if (!data.text || !data.html) {
        res.json({
            "ok": false,
            "code": "ERR_MISSING_TEXT"
        }).status(400);

        crimson.debug('chat.post - ok: false, code: ERR_MISSING_TEXT');
    }

    // { "token": "", "text": "", "html": { "title": "", "text": "", "image": "" } }
});

app.all('/api/chat.delete', (req, res) => {
    var session = req.session;
    var data = (req.query.username) ? req.query : req.body;
    res.json({ "ok": false }).status(405);
});

app.all('/api/auth.register', (req, res) => {
    var session = req.session;
    var data = (req.query.username) ? req.query : req.body;
    res.json({ "ok": false }).status(405);
});

app.use((req, res) => {
    res.send('<pre>"ok": false, "code": "ERR_NOT_FOUND"</pre>').status(404);
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

            socket.emit('auth.user', {
                "ok": true,
                "username": socket.username,
                "token": socket.token
            });

            io.emit('presence.change', {
                "ok": true,
                "presence": presence(),
                "count": count
            });
        } else {
            crimson.error(data);

            socket.emit('error', {
                "ok": false,
                "code": "ERR_BAD_AUTH",
                "disconnect": true
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
            "message": message
        });
    });

    socket.on('chat.edit', (data) => {
        var matchTS = _.filter(chat.chat, { "ts": data.ts });
        console.log(matchTS);

        if (matchTS.length < 1) {
            socket.emit('chat.edit', {
                "ok": false,
                "code": "ERR_NOT_FOUND"
            });
        } else {
            matchUser = _.filter(matchTS, { 'user': users[socket.token].uuid });
            if (matchUser.length < 1 && !users[socket.token].admin) {
                socket.emit('chat.edit', {
                    "ok": false,
                    "code": "ERR_NO_PERMISSION"
                });
            } else {
                io.emit('chat.edit', {
                    "ok": true,
                    "ts": data.ts,
                    "message": data.message
                });

                // somehow change logs. maybe add new log saying message changed?
            }
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            crimson.error(socket.username + ' is now away.');

            users[socket.token].online = false;
            --count;

            io.emit('presence.change', {
                "ok": true,
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
    crimson.success('Listening on http://localhost:' + port);
});

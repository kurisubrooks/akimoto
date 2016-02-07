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
const _ = require('lodash');

const database = require('./database.json');
const keychain = require('./keychain');
const auth = require('./auth');
const ip = require('ip');
const port = 4000;

app.use('/assets', express.static(__dirname + '/public/assets'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: keychain.session, cookie: { maxAge: 2592000000 }}));

var users = [];
var user_info = {};

function updateUsers() {
    users = Object.keys(database.users);
    
    for (i = 0; i < users.length; i++) {
        var user = users[i];

        user_info[user] = {
            "uuid": database.users[user].uuid,
            "token": database.users[user].token,
            "username": database.users[user].username,
            "icon": database.users[user].icon
        };
    }
}

function time() {
    return moment().format('X');
}

updateUsers();

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

app.get('/chat',     (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/register', (req, res) => res.sendFile(__dirname + '/public/register.html'));
app.get('/login',    (req, res) => {
    if (req.session.token) res.redirect('/chat');
    else res.sendFile(__dirname + '/public/login.html');
});
app.get('/logout',   (req, res) => {
    req.session.token = '';
    res.redirect('/login');
});

app.all('/api/auth.login', (req, res) => {
    var api, cookie = req.session;
    if (req.query.username) api = req.query;
    else api = req.body;

    var username = api.username;
    var password = api.password;
    var hash = auth.hash(username, password);

    if (hash.ok) {
        cookie.token = hash.token;
        cookie.user = hash.username;
        res.redirect('/chat');
    } else {
        res.redirect('/login?error=' + encodeURIComponent(hash.reason));
    }
});

app.post('/api/auth.register', (req, res) => {
    var post = req.body;
    updateUsers();
});

io.on('connection', (socket) => {
    //var user = {};

    socket.on('user.join', (data) => {
        // data.username, data.token
        if (database.users[data.username]) {
            
        }
    });

    socket.on('chat.post', (data) => {
        //if (!user.authenticated) socket.emit('disconnect');
        crimson.info(data.username + ': ' + data.message);

        /*io.emit('chat.post', {
            "ok": true,
            "ts": time(),
            "token": user_info[data.username].token,
            "username": 'who fucking knows',
            "message": data.message
        });*/
    });
});

http.listen(port, () => {
    crimson.success('Listening on ' + ip.address() + ':' + port);
});

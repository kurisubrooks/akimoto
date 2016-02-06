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
const port = 3000;

app.use('/assets', express.static(__dirname + '/public/assets'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: keychain.session, cookie: { maxAge: 2592000000 }}));

function time() {
    return moment().format('X');
}

app.get('/', (req, res) => {
    var cookie = req.session;
    if (cookie.token) {
        var token = _.findKey(database.users, {token: cookie.token});
        if (token) {
            res.redirect('/chat');
        } else res.redirect('/login');
    } else res.redirect('/login');
});

app.get('/chat',     (req, res) => res.sendFile(__dirname + '/public/index.html'));
app.get('/login',    (req, res) => res.sendFile(__dirname + '/public/login.html'));
app.get('/register', (req, res) => res.sendFile(__dirname + '/public/register.html'));
app.get('/logout',   (req, res) => {
    req.session.token = '';
    res.redirect('/login');
});

app.post('/api/auth.login', (req, res) => {
    var post = req.body;
    var cookie = req.session;

    var username = post.username;
    var password = post.password;
    var hash = auth.hash(username, password);

    if (hash.ok) {
        cookie.token = hash.token;
        res.redirect('/chat');
    } else {
        res.redirect('/login?error=' + encodeURIComponent(hash.reason));
    }
});

app.post('/api/auth.register', (req, res) => {
    var post = req.body;
});

http.listen(port, () => {
    crimson.success('Listening on 127.0.0.1:' + port);
});

#! /usr/bin/env node

const crypto = require('crypto');
const colors = require('colors');
const uuid = require('node-uuid');
const prompt = require('prompt');
const path = require('path');
const fs = require('fs');

prompt.start();

var format = {
    properties: {
        username: {
            pattern: /^[a-zA-Z]+$/,
            message: 'Username must consist of 4 or more letters',
            required: true
        },
        email: {
            required: true
        },
        password: {
            hidden: true,
            required: true
        }
    }
};

prompt.get(format, function (error, result) {
    if (error) throw '[!] ERR: '.red.bold + error;

    var dbpath = path.join(__dirname, 'database.json');
    var database = require(dbpath);
    var id = 'U' + crypto.randomBytes(4).toString('hex').toUpperCase();
    var user = result.username;
    var email = result.email;
    var pass = result.password;
    var icon = crypto.createHash('md5').update(email).digest('hex');
    var token = 'u' + crypto.randomBytes(12).toString('hex');
    var salt = crypto.randomBytes(24).toString('base64');
    var hash = crypto.createHash('sha256').update(pass + salt).digest('hex');

    if (database.users[user]) throw ('[!] ERR: ').red.bold + ('User "' + user + '" already exists').red;

    var object = {
        "admin": false,
        //"type": type,
        "uuid": id,
        "token": token,
        "username": user,
        "email": email,
        "icon": icon,
        "salt": salt,
        "password": hash
    };

    database.users[user] = object;

    fs.writeFile(dbpath, JSON.stringify(database, null, 4), (error) => {
        if (error) throw ('[!] ERR: '.red.bold + 'Failed to write to Database File: ' + error).red;
    });

    console.log(('UUID: ').green + id);
    console.log(('Token: ').green + token);
    console.log(('Username: ').green + user);
    console.log(('Email: ').green + email);
    console.log(('Icon: ').green + icon);
    console.log(('Salt: ').green + salt);
    console.log(('Hash: ').green + hash);
});

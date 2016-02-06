#! /usr/bin/env node

const crypto = require('crypto');
const colors = require('colors');
const uuid = require('node-uuid');
const path = require('path');
const fs = require('fs');

var args = process.argv.slice(2);

if (args.length == 3) {
    var dbpath = path.join(__dirname, 'database.json');
    var database = require(dbpath);
    var id = uuid.v4();
    var user = args[0];
    var email = args[1];
    var pass = args[2];
    var icon = crypto.createHash('md5').update(email).digest('hex');
    var token = 'au-' + crypto.randomBytes(12).toString('hex');
    var salt = crypto.randomBytes(24).toString('base64');
    var hash = crypto.createHash('sha256').update(pass + salt).digest('hex');

    if (database.users[user]) throw ('[!] ERR: ').red.bold + ('User "' + user + '" already exists').red;

    var object = {
        "uuid": id,
        "token": token,
        "username": user,
        "email": email,
        "icon": icon,
        "salt": salt,
        "password": hash
    };
    
    database.users[user] = object;

    fs.writeFile(dbpath, JSON.stringify(database), (error) => {
        if (error) console.log(('Failed to write to Database File: ' + error).red);
    });

    console.log(('UUID: ').green + id);
    console.log(('Token: ').green + token);
    console.log(('Username: ').green + user);
    console.log(('Email: ').green + email);
    console.log(('Icon: ').green + icon);
    console.log(('Salt: ').green + salt);
    console.log(('Hash: ').green + hash);
}

else console.log('Usage: [username] [email] [password]');

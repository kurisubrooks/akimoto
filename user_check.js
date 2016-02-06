#! /usr/bin/env node

const crypto = require('crypto');
const crimson = require('crimson');
const colors = require('colors');
const uuid = require('node-uuid');
const path = require('path');
const fs = require('fs');

var args = process.argv.slice(2);

if (args.length == 2) {
    var dbpath = path.join(__dirname, 'database.json');
    var database = require(dbpath);
    var user = args[0];
    var pass = args[1];

    if (!database.users[user]) crimson.fatal('User doesn\'t exist');

    var salt = database.users[user].salt;
    var hash = crypto.createHash('sha256').update(pass + salt).digest('hex');

    console.log('Salt: '.green + salt);
    console.log('Hash: '.green + hash);

    if (database.users[user].password == hash) {
        crimson.success('True');
        return true;
    } else {
        crimson.error('False');
        return false;
    }
}

else console.log('Usage: [username] [password]');

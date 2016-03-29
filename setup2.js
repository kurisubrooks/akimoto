#! /usr/bin/env node

const crypto = require('crypto');
const crimson = require('crimson');
const promise = require('q');
const prompt = require('prompt');
const path = require('path');
const fs = require('fs');

var format = {
    properties: {
        username: {
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

function getKey() {
    return crypto.randomBytes(48).toString('hex');
}

prompt.start()

prompt.get(format, function(error, result) {
    if (error) throw error;

    promise.fcall(function() {
        fs.access('./database.json', fs.F_OK, (error) => {
            if (error) {
                crimson.warn('database.json is missing, generating');
                fs.writeFileSync('./database.json', '{"users":{}}', (error) => {
                    if (error) crimson.fatal('Error creating database.json: ' + error);
                });
            } else crimson.success('database.json exists √');

            var database = require('./database.json');
        });
    }).then(function() {
        fs.access('./keychain.js', fs.F_OK, (error) => {
            if (error) {
                crimson.warn('keychain.js is missing, generating');
                fs.writeFileSync('./keychain.js', 'exports.session = "' + getKey() + '";', (error) => {
                    if (error) crimson.fatal('Error creating keychain.js: ' + error);
                });
            } else crimson.success('keychain.js exists √');
        });
    }).then(function() {
        fs.access('./data/chat.json', fs.F_OK, (error) => {
            if (error) {
                crimson.warn('chat.json is missing, generating');
                if (!fs.existsSync('data')) {
                    fs.mkdirSync('data');
                    fs.writeFileSync('./data/chat.json', '{"chat":[]}', (error) => {
                        if (error) crimson.fatal('Error creating chat.json: ' + error);
                    });
                }
            } else crimson.success('chat.json exists √');
        });
    }).then(function() {
        var id = 'U0' + crypto.randomBytes(4).toString('hex').toUpperCase();
        var user = result.username;
        var email = result.email;
        var pass = result.password;
        var icon = crypto.createHash('md5').update(email).digest('hex');
        var token = 'xoxo-' + crypto.createHash('md5').update(getKey()).digest('hex');
        var salt = crypto.randomBytes(24).toString('base64');
        var hash = crypto.createHash('sha256').update(pass + salt).digest('hex');

        if (database.users[user]) crimson.fatal('User "' + user + '" already exists');

        var object = {
            "admin": false,
            "uuid": id,
            "token": token,
            "username": user,
            "email": email,
            "icon": icon,
            "salt": salt,
            "password": hash
        };

        database.users[user] = object;

        fs.writeFile('./database.json', JSON.stringify(database, null, 4), (error) => {
            if (error) crimson.fatal('Failed to write to database: ' + error);
            else crimson.success('Database saved');
        });

        crimson.info(object);
    })
    .catch(function(error) {
        throw error;
    })
    .done();
});
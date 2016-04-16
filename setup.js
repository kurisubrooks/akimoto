#! /usr/bin/env node

const readline = require('readline-sync');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

function getKey() {
    return crypto.randomBytes(48).toString('hex');
}

var database = require('./database.json');
var id = 'U0' + crypto.randomBytes(4).toString('hex').toUpperCase();
var user = readline.question('Username : ');
var email = readline.question('Email : ');
var pass = readline.question('Password : ', { hideEchoBack: true });
var icon = crypto.createHash('md5').update(email).digest('hex');
var token = 'xoxo-' + crypto.createHash('md5').update(getKey()).digest('hex');
var salt = crypto.randomBytes(24).toString('base64');
var hash = crypto.createHash('sha256').update(pass + salt).digest('hex');

if (database.users[user]) throw 'User "' + user + '" already exists';

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

console.log('\nUUID: ' + id);
console.log('Token: ' + token);
console.log('Username: ' + user);
console.log('Email: ' + email);
console.log('Icon: ' + icon);
console.log('Salt: ' + salt);
console.log('Hash: ' + hash);

if (readline.keyInYN('Does this look good?')) {
    database.users[user] = object;

    fs.writeFile('./database.json', JSON.stringify(database, null, 4), (error) => {
        if (error) throw 'Failed to write to database: ' + error;
        else console.log('\nSaved to Database √');
    });

    setTimeout(() => {
        fs.access('./keychain.js', fs.F_OK, (error) => {
            if (error) {
                console.info('keychain.js is missing, generating');

                fs.writeFile('./keychain.js', 'exports.session = "' + getKey() + '";', (error) => {
                    if (error) throw 'Error creating keychain.js: ' + error;
                    else console.log('keychain.js created successfully');
                });
            }

            else console.log('keychain.js exists √');
        });

        fs.access('./data/chat.json', fs.F_OK, (error) => {
            if (error) {
                console.info('/data/chat.json is missing, generating');
                if (!fs.existsSync('data')) {
                    fs.mkdirSync('data');
                    fs.writeFile('./data/chat.json', '{"chat":[]}', (error) => {
                        if (error) throw 'Error creating /data/chat.json: ' + error;
                        else console.log('/data/chat.json created successfully');
                    });
                }
            }

            else console.log('/data/chat.json exists √');
        });
    }, 100);
} else throw 'Cancelling Prompt';

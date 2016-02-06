const crypto = require('crypto');
const crimson = require('crimson');
const uuid = require('node-uuid');
const moment = require('moment');
const path = require('path');
const fs = require('fs');

const dbpath = path.join(__dirname, 'database.json');

function time() {
    return moment().format('X');
}

exports.new_user = (data) => {
    if (data.username && data.email && data.password) {
        var database = require(dbpath);
        var id = uuid.v4();
        var user = data.username;
        var email = data.username;
        var pass = data.password;
        var icon = crypto.createHash('md5').update(email).digest('hex');
        var token = 'au-' + crypto.randomBytes(12).toString('hex');
        var salt = crypto.randomBytes(24).toString('base64');
        var hash = crypto.createHash('sha256').update(pass + salt).digest('hex');

        if (database.users[user]) return {
            "ok": false,
            "ts": time(),
            "reason": "User already exists"
        };

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
            if (error) return {
                "ok": false,
                "ts": time(),
                "reason": "Failed to write to database",
                "message": error
            };
        });
        
        return {
            "ok": true,
            "ts": time(),
            "message": "User added"
        };
    } 
    
    else return {
        "ok": false,
        "ts": time(),
        "reason": "Insufficient Details"
    };
};

exports.hash = (username, password) => {
    var database = require(dbpath);
    var user = username;
    var pass = password;

    if (!database.users[user]) return {
        "ok": false,
        "ts": time(),
        "reason": "User doesn\'t exist"
    };

    var salt = database.users[user].salt;
    var hash = crypto.createHash('sha256').update(pass + salt).digest('hex');

    if (database.users[user].password == hash) {
        return {
            "ok": true,
            "ts": time(),
            "username": user,
            "token": database.users[user].token
        };
    } else {
        return {
            "ok": false,
            "ts": time(),
            "reason": "Incorrect Password"
        };
    }
};

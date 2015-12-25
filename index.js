var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var logger = require('crimson');
var moment = require('moment');
/*
var markdown = require('./assets/js/markdown');
var mark = new Slimdown();
*/
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

function timestamp() {return moment().format('X');}
function check_msg(input) {
    var html_safe = String(input).replace(/[&<>"'\/]/g, function(s) {
        var entityMap = {"&": "&amp;","<": "&lt;",">": "&gt;",'"': '&quot;',"'": '&#39;',"/": '&#x2F;'};
        return entityMap[s];
    });
    
    return html_safe;
}

io.on('connection', function(socket) {
	socket.on('disconnect', function() {
        //console.log(socket);
        
        /*
        io.emit('user.disconnect', {
            "ts": timestamp()
        });
        */
        
		logger.error('Client disconnected.');
	});

	socket.on('auth.user_auth', function(data) {
        io.emit('auth.user_auth', {
            "result": "success",
            "ts": timestamp(),
            "username": data.username
        });

		logger.success(data.username + ' authenticated successfully.');
	});

	socket.on('chat.post_message', function(data) {
        io.emit('chat.post_message', {
            "ts": timestamp(),
            "username": data.username,
            "icon": "https://avatars.slack-edge.com/2015-12-22/17173671875_21dcf6ae09fd3b9f261c_48.png",
            "message": check_msg(data.message)
        });

		logger.info(data.username + ': ' + data.message);
	});
    
    socket.on('chat.del_message', function(data) {
        io.emit('chat.del_message', {
           "ts": data.ts
        });
        
        logger.debug(data.ts + ' has been deleted.');
    });
});

http.listen(3000, function() {
	logger.success('Listening on 127.0.0.1:3000');
});

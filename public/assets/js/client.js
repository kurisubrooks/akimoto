$(function () {
    var socket = io.connect();
    var username, online;
    var connected = false;
    var typing = false;

    var $status = $('#status');
    var $client = $('.client');
    var $chatform = $('#chat-form');
    var $inputchat = $('#input-chatmsg');
    var $errorbar = $('.error-bar');

    function time() {
        return moment().format('X');
    }

    $.preloadImages = function() {
        for (var i = 0; i < arguments.length; i++) {
            $('<img />').attr('src', arguments[i]);
        }
    };

    //$('.nano').nanoScroller({ scroll: 'bottom' });

    /*
    // Client Status 
    socket.on('connect', function () {$status.css('color', '#4ecc71');});
    socket.on('reconnect', function () {$status.css('color', '#4ecc71');});
    socket.on('timeout', function () {$status.css('color', '#e65757');});
    socket.on('connect_timeout', function () {$status.css('color', '#e65757');});
    socket.on('error', function () {$status.css('color', '#e65757');});
    socket.on('disconnect', function () {$status.css('color', '#e65757');});
    socket.on('reconnect_error', function () {$status.css('color', '#e65757');});
    socket.on('reconnect_failed', function () {$status.css('color', '#e65757');});
    */

    $.preloadImages('./assets/img/sheet_google_64.png');

    function post(data) {
        var chat_block = $('<div class="chat-block" data-ts="' + data.ts + '"></div>');
        var chat_user = $('<span id="chat-user"></span'); chat_user.text(data.username);
        var chat_time = $('<span id="chat-ts"></span>'); chat_time.text(moment.unix(data.ts).format('hh:mma'));
        var chat_msg = $('<span id="chat-msg"></span>'); chat_msg.text(data.message);

        chat_block.append(chat_user);
        chat_block.append(chat_time);
        chat_block.append(chat_msg);
        $client.append(chat_block);

        emojify('.chat_block[data-ts="' + data.ts + '"] #chat_msg');
    }

    socket.on('chat.post', function(data) {
        console.log(data);
        
        if (!data.ok) $inputchat.css('border-color', '#e65757');
        else {
            post(data);
            $inputchat.css('border-color', '#ddd');
        }
    });

    $chatform.submit(function () {
        if ($inputchat.val() === '') {
            $inputchat.css('border-color', '#e65757');
            return false;
        } else if (username === undefined) {
            post({
                "ok": false,
                "ts": time(),
                "username": notice_user,
                "message": "You need to log in before you can send a message!"
            });

            return false;
        } else if (connected) {
            socket.emit('chat.post', {
                "ok": true,
                "ts": time(),
                "username": username,
                "message": $inputchat.val()
            });

            $inputchat.css('border-color', '#ddd');
            $inputchat.val('');
            return false;
        }
    });
});

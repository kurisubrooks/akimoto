$(function () {
    var socket = io.connect();
    var username, token, online, connected;

    var cookie_user = $.cookie('user');
    var cookie_token = $.cookie('token');

    var $client = $('.nano-content');
    var $chat_form = $('#chat-form');
    var $chat_box = $('#input-chatmsg');
    var $error_bar = $('.error-bar');
    var $red = '#e65757';

    function time() {
        return moment().format('X');
    }

    $preload = function() {
        for (var i = 0; i < arguments.length; i++) {
            $('<img />').attr('src', arguments[i]);
        }
    };

    $preload('./assets/img/sheet_google_64.png');

    /*var $height = $(window).height() - $('.footer').height() - $('.header').height() - 22;
    $('.nano').nanoScroller({ alwaysVisible: true });
    $('.nano').height($height);
    $(window).resize(function(){
        $('.nano').height($height);
    });*/

    function post(data) {
        var chat_block = $('<div class="chat-block" data-ts="' + data.ts + '"></div>');
        var chat_icon = $('<div class="chat-icon"><img src="https://www.gravatar.com/avatar/' + data.icon + '?s=32"></div>');
        var chat_user = $('<span id="chat-user"></span'); chat_user.text(data.username);
        var chat_time = $('<span id="chat-ts"></span>'); chat_time.text(moment.unix(data.ts).format('hh:mma'));
        var chat_msg = $('<span id="chat-msg"></span>'); chat_msg.text(data.message);

        chat_block.append(chat_icon);
        chat_block.append(chat_user);
        chat_block.append(chat_time);
        chat_block.append(chat_msg);
        $client.append(chat_block);

        emojify('.chat_block[data-ts="' + data.ts + '"] #chat_msg');
        $('.content').scrollTop($('.content').prop('scrollHeight'));
    }

    if (cookie_user && cookie_token) {
        socket.emit('auth.user', {
            "ok": true,
            "ts": time(),
            "username": cookie_user,
            "token": cookie_token
        });
    } else {
        socket.emit('auth.user', {
            "ok": false,
            "ts": time(),
            "code": 912,
            "reason": "Cookie Empty"
        });
    }

    socket.on('error', function(data) {
        $error_bar.text('Error: ' + data.reason);
        $error_bar.slideDown('fast');
        if (data.disconnect) socket.disconnect();
    });

    socket.on('auth.user', function(data) {
        if (data.ok) {
            connected = true;
            token = data.token;
            username = data.username;
        }
    });

    socket.on('chat.post', function(data) {
        console.log(data);

        if (!data.ok) $chat_box.css('border-color', '#e65757');
        else {
            post(data);
            $chat_box.css('border-color', '#ddd');
        }
    });

    $chat_form.submit(function() {
        if ($chat_box.val() === '' || $chat_box.val() === ' ') return false;
        else {
            socket.emit('chat.post', {
                "ok": true,
                "ts": time(),
                "message": $chat_box.val()
            });

            $chat_box.val('');
            return false;
        }
    });
});

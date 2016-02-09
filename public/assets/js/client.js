$(function() {
    var socket = io.connect();
    var username, token, connected;

    var cookie_user = $.cookie('user');
    var cookie_token = $.cookie('token');

    var $client = $('.nano-content');
    var $chat_form = $('#chat-form');
    var $chat_box = $('#input-chatmsg');
    var $error_bar = $('.error-bar');
    var $online_users = $('#users');
    var red = '#e65757';
    var scroll = false;

    function time() {
        return moment().format('X');
    }

    $.preload = function() {
        for (var i = 0; i < arguments.length; i++) {
            $('<img />').attr('src', arguments[i]);
        }
    };

    $.preload('./assets/img/sheet-google-64.png');

    /*var $height = $(window).height() - $('.footer').height() - $('.header').height() - 22;
    $('.nano').nanoScroller({ alwaysVisible: true });
    $('.nano').height($height);
    $(window).resize(function(){
        $('.nano').height($height);
    });*/

    socket.on('connect', function() {
        error('remove');
    });
    socket.on('reconnect', function() {
        error('remove');
    });
    socket.on('error', function() {
        error('error', 'Unknown Error');
    });
    socket.on('timeout', function() {
        error('error', 'Connection Timed Out');
    });
    socket.on('disconnect', function() {
        error('error', 'Disconnected from Server, retrying...');
    });
    socket.on('connect_timeout', function() {
        error('error', 'Couldn\'t Reconnect');
    });
    socket.on('reconnect_error', function() {
        error('error', 'Unable to Reconnect, retrying...');
    });
    socket.on('reconnect_failed', function() {
        error('error', 'Unable to Reconnect. Please refresh!');
    });

    function post(data) {
        var chat_block = $('<div class="chat-block" data-ts="' + data.ts + '"></div>');
        var chat_icon = $('<div class="chat-icon"><img src="https://www.gravatar.com/avatar/' + data.icon + '?s=256" width="32px"></div>');
        var chat_user = $('<span id="chat-user"></span').text(data.username);
        var chat_time = $('<span id="chat-ts"></span>').text(moment.unix(data.ts).format('hh:mma'));
        var chat_msg = $('<span id="chat-msg"></span>').html(markdown(emojalias(data.message)));

        emoji(chat_msg);

        chat_block.append(chat_icon);
        chat_block.append(chat_user);
        chat_block.append(chat_time);
        chat_block.append(chat_msg);
        $client.append(chat_block);

        $('.content').scrollTop($('.content').prop('scrollHeight'));
    }

    function markdown(text) {
        var markdown = [
            [/(^|\s+)\[([^\[]+)\]\(([^\)]+)\)(\s+|$)/g, ' <a href="$3">$2</a> '],
            [/(^|\s+)(\*)(.*?)\2(\s+|$)/g, ' <strong>$3</strong> '],
            [/(^|\s+)(\_)(.*?)\2(\s+|$)/g, ' <em>$3</em> '],
            [/(^|\s+)(\~)(.*?)\2(\s+|$)/g, ' <del>$3</del> '],
            [/(^|\s+)(`)(.*?)\2(\s+|$)/g, ' <code>$3</code> ']
        ];
        $.each(markdown, function(i) {
            text = text.replace(markdown[i][0], markdown[i][1]);
        });
        return text;
    }

    function emoji(input) {
        $.getJSON('./assets/js/emoji.json', function(data) {
            var sheet_max = 40;
            $.each(data, function(i) {
                $(input).text(function() {
                    var message = $(this).html();
                    var sheet_xx = (data[i].sheet_x / sheet_max) * 100;
                    var sheet_yy = (data[i].sheet_y / sheet_max) * 100;
                    var short_name = ':' + data[i].short_name + ':';
                    var output = '<span class="emoji-sizer"><span class="emoji" style="background-position:' + sheet_xx + '% ' + sheet_yy + '%;">' + short_name + '</span></span>';
                    $(this).html(message.replace(short_name, output));
                });
            });
        });
    }

    function emojalias(text) {
        var aliases = [
            [':)', ':slightly_smiling_face:'],
            [':(', ':disappointed:'],
            [':D', ':smile:'],
            ['D:', ':anguished:'],
            [';)', ':wink:'],
            [':3', ':smiley_cat:'],
            [':p', ':stuck_out_tongue:'],
            [':P', ':stuck_out_tongue:'],
            [':o', ':open_mouth:'],
            [':O', ':open_mouth:'],
            [':\'(', ':cry:'],
            [':l', ':confused:'],
            [':|', ':neutral_face:'],
            [':/', ':confused:'],
            ['>:(', ':angry:'],
            ['>:)', ':smiling_imp:'],
            ['<3', ':heart:'],
            ['<*3', ':sparkling_heart:'],
            ['</3', ':broken_heart:']
        ];
        $.each(aliases, function(i) {
            text = text.replace(aliases[i][0], aliases[i][1]);
        });
        return text;
    }



    function error(type, message) {
        if (type === 'error') {
            $error_bar.text('Error: ' + message);
            $error_bar.slideDown('fast');
        } else if (type === 'remove') {
            $error_bar.text('');
            $error_bar.slideUp('fast');
        }
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

    socket.on('presence.change', function(data) {
        console.log(data.presence);
        var users = [];
        $.each(data.presence, function(key, value) {
            if (value) users.push('<li><i class="fa fw-fw fa-circle presence-icon"></i><span id="user">' + key + '</span></li>');
            else users.push('<li><i class="fa fw-fw fa-circle-thin presence-icon"></i><span id="user">' + key + '</span></li>');
        });
        $online_users.html(users.join(''));
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

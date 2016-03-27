$(function() {
    var socket = io.connect();
    var cookie_user = $.cookie('user');
    var cookie_token = $.cookie('token');

    var $client = $('.chat');
    var $nano = $('.nano');
    var $chat_form = $('.send');
    var $chat_box = $('.input');
    var $error_bar = $('.status');
    var $online_users = $('#users');
    var $height = $('.content').height() - 5;
    //var $height = $(window).height() - $('.footer').height() - $('.header').height() - 22;
    var username, token, connected, last_ts, last_user;
    var red = '#e65757';
    var scrolled = true;
    var active = true;

    $.preload = function() {
        for (var i = 0; i < arguments.length; i++) $('<img />').attr('src', arguments[i]);
    };
    
    function time() { return moment().format('X'); }
    
    $(window).resize(function() { reinit() });
    $(window).focus(function() { active = true; });
    $(window).blur(function() { active = false; });

    function reinit() {
        $nano.nanoScroller({ destroy: true });
        $nano.nanoScroller({ alwaysVisible: true, scroll: 'bottom' });
        $nano.height($height);
    }
    
    function checkScroll() {
        if ($client[0].scrollHeight - $client.scrollTop() == $client.outerHeight()) {
            scrolled = true;
            return true;
        } else {
            scrolled = false;
            return false;
        }
    }

    function newNotification(data) {
        var notification = new Notification('Akimoto', {
            body: data.username + ': ' + data.message,
            icon: 'https://www.gravatar.com/avatar/' + data.icon + '?s=256',
            silent: true
        });

        setTimeout(function() {
            notification.close();
        }, 5000);
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

    function post(data) {
        var chat_div =      $('<div class="message" data-ts="' + data.ts + '"></div>');
        var chat_inline =   $('<div class="message inline" data-ts="' + data.ts + '"></div>');
        var chat_gutter =   $('<div class="msg-gutter"></div>');
        var chat_image =    $('<img src="https://www.gravatar.com/avatar/' + data.icon + '?s=256" width="38px">');
        var chat_content =  $('<div class="msg-content"></div>');
        var chat_user =     $('<span class="chat-user"></span>').text(data.username);
        var chat_time =     $('<span class="chat-time"></span>').text(moment.unix(data.ts).format('h:mma'));
        var chat_msg =      $('<div class="chat-msg"></div>').html(markdown(emoji.replace_unified(emoji.replace_colons(emoji.replace_emoticons_with_colons(data.message)))));
        
        if (checkScroll() || !active) {
            reinit();
            window.scrollTo(0, $client.scrollHeight);
        }

        if (!active) newNotification(data);
        if (last_ts > (data.ts - 300) && last_user == data.username) {
            chat_gutter.append(chat_time);
            chat_content.append(chat_msg);
            chat_inline.append(chat_gutter);
            chat_inline.append(chat_content);
            $client.append(chat_inline);
        } else {
            chat_gutter.append(chat_image);
            chat_content.append(chat_user);
            chat_content.append(chat_time);
            chat_content.append(chat_msg);
            chat_div.append(chat_gutter);
            chat_div.append(chat_content);
            $client.append(chat_div);
        }
        
        last_user = data.username, last_ts = data.ts;
    }

    $.preload('/assets/img/sheet-google-64.png');

    emoji.img_sets['google']['sheet'] = '/assets/img/sheet-google-64.png';
    emoji.include_title = true;
    emoji.allow_native = false;
    emoji.use_sheet = true;
    emoji.img_set = 'google';

    socket.on('connect', function() {
        error('remove');
    });
    socket.on('reconnect', function() {
        error('remove');
        location.reload();
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
            if (value) users.push('<li><i class="fa fw-fw fa-circle presence-icon"></i> <span id="user">' + key + '</span></li>');
            else users.push('<li><i class="fa fw-fw fa-circle-thin presence-icon"></i> <span id="user">' + key + '</span></li>');
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
        if (!$.trim($chat_box.val())) return false;
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
    
    function markdown(text) {
        var markdown = [
            [/(^|\s+)\[([^\[]+)\]\(([^\)]+)\)(\s+|$)/g, ' <a href="$3">$2</a> '],
            [/(^|\s+)(\*)(.*?)\2(\s+|$)/g, ' <strong>$3</strong> '],
            [/(^|\s+)(\_)(.*?)\2(\s+|$)/g, ' <em>$3</em> '],
            [/(^|\s+)(\~)(.*?)\2(\s+|$)/g, ' <del>$3</del> '],
            [/(^|\s+)(`)(.*?)\2(\s+|$)/g, ' <code>$3</code> '],
            [/(^|\s+)(```)(.*?)\2(\s+|$)/g, ' <pre>$3</pre> ']
        ];
        $.each(markdown, function(i) {
            text = text.replace(markdown[i][0], markdown[i][1]);
        });
        return text;
    }
});

$(window).load(function() {
    setTimeout(function() {
        $('.overlay').fadeOut('fast');
    }, 1000);

    if (!('Notification' in window)) {
        alert('Notifications could not be enabled. Update your browser!');
        return;
    } else if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
});

$(function () {
    var socket = io.connect();
    var authenticated = false;
    var username;

    notify_getPerms();

    if (!authenticated) {
        $('.login').show();
        $('.overlay').show();
    }

    function post_message(data) {
        console.log(data);

        notify_trigger(data.username + ': ' + data.message);

        $('.client').append($(
            '<div class="chat_block" data-ts="' + data.ts + '">' +
            '<img class="chat_img" src="' + data.icon + '" width="32px">' +
            '<span id="chat_user">' + data.username + '</span>' +
            '<span id="chat_ts">' + moment.unix(data.ts).format("hh:mma") + '</span>' +
            '<span id="chat_msg">' + data.message + '</span>' +
            '</div>'
        ));
    }

    function notify_getPerms() {
        if (!('Notification' in window)) {
            alert('Your browser doesn\'t support HTML5 Notifications. Consider upgrading your browser.');
            return;
        }

        Notification.requestPermission(function (permission) {
            if (Notification.permission == 'granted') {
                var notification = new Notification('Akimoto', {
                    body: 'Notifications Enabled.'
                });

                setTimeout(function () {
                    notification.close();
                }, 2500);
            }
        });
    }

    function notify_trigger(body) {
        if (Notification.permission == 'granted') {
            var notification = new Notification('Akimoto', {
                body: body
            });

            setTimeout(function () {
                notification.close();
            }, 4500);
        } else if (Notification.permission != 'denied') {
            notify_getPerms();
        }
    }

    socket.on('chat.post_message', function (data) {
        post_message({
            "ts": data.ts,
            "username": data.username,
            "icon": data.icon,
            "message": data.message
        });
    });

    $('#login_form').submit(function () {
        if (String($('#auth_input').val()).length >= 16) {
            $('#login_error').show();
            $('#login_error').text('Error! This username is too long.');
            console.log('Error: Username too long.');
            return false;
        } else {
            socket.emit('auth.user_auth', {
                "username": $('#auth_input').val()
            });

            username = $('#auth_input').val();
            $('#auth_input').val('');

            socket.emit('chat.post_message', {
                "username": username,
                "message": username + " joined!"
            });

            $('.login').hide();
            $('.login').attr("disabled", true);
            $('.overlay').fadeOut(350);
            $('#chat_input').focus();
            $('#chat_input').attr("autofocus");

            authenticated = true;
            return false;
        }
    });

    $('#chat_form').submit(function () {
        if (username !== undefined) {
            socket.emit('chat.post_message', {
                "username": username,
                "message": $('#chat_input').val()
            });

            $('#chat_input').val('');
            return false;
        } else {
            post_message({
                "ts": moment().format('X'),
                "username": "Akimoto",
                "message": "You need to log in before you can send a message!"
            });

            return false;
        }
    });
});
$(function () {
    var socket = io.connect();
    var authenticated = false;
    var ready = false;
    var username;

    if (!authenticated) {
        $('.login').show();
    }
    
    // Success
    socket.on('connect', function () {
        $('#status').css('color', '#4ecc71');
    });
    
    socket.on('reconnect', function () {
        $('#status').css('color', '#4ecc71');
    });
    
    // Error
    $('#status').click(function(){
        socket.disconnect();
        location.reload();
    });
    
    socket.on('timeout', function () {
        $('#status').css('color', '#e65757');
    });
    
    socket.on('connect_timeout', function () {
        $('#status').css('color', '#e65757');
    });
    
    socket.on('error', function () {
        $('#status').css('color', '#e65757');
    });
    
    socket.on('disconnect', function () {
        $('#status').css('color', '#e65757');
    });
    
    socket.on('reconnect_error', function () {
        $('#status').css('color', '#e65757');
    });
    
    socket.on('reconnect_failed', function () {
        $('#status').css('color', '#e65757');
    });

    function post_message(data) {
        console.log(data);

        $('.client').append($(
            '<div class="chat_block" data-ts="' + data.ts + '">' +
            '<img class="chat_img" src="' + data.icon + '" width="32px">' +
            '<span id="chat_user">' + data.username + '</span>' +
            '<span id="chat_ts">' + moment.unix(data.ts).format("hh:mma") + '</span>' +
            '<span id="chat_msg">' + data.message + '</span>' +
            '</div>'
        ));
    }

    socket.on('chat.post', function (data) {
        post_message({
            "ts": data.ts,
            "username": data.username,
            "icon": data.icon,
            "message": data.message
        });
    });
    
    socket.on('auth.user', function (data) {
        console.log(data);
        
        if (data.ok) {
            username = $('#input_username').val();
            
            socket.emit('chat.post', {
                "username": username,
                "message": username + " joined!"
            });
            
            $('#input_username').val('');
            $('#input_password').val('');
            
            $('.login').hide();
            $('.login').attr("disabled", true);
            $('.overlay').fadeOut(350);
            $('#chat_input').focus();
            $('#chat_input').attr("autofocus");

            authenticated = true;
            return false;
        }
        
        else {
            console.log('Error: ' + data.reason);
            $('#login_error').show();
            $('#login_error').text(data.reason);
            $('#input_username').css('border-color', '#e65757');
            return false;
        }
    });

    $('#login_form').submit(function () {
        if ($('#input_username').val() == '') {
            $('#input_username').css('border-color', '#e65757');
            return false;
        }
        
        else {
            socket.emit('auth.user', {
                "username": $('#input_username').val(),
                "password": $('#input_password').val()
            });

            return false;
        }
    });

    $('#chat_form').submit(function () {
        if ($('#input_chatmsg').val() == '') {
             $('#input_chatmsg').css('border-color', '#e65757');
            return false;
        }

        else if (username == undefined) {
            post_message({
                "ts": moment().format('X'),
                "username": "Notice",
                "message": "You need to log in before you can send a message!"
            });

            return false;
        } else {
            socket.emit('chat.post', {
                "username": username,
                "message": $('#input_chatmsg').val()
            });

            $('#input_chatmsg').css('border-color', '#ddd');
            $('#input_chatmsg').val('');
            return false;
        }
    });
});

/*
function notify_getPerms() {
    if (!('Notification' in window)) {
        alert('Your browser doesn\'t support Notifications. Consider upgrading!');
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
*/
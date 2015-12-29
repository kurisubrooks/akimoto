$(function() {
    var socket = io.connect();

    var username;
    var online;
    var authenticated = false;
    var connected = false;
    var typing = false;
    
    var $status = $('#status');
    var $client = $('.client');
    var $login = $('.login');
    var $overlay = $('.overlay');
    var $loginerr = $('#login_error')
    var $loginform = $('#login_form');
    var $chatform = $('#chat_form');
    var $inputuser = $('#input_username');
    var $inputchat = $('#input_chatmsg');
   
    // Open Login Window if not authenticated
    if (!authenticated) $login.show();
    
    // Client Status
    socket.on('connect', function() {$status.css('color', '#4ecc71');});
    socket.on('reconnect', function() {$status.css('color', '#4ecc71');});
	socket.on('timeout', function() {$status.css('color', '#e65757');});
    socket.on('connect_timeout', function() {$status.css('color', '#e65757');});
    socket.on('error', function() {$status.css('color', '#e65757');});
    socket.on('disconnect', function() {$status.css('color', '#e65757');});
    socket.on('reconnect_error', function() {$status.css('color', '#e65757');});
    socket.on('reconnect_failed', function() {$status.css('color', '#e65757');});
    
    $status.click(function(){
        socket.disconnect();
        location.reload();
    });
    
    function time() {
        return moment().format('X');
    }
    
    function post(data) {
        console.log(data);
        
        $client.append($(
            '<div class="chat_block" data-ts="' + data.ts + '">' +
                //'<img class="chat_img" src="' + data.icon + '" width="32px">' +
                '<span id="chat_user">' + data.username + '</span>' +
                '<span id="chat_ts">' + moment.unix(data.ts).format("hh:mma") + '</span>' +
                '<span id="chat_msg">' + data.message + '</span>' +
            '</div>'
        ));
    }

    socket.on('chat.post', function(data) {
        post(data);
    });

    socket.on('user.join', function(data) {
        console.log(data);
        
        post({
            "ok": true,
            "ts": time(),
            "username": data.username,
            "message": data.username + ' joined!'
        });
    });
    
    socket.on('user.auth', function(data) {
        console.log(data);
        
        if (data.ok) {
            connected = true;
            username = $inputuser.val();
            authenticated = true;

            $inputuser.val('');
            $login.hide();
            $overlay.fadeOut(350);
            $login.attr('disabled');
            $inputchat.focus();
            return false;
        }
        
        else {
            $loginerr.show();
            $loginerr.text(data.message);
            $inputuser.css('border-color', '#e65757');
        }
    });
    
    /*socket.on('user.quit', function(data) {
        console.log(data);
        
        socket.emit('chat.post', {
            "ok": true,
            "ts": time(),
            "username": data.username,
            "message": data.username + ' left.'
        });
    });*/

    $loginform.submit(function() {
        if ($inputuser.val() === '') {
            $inputuser.css('border-color', '#e65757');
            return false;
        }
        
        else {
            socket.emit('user.auth', {
                "ok": true,
                "ts": time(),
                "username": $inputuser.val()
            });
            
            return false;
        }
    });
    
    $chatform.submit(function() {
        if ($inputchat.val() === '') {
            $inputchat.css('border-color', '#e65757');
            return false;
        }
        
        else if (username === undefined) {
            post({
                "ok": false,
                "ts": time(),
                "username": notice_user,
                "message": "You need to log in before you can send a message!"
            });
            
            return false;
        }
        
        else if (connected) {
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
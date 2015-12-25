$(function() {
    var socket = io.connect();
    var authenticated = false;
    var username;

    if (!authenticated) {
        $('.login').show();
        $('.overlay').show();
    }
    
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
        
        $(".client").animate({ scrollTop: $(document).height() }, "slow");
	}

	socket.on('chat.post_message', function(data) {
        post_message({
			"ts": data.ts,
			"username": data.username,
            "icon": data.icon,
			"message": data.message
		});
	});

	$('#login_form').submit(function() {
		socket.emit('auth.user_auth', {
			"username": $('#auth_input').val()
		});

		username = $('#auth_input').val();
		$('#auth_input').val('');
        
        socket.emit('chat.post_message', {
            "username": username,
            "icon": "https://avatars.slack-edge.com/2015-12-22/17173671875_21dcf6ae09fd3b9f261c_48.png",
            "message": "<i>Joined</i>"
        });
        
        $('.login').hide();
        $('.login').attr("disabled", true);
        $('.overlay').fadeOut(350);
        $('#chat_input').focus();
        $('#chat_input').attr("autofocus");

		authenticated = true;
		return false;
	});

    $('#chat_form').submit(function() {
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
                "icon": "https://avatars.slack-edge.com/2015-12-22/17173671875_21dcf6ae09fd3b9f261c_48.png",
				"message": "You need to log in before you can send a message!"
			});

            return false;
        }
    });
});

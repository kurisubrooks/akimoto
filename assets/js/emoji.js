function emojify(input) {
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
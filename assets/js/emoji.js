function parse_emoji(emoloc) {
  $.getJSON('./assets/js/emoji.json', function(data) {
    var sheet_max = 40;
    $.each(data, function(i) {
      $(emoloc).text(function() {
        var message = $(this).html();
        var sheet_xp = (data[i].sheet_x / sheet_max) * 100;
        var sheet_yp = (data[i].sheet_y / sheet_max) * 100;
        var short_name = ':' + data[i].short_name + ':';
        var out_html = '<span class="emoji-sizer"><span class="emoji" style="background-position:' + sheet_xp +'% ' + sheet_yp + '%;">' + short_name + '</span></span>';
        $(this).html(message.replace(short_name, out_html));
      });
    });
  });
}

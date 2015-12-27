exports.check_msg = function (input) {
    var html_safe = String(input).replace(/[&<>"'\/]/g, function (s) {
        var entityMap = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': '&quot;',
            "'": '&#39;',
            "/": '&#x2F;'
        };
        return entityMap[s];
    });

    return html_safe;
};
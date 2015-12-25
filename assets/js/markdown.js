'use strict';

/*!
 * Author: Johnny Broadway <johnny@johnnybroadway.com>
 * Website: https://gist.github.com/jbroadway/2836900
 * License: MIT
 */

module.Slimdown = function() {
    // Rules
    this.rules =  [
        //{regex: /(#+)(.*)/g, replacement: header},                                         // headers
        //{regex: /!\[([^\[]+)\]\(([^\)]+)\)/g, replacement: '<img src="$2" alt="$1">'},     // image
        //{regex: /\[([^\[]+)\]\(([^\)]+)\)/g, replacement: '<a href="$2">$1</a>'},          // hyperlink
        {regex: /(\*|__)(.*?)\1/g, replacement: '<b>$2</b>'},                              // bold
        //{regex: /(\*|_)(.*?)\1/g, replacement: '<em>$2</em>'},                             // emphasis
        //{regex: /\~\~(.*?)\~\~/g, replacement: '<del>$1</del>'},                           // del
        //{regex: /\:\"(.*?)\"\:/g, replacement: '<q>$1</q>'},                               // quote
        {regex: /`(.*?)`/g, replacement: '<code>$1</code>'},                               // inline code
        {regex: /\n\*(.*)/g, replacement: ulList},                                         // ul lists
        //{regex: /\n[0-9]+\.(.*)/g, replacement: olList},                                   // ol lists
        {regex: /\n(&gt;|\>)(.*)/g, replacement: blockquote},                              // blockquotes
        //{regex: /\n-{5,}/g, replacement: '\n<hr />'},                                      // horizontal rule
        //{regex: /\n([^\n]+)\n/g, replacement: para},                                       // add paragraphs
        {regex: /<\/ul>\s?<ul>/g, replacement: ''},                                        // fix extra ul
        {regex: /<\/ol>\s?<ol>/g, replacement: ''},                                        // fix extra ol
        {regex: /<\/blockquote><blockquote>/g, replacement: '\n'}                          // fix extra blockquote
    ];

    // Add a rule.
    this.addRule = function (regex, replacement) {
        regex.global = true;
        regex.multiline = false;
        this.rules.push({
            regex: regex,
            replacement: replacement
        });
    };

    // Render some Markdown into HTML.
    this.render = function (text) {
        text = '\n' + text + '\n';
        this.rules.forEach(function (rule) {
            text = text.replace(rule.regex, rule.replacement);
        });
        return text.trim();
    };

    function para(text, line) {
        debugger;
        var trimmed = line.trim();
        if (/^<\/?(ul|ol|li|h|p|bl)/i.test(trimmed)) {
            return '\n' + line + '\n';
        }
        return '\n<p>' + trimmed + '</p>\n';
    }

    function ulList(text, item) {
        return '\n<ul>\n\t<li>' + item.trim() + '</li>\n</ul>';
    }

    function olList(text, item) {
        return '\n<ol>\n\t<li>' + item.trim() + '</li>\n</ol>';
    }

    function blockquote(text, tmp, item) {
        return '\n<blockquote>' + item.trim() + '</blockquote>';
    }

    function header(text, chars, content) {
        var level = chars.length;
        return '<h' + level + '>' + content.trim() + '</h' + level + '>';
    }
}
/*
var sd = new Slimdown();
$('body').append(sd.render('#  Title\n\nAnd *now* [a link](http://www.google.com) to **follow** and [another](http://yahoo.com/).\n\n* One\n* Two\n* Three\n\n## Subhead\n\nOne **two** three **four** five.\n\nOne __two__ three _four_ five __six__ seven _eight_.\n\n1. One\n2. Two\n3. Three\n\nMore text with `inline($code)` and :"quote": sample.\n\n> A block quote\n> across two lines.\nMore text...'));
*/
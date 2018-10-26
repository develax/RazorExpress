////////////////////////////////////////////////
// String
////////////////////////////////////////////////

String.format = String.format || function (format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/{(\d+)}/g, function (match, number) {
        return typeof args[number] !== 'undefined'
            ? args[number]
            : match
            ;
    });
};

String.isWhiteSpace = String.isWhiteSpace || function (str) {
    return str && str.trim().length === 0;
};

String.prototype.startsWithIgnoreCase = function (str, pos) {
    pos = pos || 0;

    if (this.length - pos < str.length)
        return false;

    for (let i = 0; i < str.length; i++)
        if (this[i + pos].toLowerCase() !== str[i].toLowerCase())
            return false;

    return true;
};

////////////////////////////////////////////////
// Char
////////////////////////////////////////////////

if (!global.Char) {
    Char = {};
}

if (!Char.isLetter) {
    Char.isLetter = function (c) {
        return c.toLowerCase() !== c.toUpperCase();
    };
}

Char.isDigit = Char.isDigit || function (c) {
    return '0123456789'.indexOf(c) !== -1;
};


////////////////////////////////////////////////
// path
////////////////////////////////////////////////
const path = require('path');

path.fileName = function (fullFileName, withExt) {
    if (withExt) return path.win32.basename(fullFileName);
    let extension = path.extname(fullFileName);
    return path.win32.basename(fullFileName, extension);
};

path.cutLastSegment = function (dir) {
    dir = path.normalize(dir);
    let pos = dir.lastIndexOf(path.sep);
    if (pos === -1) return '';
    return dir.substring(0, pos);
};
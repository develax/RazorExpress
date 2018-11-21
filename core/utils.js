////////////////////////////////////////////////
// String
////////////////////////////////////////////////

String.whitespaces = '\r\n\t ';

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

String.prototype.startsWithIC = String.prototype.startsWithIgnoreCase = function (str, pos) {
    pos = pos || 0;

    if (this.length - pos < str.length)
        return false;

    for (let i = 0; i < str.length; i++)
        if (this[i + pos].toLowerCase() !== str[i].toLowerCase())
            return false;

    return true;
};

String.equal = function (s1, s2, ignoreCase, useLocale) {
    if (s1 == null || s2 == null)
        return false;

    if (!ignoreCase) {
        if (s1.length !== s2.length)
            return false;

        return s1 === s2;
    }

    if (useLocale) {
        if (useLocale.length)
            return s1.toLocaleLowerCase(useLocale) === s2.toLocaleLowerCase(useLocale)
        else
            return s1.toLocaleLowerCase() === s2.toLocaleLowerCase()
    }
    else {
        if (s1.length !== s2.length)
            return false;

        return s1.toLowerCase() === s2.toLowerCase();
    }
}

// If you don't mind extending the prototype.
String.prototype.equal = function (string2, ignoreCase, useLocale) {
    return String.equal(this.valueOf(), string2, ignoreCase, useLocale);
}

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
    if (!c) return false;
    if (c.length > 1) throw new Error(`Invalid length of argument '${c}'.`);
    return '0123456789'.indexOf(c) !== -1;
};

Char.isWhiteSpace = Char.isWhiteSpace || function (c) {
    if (!c) return false;
    if (c.length > 1) throw new Error(`Invalid length of argument '${c}'.`);
    return String.whitespaces.indexOf(c) !== -1;
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

        //deleteObjectProperties(obj) {
        //    for (var p in obj)
        //        if (Object.prototype.hasOwnProperty.call(obj, p))
        //            delete obj[p];
        //}
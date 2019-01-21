////////////////////////////////////////////////
// String
////////////////////////////////////////////////

if (typeof Utils === 'undefined') Utils = {};

String.whitespaces = '\r\n\t ';

String.is = function (val) {
    // return typeof val === "string" || val instanceof String;
    return Object.prototype.toString.call(val) === "[object String]";
}

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

String.prototype.numberOfOccurrences = function (str, max = 2) {
    let pos = 0, num = 0, idx = 0;

    do {
        let start = pos && pos + str.length;
        idx = this.indexOf(str, start);

        if (idx !== -1) {
            num++;
            pos = idx;
        }
    } while (num < max && idx !== -1);

    return { num, pos };
}

String.stripBOM = function (str) {
    if (str.charCodeAt(0) === 0xFEFF)
        return str.slice(1);
    
    return str;
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

Char.isIdentifier = function (c) {
    return Char.isLetter(c) || Char.isDigit(c) || '_$'.includes(c);
}
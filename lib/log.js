/**
 * # Logging library for Node.js
 *
 * @author Monwara LLC / Branko Vukelic <branko@monwara.com>
 * @license MIT
 * @version 0.1.6
 */

var c = require('colors');
var util = require('util');

var level = 'debug';
var LEVELS = {
  debug: 1,
  info: 2,
  error: 3,
  critical: 4
};

var EXCLUDES = ['password'];
var WHITELIST = [];
var BLACKLIST = [];

var logging = exports;

var stamp = false;

function getStamp() {
  var date = new Date();

  return [
    '[', ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()], ' ',
    date.getFullYear(), '-', (date.getMonth() + 1), '-', date.getDate(),
    ' ', date.getHours(), ':', date.getMinutes(), ':', date.getSeconds(), '.',
    date.getMilliseconds(), ' GMT', date.getTimezoneOffset() / 60, ']'
  ].join('').grey;

}

function humanize(i) {
  if (i > 1073741824) {
    return Math.round((i / 1073741824) * 100) / 100 + ' GiB';
  } else if (i > 1048576) {
    return Math.round((i / 1048576) * 100) / 100  + ' MiB';
  } else {
    return Math.round((i / 1024) * 100) / 100 + ' KiB';
  }
}

function prettyPrintObj(o, excludes) {
  excludes = typeof excludes === 'undefined' ? EXCLUDES : excludes;

  if (!o || typeof o !== 'object' || !Object.keys(o).length) {
    return '*'.grey + ' ' + 'n/a'.green + '\n';
  }

  var rows = [];

  Object.keys(o).forEach(function(key) {
    var value;

    if (excludes.length && excludes.indexOf(key) < 0) {

      if (o[key] === null) {
        value = 'null'.grey;
      } else if (typeof o[key] === 'undefined') {
        value = 'undefined'.grey;
      } else {
        value = o[key].toString();
      }

    } else {
      value = '(excluded)'.grey;
    }

    rows.push('*'.grey + ' ' + key.green + ': ' + value);
  });

  return '\n' + rows.join(' ') + '\n';
}

// Escape special characters used in regexp
function cleanRxp(s) {
  return s.replace(/\\/g, '\\\\').
    replace(/\./g, '\\.');
}

function cleanUp(msg) {
  if (!WHITELIST.length && !BLACKLIST.length) {
    // Pass-thru if WHITELIST and BLACKLIST are empty
    return msg;
  }

  // Sanitize using blacklist if no whitelist is provided
  if (!WHITELIST.length && BLACKLIST.length) {
    BLACKLIST.forEach(function(r) {
      msg = msg.replace(r, '');
    });
    return msg;
  }

  // Sanitize using whitelist
  WHITELIST.forEach(function(r) {
    var badUniqueChars = [];
    var badChars = msg.split(r);
    badChars.forEach(function(c) {
      if (c.length && badUniqueChars.indexOf(c) === -1) {
        badUniqueChars.push(c);
      }
    });
    badUniqueChars.forEach(function(c) {
      msg = msg.replace(new RegExp(cleanRxp(c), 'gm'), '');
    });
  });

  return msg;
}

function log(msg, flag, minlvl, trace, block) {
  if (LEVELS[level] > LEVELS[minlvl]) {
    return;
  }

  msg = cleanUp(msg);

  block = block || false;

  var ts = stamp ? getStamp() + ' ' : '';

  if (block) {
    util.debug(ts + flag + ': ' + msg);
  } else {
    console.log(ts + flag + ': ' + msg);
  }

  if (trace) {
    console.trace();
  }
}

logging.pretty = prettyPrintObj;

logging.setLevel = function(lvl) {
  if (Object.keys(LEVELS).indexOf(level) < 0) {
    level = 'info';
  } else {
    level = lvl;
  }
};

/**
 * Convert an array of regexps or strings (or both) to regexps
 *
 * @param {Array} arr Array of items to convert
 * @return {Array} Array of regexps
 */
function convertToRegExp(arr) {
  var regexes = [];
  arr.forEach(function(r) {
    if (typeof r === 'string') {
      // Check if it begins with a slash
      if (r[0] === '/' && a.slice(-1) === '/') {
        regexes.push(new RegExp(r.slice(0, -1), 'gm'));
      } else {
        regexes.push(new RegExp(r, 'gm'));
      }
    } else if (r instanceof RegExp) {
      regexes.push(new RegExp(r.source, 'gm'));
    }
  });
  return regexes;
}

logging.setBlacklist = function(blacklist) {
  if (!Array.isArray(blacklist)) { return; }
  BLACKLIST = convertToRegExp(blacklist);
};

logging.setWhitelist = function(whitelist) {
  if (!Array.isArray(whitelist)) { return; }
  WHITELIST = convertToRegExp(whitelist);
};

logging.setExcludes = function(excludes) {
  EXCLUDES = excludes;
};

logging.inf = function(msg, trace) {
  log(msg, 'INF'.bold.green, 'info', trace);
};

logging.dbg = function(msg, trace) {
  log(msg, 'DBG'.bold.yellow, 'debug', trace);
};

logging.err = function(msg, trace) {
  log(msg, 'ERR'.bold.red, 'error', trace);
};

logging.bad = function(msg, trace) {
  log(msg.toString().red.bold, 'BAD'.bold.red.inverse, 'critical', trace, true);
};

logging.inspect = function(obj, trace) {
  logging.debug(utils.inspect(obj, true, null), trace);
};

logging.startTimer = function() {
  var startTime = (new Date()).getTime();

  return function(msg, trace) {
    msg = msg + ' ' + ('(took ' + ((new Date()).getTime() - startTime) + 'ms)').yellow;
    logging.dbg(msg, trace);
  };
};

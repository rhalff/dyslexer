var util = require('util'),
  Scope = require('../scope')

/**
 *
 * This is the data scope it is entered
 * when a quoted string is encountered.
 *
 * It will quit the scope when we reach
 * the same quote type (' or "), unless
 * that quote was escaped.
 *
 */
function DataScope(lexer) {
  Scope.apply(this, arguments);
}

util.inherits(DataScope, Scope);

DataScope.prototype.onEnter = function() {
  // We need to hint what is our tokenEnding
  this.tokenEnding = [this.lexer.scoper];

  // whether the lexer should check for
  // an escape \ one char back.
  this.escape = true;
};

DataScope.prototype.onLineStart = function() {

  this.tokensExpected = 1;

};

DataScope.prototype.onToken = function(token) {
  this.lexer.present('DATA', token);
};

module.exports = DataScope;

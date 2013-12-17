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
function DataScope(matcher) {
  Scope.apply(this, arguments);
}

util.inherits(DataScope, Scope);

DataScope.prototype.onEnter = function() {
  // We need to hint what is our tokenEnding
  this.tokenEnding = [this.matcher.scoper];

  // whether the matcher should check for
  // an escape \ one char back.
  this.escape = true;
};

DataScope.prototype.onLineStart = function() {

  this.tokensExpected = 1;

};

DataScope.prototype.setup = function() {

  // Used to validate the tokens.
  this.validate = {
    // DATA: /[A-z_]+/,
  };

  // our matchers
  this.rules = { };

};

DataScope.prototype.onToken = function(token) {
  // Ok, this is how it is supposed to be.
  // we inform the matcher when our token is finished.
  // however the matcher should also know about escaping
  // otherwise it will emit at the wrong time.
  this.matcher.emit('DATA', token);
  //this.parent().emit('DATA', token);

  // Seems like it would work but doesn't
  // the scope is still this.
  // however it is automatically closed
  // this.parent().onToken(token);
};

module.exports = DataScope;

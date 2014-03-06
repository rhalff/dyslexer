'use strict';

function Scope(lexer) {

  this.lexer = lexer;

  // default token endings
  // a scope can overwrite this.
  //this.tokenEnding = [];
  // [] now means the scope doesn't have any token endings.
  // it will handle it by itself.
  this.tokenEnding = undefined;

  // If this is set, the parser will throw an error
  // if there are more tokens, within the current scope.
  this.tokensExpected = undefined;

  // tokens processed by this scope on the current line
  // automatically reset on each line start
  this.tokens = [];

  // check for escaped token endings
  this.escape = false;

  // basic structure checking
  // if empty no structure checking is done.
  this.structure = [];

  // this could be made generic for switchers.
  // switchers are only valid until the next char.
  this.rules = {};

  this.setup();
  this.loadRules();

}

Scope.prototype.onLineEnd   = function() { };
Scope.prototype.onLineStart = function() { };
Scope.prototype.onEnter     = function() { };
Scope.prototype.setup       = function() { };

Scope.prototype.parent = function() {

  return this._parent;

};

Scope.prototype.setParent = function(parent) {
  this._parent = parent;
};

Scope.prototype.loadRules = function() {

  var alias;

  for(alias in this.alias) {
    // create an alias, the function is reused.
    // so the char comming in can now be of multiple types.
    // e.g. both ' or ", or
    //      both - and > to detect ->
    if(this.alias.hasOwnProperty(alias)) {
      this.rules[alias] = this.rules[this.alias[alias]];
    }
  }

};

module.exports = Scope;

'use strict';

function Scope(lexer) {

  this.lexer = lexer;

  // default token endings
  // a scope can overwrite this.
  this.tokenEnding = [];

  // If this is set, the parser will throw an error
  // if there are more tokens, within the current scope.
  this.tokensExpected = undefined;

  // ttokens processed by this scope on the current line
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

  var rule, alias;

  // err, why is this stored in this.char ?
  // and not just use this.rules ?
  for(rule in this.rules) {
    // add rule and bind ourselfs
    if(this.rules.hasOwnProperty(rule)) {
      this.rules[rule] = this.rules[rule].bind(this);
    }
  }

  for(alias in this.alias) {
    // create an alias, the function is reused.
    // so the char comming in can now be of multiple types.
    // e.g. both ' or ", or
    //      both - and > to detect ->
    if(this.alias.hasOwnProperty(alias)) {
      this.rules[alias] = this.rules[this.alias[alias]].bind(this);
    }
  }

};

module.exports = Scope;

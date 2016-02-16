'use strict'

class Scope {
  constructor (lexer) {
    this.lexer = lexer

    // default token endings
    // a scope can overwrite this.
    // [] now means the scope doesn't have any token endings.
    // it will handle it by itself.
    this.tokenEnding = undefined

    /**
     * If this is set the parser will throw an error
     * when there are more tokens within the current scope.
     */
    this.tokensExpected = undefined

    /**
     * tokens processed by this scope on the current line
     * automatically reset on each line start
     */
    this.tokens = []

    /** check for escaped token endings */
    this.escape = false

    /**
     * Basic structure checking
     * if empty no structure checking is done.
     * If it is set the tokens _must_ match one of structures.
     */
    this.structure = []

    // this could be made generic for switchers.
    // switchers are only valid until the next char.
    this.rules = {}

    this.setup()
    this.loadRules()
  }

  /**
   * executed during each line end
   * regardless whether this scope is active.
   */
  onLineEnd () {}

  /**
   * executed during each line start
   * regardless whether this scope is active.
   */
  onLineStart () {}

  /**
   * Executes each time a scope is entered
   */
  onEnter () {}

  /**
   * Executes each time a token is found
   */
  onToken () {
    throw Error('onToken() method not implemented')
  }

  /**
   * Executed once during initialization
   */
  setup () {}

  /**
   * Get the parent scope of this scope
   * the scope we entered from
   */
  parent () {
    return this._parent
  }

  setParent (parent) {
    this._parent = parent
  }

  /**
   * For convenience it's possible to create an alias
   * For a scanner function within the scope.
   */
  loadRules () {
    for (const alias in this.alias) {
      // create an alias, the function is reused.
      // so the char comming in can now be of multiple types.
      // e.g. both ' or ", or
      //      both - and > to detect ->
      if (this.alias.hasOwnProperty(alias)) {
        this.rules[alias] = this.rules[this.alias[alias]]
      }
    }
  }
}

module.exports = Scope

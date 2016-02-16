/* eslint-env mocha */
/* global expect */
// import fs from 'fs'
// import path from 'path'
import Dyslexer from '../src/dyslexer'
import Scope from '../src/scope'

class RootScope extends Scope {
  constructor (lexer) {
    super(lexer)
    this.tokensExpected = Infinity;
  }
  onToken (token) {
    this.lexer.present('MY_TOKEN', token)
  }
}
class Scope1 extends Scope {}
class Scope2 extends Scope {}
class Scope3 extends Scope {
  constructor () {
    super()
    this.tokensExpected = 1
  }
}
/*
const contents = fs.readFileSync(
  path.resolve(__dirname, 'fixtures', 'barline.mod')
)
*/
describe('Dyslexer', () => {
  let lexer
  let rootScope
  beforeEach(() => {
    lexer = new Dyslexer('RootScope')
    rootScope = lexer.addScope(RootScope)
  })
  describe('Default State', () => {
    it('has a rootScope', () => {
      expect(lexer.rootScope).to.equal('RootScope')
    })
    it('rootScope is the currentScope', () => {
      expect(lexer.scope).to.equal('RootScope')
    })
    it('has an empty token cache', () => {
      expect(lexer.tokens.length).to.equal(0)
    })
    it('has an empty character list', () => {
      expect(lexer.chars.length).to.equal(0)
    })
  })
  describe('toScope()', () => {
    it('Can switch to different Scope', () => {
      lexer.addScope(Scope1)
      lexer.toScope('Scope1', 'a')
    })
    it('Emits a scopeSwitch event', (done) => {
      lexer.addScope(RootScope)
      lexer.addScope(Scope1)
      lexer.once('scopeSwitch', (ev) => {
        expect(ev).to.eql({from: 'RootScope', to: 'Scope1'})
        done()
      })
      lexer.toScope('Scope1', 'a')
    })
    it('Has tracked this scopeSwitch', () => {
      lexer.addScope(RootScope)
      lexer.addScope(Scope1)
      lexer.toScope('Scope1', 'a')
      expect(lexer.track.length).to.eql(1)
      expect(lexer.track[0]).to.eql('RootScope')
    })
    it('New scope has access to parent scope', () => {
      const scope1 = lexer.addScope(Scope1)
      lexer.toScope('Scope1', 'a')
      expect(scope1.parent()).to.equal(rootScope)
    })
    describe('back()', () => {
      it('Lexer can switch back to previous scope', () => {
        lexer.addScope(Scope1)
        lexer.toScope('Scope1', 'a')
        lexer.back()
        expect(lexer.scope).to.equal(RootScope.name)
      })
      it('Lexer can switch back to previous scope (many)', () => {
        lexer.addScope(Scope1)
        lexer.addScope(Scope2)
        lexer.addScope(Scope3)
        lexer.toScope('Scope1', 'a')
        lexer.toScope('Scope2', 'a')
        lexer.toScope('Scope3', 'a')
        lexer.back()
        expect(lexer.scope).to.equal(Scope2.name)
        lexer.back()
        expect(lexer.scope).to.equal(Scope1.name)
        lexer.back()
        expect(lexer.scope).to.equal(RootScope.name)
        lexer.toScope('Scope1', 'a')
        lexer.toScope('Scope2', 'a')
        lexer.toScope('Scope3', 'a')
        lexer.back()
        expect(lexer.scope).to.equal(Scope2.name)
        lexer.toScope('Scope2', 'a')
        lexer.toScope('Scope3', 'a')
        lexer.back()
        expect(lexer.scope).to.equal(Scope2.name)
        lexer.back()
        expect(lexer.scope).to.equal(Scope2.name)
        lexer.back()
        expect(lexer.scope).to.equal(Scope1.name)
        lexer.back()
        expect(lexer.scope).to.equal(RootScope.name)
        expect(lexer.back.bind(lexer)).to.throw(/cannot go back/)
      })
    })
  })
  describe('present()', () => {
    const expected = {
      name: 'MY_TOKEN',
      scope: 'RootScope',
      scopeChar: undefined,
      start: 0,
      end: 0,
      value: 'my_value'
    }
    it('Should be able to present a token', () => {
      lexer.present('MY_TOKEN', true)
    })
    it('Should remember lastToken', () => {
      lexer.present('MY_TOKEN', 'my_value')
      expect(lexer.lastToken).to.eql(expected)
    })
    it('Should have tracked the token', () => {
      lexer.present('MY_TOKEN', 'my_value')
      expect(lexer.tokens).to.eql([expected])
    })
    it('Should emit a token event', (done) => {
      lexer.once('token', (token) => {
        expect(token).to.eql(expected)
        done()
      })
      lexer.present('MY_TOKEN', 'my_value')
    })
    describe('The current scope', () => {
      it('Should have tracked the token', () => {
        lexer.present('MY_TOKEN', 'my_value')
        expect(lexer.level[lexer.scope].tokens.length).to.eql(1)
        expect(lexer.level[lexer.scope].tokens).to.eql([expected])
      })
    })
    describe('TokensExpected', () => {
      it('Jumps back if scope has reached tokensExpected', () => {
        lexer.addScope(Scope3)
        expect(lexer.scope).to.eql('RootScope')
        lexer.toScope('Scope3')
        expect(lexer.scope).to.eql('Scope3')
        lexer.present('MY_TOKEN', 'my_value')
        expect(lexer.scope).to.eql('RootScope')
      })
    })
  })
  describe('Lexing', () => {
    it('Should detect token', (done) => {
      const str = `MY_TOKEN`
      lexer.once('token', (token) => {
        expect(token).to.eql({
          name: 'MY_TOKEN',
          scope: 'RootScope',
          value: 'MY_TOKEN',
          scopeChar: undefined, // Rootscope nothing scoped yet
          start: 1,
          end: 'MY_TOKEN'.length
        })
        done()
      })
      lexer.start(str)
    })
  })
})

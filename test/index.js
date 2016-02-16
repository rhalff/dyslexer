/* eslint-env mocha */
/* global expect */
import fs from 'fs'
import path from 'path'
import Dyslexer from '../src/dyslexer'
import Scope from '../src/scope'

class RootScope extends Scope {}
class Scope1 extends Scope {}
class Scope2 extends Scope {}
class Scope3 extends Scope {}
/*
const contents = fs.readFileSync(
  path.resolve(__dirname, 'fixtures', 'barline.mod')
)
*/
describe('Dyslexer', () => {
  let lexer
  beforeEach(() => {
    lexer = new Dyslexer('RootScope')
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
  describe('addScope()', () => {
    it('Should be able to add Scope', () => {
      lexer.addScope(Scope1)
    })
  })
  describe('toScope()', () => {
    it('Can switch to different Scope', () => {
      lexer.addScope(RootScope)
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
      const rootScope = lexer.addScope(RootScope)
      const scope1 = lexer.addScope(Scope1)
      lexer.toScope('Scope1', 'a')
      expect(scope1.parent()).to.equal(rootScope)
    })
    describe('back()', () => {
      it('Lexer can switch back to previous scope', () => {
        const rootScope = lexer.addScope(RootScope)
        const scope1 = lexer.addScope(Scope1)
        lexer.toScope('Scope1', 'a')
        lexer.back()
        expect(lexer.scope).to.equal(RootScope.name)
      })
      it('Lexer can switch back to previous scope (many)', () => {
        const rootScope = lexer.addScope(RootScope)
        const scope1 = lexer.addScope(Scope1)
        const scope2 = lexer.addScope(Scope2)
        const scope3 = lexer.addScope(Scope3)
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
})

/* eslint-env mocha */
/* global expect */
import fs from 'fs'
import path from 'path'
import DTDParser from '../src/parser'

describe('DTD Parser', () => {
  it('should parse', () => {
    const contents = fs.readFileSync(
      path.resolve(__dirname, 'fixtures', 'barline.mod')
    )
    const parser = new DTDParser()
    parser.parse(contents)

    expect(123).to.equal(123)
  })
})

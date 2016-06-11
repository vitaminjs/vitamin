/* global it */
/* global describe */
/* global beforeEach */

var assert = require('chai').assert
var createError = require('../../src/errors').createError

describe("Custom Errors Unit Tests", function () {
  
  describe("Error creation", function () {
    
    it("creates a custom error", function () {
      var SomeError = createError("SomeError")
      var err = new SomeError("reason")
      
      assert.instanceOf(err, Error)
      assert.instanceOf(err, SomeError)
      assert.propertyVal(err, 'message', "reason")
    })
    
    it("creates a error with default message", function () {
      var SomeError = createError("SomeError", { message: "default msg" })
      var err1 = new SomeError()
      var err2 = new SomeError('another msg')
      
      assert.equal('default msg', err1.message)
      assert.equal('another msg', err2.message)
    })
    
  })
  
})
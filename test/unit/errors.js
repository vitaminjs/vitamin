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
    
  })
  
})
/* global it */
/* global describe */
/* global beforeEach */

var assert = require('chai').assert
var Model = require('../../src/model')

describe("Model Unit Tests", function() {

  describe("factory()", function() {

    it("returns an instance of the model constructor", function() {
      assert.instanceOf(Model.factory(), Model)
      assert.instanceOf(Model.factory({ name: "foo" }), Model)
    })

  })

  describe("extend()", function() {

    it("returns a sub model class", function() {
      var A = Model.extend()
      var B = A.extend()
      var C = B.extend()

      assert.instanceOf(A.prototype, Model)
      assert.instanceOf(B.prototype, Model)
      assert.instanceOf(C.prototype, Model)
    })

    it("adds instance properties", function() {
      var A = Model.extend({
        prop1: "foo",
        method1: function() {}
      })
      var B = A.extend({
        method2: function() {}
      })

      assert.property(A.prototype, 'prop1')
      assert.property(A.prototype, 'method1')
      assert.property(B.prototype, 'method2')
    })

  })

  describe("use()", function() {

    var A

    beforeEach(function() {
      A = Model.extend()
    })

    it("accepts a function as a plugin", function() {
      var pluginFn = function (Model) {
        assert.equal(Model, A)
      }

      A.use(pluginFn)
    })

    it("accepts an object as a plugin", function() {
      var pluginObj = {
        install: function (Model) {
          assert.equal(Model, A)
        }
      }

      A.use(pluginObj)
    })

    it("accepts a plugin and additional parameters", function() {
      var pluginFn = function (Model, param) {
        assert.equal(Model, A)
        assert.equal(param, "foo")
      }

      A.use(pluginFn, "foo")
    })

    it("should not install the same plugin twice", function() {
      var called = 0
      var pluginFn = function (Model) {
        assert.equal(++called, 1)
      }

      A.use(pluginFn)
      A.use(pluginFn)
    })

  })

  describe("Data manipulation", function() {

    var model

    beforeEach(function() {
      model = Model.factory().setData({ name: "foo", age: 35 }, true)
    })

    it("sets data properly", function() {
      assert.ok(model.has('name'))
      assert.ok(model.has('age'))
      assert.equal(model.get('age'), 35)
      assert.equal(model.get('name'), "foo")
      
      model.set('age', 40)
      assert.equal(model.get('age'), 40)
    })
    
    it("manages dirty attributes", function() {
      assert.isFalse(model.isDirty())
      
      model.set('name', "bar")
      
      assert.ok(model.isDirty())
      assert.equal(model.getOriginal('name'), 'foo')
      assert.propertyVal(model.getDirty(), 'name', 'bar')
    })
    
  })

})
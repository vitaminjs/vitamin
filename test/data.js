/* global it, describe, beforeEach */

var assert = require('chai').assert;
var _ = require('underscore');
var Vitamin = require('../src/vitamin');

describe("Vitamin data API", function() {
  
  var model
  
  beforeEach(function() {
    model = Vitamin.factory()
  })
  
  describe("Vitamin#set", function() {
    
    it("should set one attribute", function() {
      model.set('foo', "bar")
      
      assert.propertyVal(model.$data, 'foo', 'bar')
    })
    
    it("should set a hash of attributes", function() {
      model.set({ 'name': "Foo", 'email': "bar@baz" })
      
      assert.propertyVal(model.$data, 'name', "Foo")
      assert.lengthOf(_.keys(model.$data), 2)
    })
    
    it("should create attribute proxies", function() {
      var attr = 'foo'
      
      model.set(attr, "bar")
      
      assert.property(model, attr)
      assert.equal(model[attr], model.$data[attr])
    })
    
    it("should trigger change event", function() {
      var times = 0;
      var model = Vitamin.factory(null, {
        'events': {
          'change:foo': function(val) { assert.equal(++times, 1) },
          'change': function() { assert.equal(++times, 2) }
        }
      })
      
      model.set('foo', "bar")
    })
    
    it("should not set an invalid attribute value", function() {
      var model = Vitamin.factory(null, {
        'schema': { 'age': { type: Number, default: 33 } }
      })
      
      model.set("age", "NaN")
      
      assert.equal(model.age, 33)
    })
    
  })
  
  describe("Vitamin#get", function() {
    
    it("should return the same value that given", function() {
      var attr = 'foo'
      
      model.set(attr, "bar")
      
      assert.equal(model.get(attr), 'bar')
      assert.equal(model[attr], model.get(attr))
    })
    
  })
  
  describe("Vitamin#hasChanged", function() {
    
    it("should return true if the model has changed", function() {
      model.set('foo', "bar")
      
      assert.isTrue(model.hasChanged())
    })
    
    it("should return true if a specific attribute has changed", function() {
      var attr = 'foo'
      
      model.set(attr, "bar")
      
      assert.isTrue(model.hasChanged(attr))
    })
    
  })
  
  describe("Vitamin#clear", function() {
    
    it("sould assert true when the model was cleared", function() {
      model.set({ 'name': 'John', 'age': 33 }).clear()
      
      assert.isTrue(model.hasChanged())
      assert.isTrue(model.hasChanged('name'))
    })
    
  })
  
})
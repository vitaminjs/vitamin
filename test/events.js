/* global it, describe, beforeEach */

var assert = require('chai').assert;
var _ = require('underscore');
var Vitamin = require('../vitamin');

describe("Vitamin events API", function() {
  
  var model
  var callback = function(tag) { assert.isString(tag) }
  var Model = Vitamin.extend()
  
  beforeEach(function() {
    model = new Model(null, {
      'events': {
          'an:event': callback,
          'no:args:event': function() { assert.equal(arguments.length, 0) }
        }
    })
  })
  
  describe("Vitamin#emit", function() {
    
    it("should trigger an event with arguments", function() {
      model.emit('an:event', "a tag")
    })
    
    it("should trigger an event without arguments", function() {
      model.emit('no:args:event')
    })
    
  })
  
  describe("Vitamin#on", function() {
    
    it("should register an event", function() {
      model.on('event', _.noop)
      
      assert.isArray(model.$options.channel.events['event'])
      assert.lengthOf(model.$options.channel.events['event'], 1)
    })
    
  })
  
  describe("Vitamin#once", function() {
    
    it("should trigger an event once", function() {
      var model = new Model()
      
      model.once('once:event', _.noop)
      model.emit('once:event', "a tag")
      
      assert.lengthOf(model.$options.channel.events['once:event'], 0)
    })
    
  })
  
  describe("Vitamin#off", function() {
    
    it("should remove all events and handlers", function() {
      model.off()
      
      assert.lengthOf(_.keys(model.$options.channel.events), 0)
    })
    
    it("should remove all event handlers", function() {
      model.off('an:event')
      
      assert.isNull(model.$options.channel.events['an:event'])
    })
    
    it("should remove a specific handler", function() {
      model.off('an:event', callback)
      
      assert.lengthOf(model.$options.channel.events['an:event'], 0)
    })
    
  })
  
})
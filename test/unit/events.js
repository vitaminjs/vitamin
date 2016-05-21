/* global it */
/* global describe */
/* global beforeEach */

var noop = function () {}
var assert = require('chai').assert
var EventEmitter = require('../../src/events')

describe("Events Unit Tests", function () {
  
  var events
  
  describe("getListeners()", function () {
    
    beforeEach(function () {
      events = new EventEmitter()
    })
    
    it("returns all listeners of the given event", function () {
      var handlers = events.getListeners('event')
      
      assert.isArray(handlers)
      assert.lengthOf(handlers, 0)
    })
    
  })
  
  describe("on()", function () {
    
    beforeEach(function () {
      events = new EventEmitter()
    })
    
    it("stores handlers by event name", function () {
      events.on('event', function() {})
      
      assert.property(events.listeners, 'event')
      assert.lengthOf(events.listeners['event'], 1)
      assert.isFunction(events.listeners['event'][0])
    })
    
  })
  
  describe("off()", function () {
    
    beforeEach(function () {
      events = new EventEmitter()
    })
    
    it("removes a specific listener", function () {
      var someHandler = noop
      
      events.on("event", someHandler)
      assert.lengthOf(events.listeners['event'], 1)
      
      events.off('event', someHandler)
      assert.lengthOf(events.listeners['event'], 0)
    })
    
    it("removes all handlers of a specified event", function () {
      events.listeners['event'] = [noop, noop]
      assert.lengthOf(events.listeners['event'], 2)
      
      events.off('event')
      assert.lengthOf(events.listeners['event'], 0)
    })
    
    it("removes all defined listeners for all events", function () {
      events.listeners['event'] = [noop, noop, noop]
      assert.lengthOf(events.listeners['event'], 3)
      
      events.off()
      assert.lengthOf(Object.keys(events.listeners), 0)
    })
    
  })
  
  describe("emit()", function () {
    
    var counter
    
    beforeEach(function () {
      counter = 0
      events = new EventEmitter
      
      events
        .on('event', function () {
          assert.equal(++counter, 1)
        })
        .on('event', function () {
          assert.equal(++counter, 2)
        })
    })
    
    it("triggers some event by name", function () {
      events.emit('event').then(function () {
        assert.equal(++counter, 3)
      })
    })
    
    it("triggers events with parameters passed in", function () {
      events.on('event', function (arg) {
        counter = 0
        assert.equal(arg, 'foo')
      })
      
      events.emit('event', "foo").then(function() {
        assert.equal(counter, 0)
      })
    })
    
    it("fails if an error is thrown", function() {
      events.on('event', function () {
        throw new Error("Fail !")
      })
      
      events.emit('event').catch(function(err) {
        assert.instanceOf(err, Error)
        assert.equal(err.message, "Fail !")
      })
    })
    
    it.skip("! rejected promise didn't stop the other promises", function (done) {
      events.on('event', function (val) {
        setTimeout(function() {
          counter = val
        }, 30)
      })
      events.on('event', function () {
        throw new Error
      })
      
      events.emit('event', 20).catch(noop)
      setTimeout(function() {
        assert.equal(counter, 2)
        done()
      }, 100)
    })
    
  })
  
})
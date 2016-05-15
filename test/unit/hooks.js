/* global it */
/* global describe */
/* global beforeEach */

var assert = require('chai').assert
var Hooks = require('../../src/hooks')

describe("Hooks Unit Tests", function() {
  
  describe("pre hooks", function() {
    
    var hooks
    
    beforeEach(function() {
      hooks = new Hooks({})
    })
    
    it("runs without any hooks specified", function(done) {
      hooks
        .callPres('test')
        .then(function() {
          assert.ok(true)
          done()
        })
    })
    
    it("executes with parameters passed in", function() {
      hooks.pre('arg', function(next, msg) {
        assert.equal(msg, "foo")
        next()
      })
      
      hooks.callPres('arg', null, ["foo"])
    })
    
    it("attaches properly context to pre hooks", function(done) {
      var man = { name: "foo", age: 35 }
      
      hooks.pre('set', function(next) {
        this.name = "bar"
        next()
      })
      
      hooks.pre('set', function(next) {
        this.age = 23
        next()
      })
      
      hooks
        .callPres('set', man)
        .then(function() {
          assert.equal(man.name, "bar")
          assert.equal(man.age, 23)
        })
        .finally(done)
    })
    
    it("runs synchronous hooks", function(done) {
      var count = 0
      
      hooks.pre('inc', function(next) {
        ++count && next()
      })
      
      hooks.pre('inc', function(next) {
        ++count && next()
      })
      
      hooks
        .callPres('inc')
        .then(function() {
          assert.equal(2, count)
          done()
        })
    })
    
    it('runs async pre hooks', function(done) {
      var ctx = {}

      hooks.pre('set', function(next, done) {
        setTimeout(function() {
          ctx.first = true
          done()
        }, 7)
        next()
      }, true)
        
      hooks.pre('set', function(done) {
        this.second = true
        done()
      })
      
      hooks.pre('set', function(next, done) {
        var o = this
        
        next()
        setTimeout(function() {
          o.third = true
          done()
        }, 3)
      }, true)
      
      hooks
        .callPres('set', ctx)
        .then(function() {
          assert.ok(ctx.first)
          assert.ok(ctx.second)
          assert.ok(ctx.third)
          done()
        })
    })
    
    it("handles errors with multiple pres", function(done) {
      var execed = {}
      
      hooks.pre('sync', function(next) {
        execed.first = true
        next()
      })
      
      hooks.pre('sync', function(next) {
        execed.second = true
        next("Error")
      })
      
      hooks.pre('sync', function(next) {
        execed.third = true
        next()
      })
      
      hooks
        .callPres('sync', null)
        .catch(function(err) {
          assert.equal(err, "Error")
          assert.ok(execed.first)
          assert.ok(execed.second)
          assert.lengthOf(Object.keys(execed), 2)
          done()
        })
    })
    
    it("handles async errors", function(done) {
      var execed = { first: false, second: false }
      
      hooks.pre('async', function(next, done) {
        setTimeout(function() {
          execed.first = true
          done("Error")
        }, 8)
        next()
        
      }, true)
      
      hooks.pre('async', function(next, done) {
        setTimeout(function() {
          execed.second = true
          done()
        }, 5)
        next()
        
      }, true)
      
      hooks.pre('async', function(next, done) {
        setTimeout(function() {
          execed.third = true
          done()
        }, 12)
        next()
        
      }, true)
      
      hooks
        .callPres('async', null)
        .catch(function(err) {
          assert.equal(err, "Error")
          assert.ok(execed.first)
          assert.ok(execed.second)
          assert.isUndefined(execed.third)
          done()
        })
    })
    
  })


  describe("post hooks", function() {
    
    var hooks
    
    beforeEach(function() {
      hooks = new Hooks({})
    })
    
    it("runs without any hooks specified", function() {
      hooks
        .callPosts('test', null)
        .then(function() {
          assert.ok(true)
        })
    })
    
    it("executes with parameters passed in", function(done) {
      hooks.post('arg', function(one, two) {
        assert.equal(one, 1)
        assert.equal(two, 2)
      })
      
      hooks.callPosts('arg', null, [1, 2]).finally(done)
    })
    
    it("runs synchronous hooks", function(done) {
      var count = 0
      
      hooks.post('sync', function(bool) {
        assert.equal(count, 0)
        assert.isFalse(bool)
        count++
      })
      
      hooks.post('sync', function(bool) {
        assert.equal(count, 1)
        assert.isFalse(bool)
        count++
      })
      
      hooks
        .callPosts('sync', null, [false])
        .then(function() {
          assert.equal(count, 2)
          done()
        })
    })
    
  })


  describe("clone hooks", function() {
    
    it("clones correctly its callbacks", function() {
      var h1 = new Hooks({})
      
      h1.pres['test'] = ['baz', 'foo']
      h1.posts['test'] = ['bar']
      
      var h2 = h1.clone({})
      
      assert.lengthOf(h2.pres['test'], 2)
      assert.equal(h2.pres['test'][1], 'foo')
      
      assert.lengthOf(h2.posts['test'], 1)
      assert.equal(h2.posts['test'][0], "bar")
    })
    
  })
  
})
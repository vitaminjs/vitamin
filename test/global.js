/* global it, describe, beforeEach */

var assert = require('chai').assert;
var _ = require('underscore');
var Vitamin = require('../vitamin');

describe("Vitamin global API", function() {
  
  var Model, SubModel
  
  beforeEach(function() {
    Model = Vitamin.extend()
    
    SubModel = Model.extend({
      foo: function() {}
    }, {
      pk: '_id',
      schema: {
        'name': String
      }
    })
  })
  
  describe("Vitamin.extend", function() {
    
    it("should have the same members", function() {
      assert.sameDeepMembers(_.keys(Model), _.keys(Vitamin))
    })
    
    it("should be an instance of Vitamin", function() {
      assert.instanceOf(new Model, Vitamin)
      assert.instanceOf(new SubModel, Vitamin)
    })
    
  })
  
  describe("Vitamin.options", function() {
    
    it("should have static property `options`", function() {
      assert.property(Model, 'options')
    })
    
    it("should have schema descriptor defined", function() {
      assert.deepProperty(SubModel, 'options.schema.name')
    })
    
  })
  
  describe("Vitamin.use", function() {
    
    function aPlugin(Klass) {
      Klass.static = "value";
      
      Klass.prototype.method = _.noop
    }
    
    it("should add properties to the model", function() {
      SubModel.use(aPlugin)
      
      assert.property(SubModel.prototype, 'method')
      assert.property(SubModel, 'static')
    })
    
  })
  
  describe("Vitamin.useOnce", function() {
    
    var times = 0;
    var aPlugin = {
      install: function(Klass) {
        Klass.property = "value";
        
        Klass.prototype.method = _.noop
        
        times++
      }
    }
    
    it("should be used only once", function() {
      Model.useOnce(aPlugin)
      Model.useOnce(aPlugin)
      
      assert.equal(times, 1)
    })
    
  })
  
  describe("Vitamin#$options", function() {
    
    var model1, model2
    
    beforeEach(function() {
      model1 = new Model()
      model2 = new SubModel(null, { bar: "baz" })
    })
    
    it("should have `$options` property defined", function() {
      assert.property(model1, '$options')
    })
    
    it("should have custom options defined", function() {
      assert.deepProperty(model2, '$options.bar')
      assert.notDeepProperty(SubModel, 'options.bar')
      
      assert.deepPropertyVal(model2, '$options.pk', '_id')
    })
    
  })
  
})
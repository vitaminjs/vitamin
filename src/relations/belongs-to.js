
var Relation = require('./base'),
    Model = require('../model'),
    _ = require('underscore')

var BelongsTo = Relation.extend({
  
  /**
   * BelongsTo relation constructor
   * 
   * @param {Model} parent
   * @param {Model} related
   * @param {String} fk parent model key
   * @param {String} pk related model key
   * @constructor
   */
  constructor: function BelongsTo(parent, related, fk, pk) {
    Relation.apply(this, [parent, related])
    this.localKey = fk
    this.otherKey = pk
  },
  
  /**
   * Associate the model instance to the current model
   * 
   * @param {Model|any} model
   * @return Model instance
   */
  associate: function associate(model) {
    var isModel = model instanceof Model,
        id = isModel ? model.get(this.otherKey) : model
    
    return this.parent.set(this.localKey, id)
  },
  
  /**
   * Dissociate the parent model from the current model
   * 
   * @return Model instance
   */
  dissociate: function dissociate() {
    return this.parent.set(this.localKey, null)
  }
  
})

// use mixin
_.defaults(BelongsTo.prototype, require('./mixins/one-to-one'))

module.exports = BelongsTo
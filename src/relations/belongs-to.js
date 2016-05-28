
var Relation = require('./base'),
    Model = require('../model'),
    _ = require('underscore')

module.exports = Relation.extend({
  
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
  },
  
  /**
   * Load the related model from the database
   * 
   * @return Promise instance
   * @private
   */
  _load: function _load() {
    return this.query.fetch()
  },
  
  /**
   * Build model dictionary keyed by the given key
   * 
   * @param {Array} models
   * @param {String} key
   * @return object
   * @private
   */
  _buildDictionary: function _buildDictionary(models, key) {
    var dict = {}
    
    _.each(models, function (mdl) {
      // transform numeric keys to string keys for good matching
      dict[String(mdl.get(key))] = mdl
    })
    
    return dict
  },
  
  /**
   * Get the default value for the relationship
   * 
   * @return any
   */
  _getRelatedDefaultValue: function _getRelatedDefaultValue() {
    return null
  }
  
})

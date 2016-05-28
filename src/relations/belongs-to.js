
var Relation = require('./base'),
    Model = require('../model'),
    _ = require('underscore')

module.exports = Relation.extend({
  
  /**
   * BelongsTo relation constructor
   * 
   * @param {Model} parent
   * @param {Query} query
   * @param {String} fk foreign key
   * @param {String} pk other key
   * @constructor
   */
  constructor: function BelongsTo(parent, query, fk, pk) {
    Relation.apply(this, [parent, query])
    this.foreignKey = fk
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
    
    return this.parent.set(this.foreignKey, id)
  },
  
  /**
   * Dissociate the parent model from the current model
   * 
   * @return Model instance
   */
  dissociate: function dissociate() {
    return this.parent.set(this.foreignKey, null)
  },
  
  /**
   * Apply eager relation query constraints
   * 
   * @param {Array} models
   * @private
   */
  _applyEagerConstraints: function _applyEagerConstraints(models) {
    this.query.where(this.otherKey, "$in", this._getKeys(models, this.foreignKey))
  },
  
  /**
   * Apply relation query constraints
   * 
   * @private
   */
  _applyConstraints: function _applyConstraints() {
    this.query.where(this.otherKey, this.parent.get(this.foreignKey))
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
   * Populate the parent models with the eagerly loaded results
   * 
   * @param {String} name
   * @param {Array} models
   * @param {Array} results
   * @private
   */
  _populate: function _populate(name, models, results) {
    var foreign = this.foreignKey, other = this.otherKey,
        dictionary = this._buildDictionary(results, other)
    
    for ( var owner in models ) {
      var key = String(owner.get(foreign))
      
      owner.rel(name, dictionary[key] || null)
    }
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
  }
  
})

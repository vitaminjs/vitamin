
var Relation = require('./base'),
    Model = require('../model')

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
   * Apply relation query constraints
   * 
   * @param {Array} models
   * @private
   */
  _applyConstraints: function _applyConstraints(models) {
    this.query.where(this.otherKey, this._getKeys(models, this.foreignKey))
  },
  
  /**
   * Load the related model from the database
   * 
   * @return Promise instance
   * @private
   */
  _load: function _load() {
    return this.query.fetch()
  }
  
})

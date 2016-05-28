
var Relation = require('./base')

module.exports = Relation.extend({
  
  /**
   * HasOneOrMany relation constructor
   * 
   * @param {Model} parent
   * @param {Model} related
   * @param {String} fk
   * @param {String} pk
   * @constructor
   */
  constructor: function HasOneOrMany(parent, related, fk, pk) {
    Relation.apply(this, [parent, related])
    this.foreignKey = fk
    this.localKey = pk
  },
  
  /**
   * Create a new instance of the related model
   * 
   * @param {Object} attrs
   * @param {Function} cb (optional)
   * @return a promise
   */
  create: function create(attrs, cb) {
    return this
      .related
      .newInstance(attrs)
      .set(this.foreignKey, this.parent.get(this.localKey))
      .save(cb)
  },
  
  /**
   * Attach a model instance to the parent model
   * 
   * @param {Model} model
   * @param {Function} cb (optional)
   * @return a promise
   */
  save: function save(model, cb) {
    model.set(this.foreignKey, this.parent.get(this.localKey))
    return model.save(cb)
  },
  
  /**
   * Apply eager relation query constraints
   * 
   * @param {Array}
   * @private
   */
  _applyEagerConstraints: function _applyEagerConstraints(models) {
    this.query.where(this.foreignKey, "$in", this.getKeys(models, this.localKey))
  },
  
  /**
   * Apply relation query constraints
   * 
   * @private
   */
  _applyConstraints: function _applyConstraints() {
    this.query.where(this.foreignKey, this.parent.get(this.localKey))
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
    var foreign = this.foreignKey, local = this.localKey,
        dictionary = this._buildDictionary(results, foreign)
    
    for ( var owner in models ) {
      var key = String(owner.get(local))
      
      owner.rel(name, dictionary[key] || this._getRelatedDefaultValue())
    }
  }
  
})

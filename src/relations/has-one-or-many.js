
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
   * Apply query constraints
   * 
   * @param {Array}
   */
  applyConstraints: function applyConstraints(models) {
    this.query.where(this.foreignKey, this.getKeys(models, this.localKey))
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
  }
  
})

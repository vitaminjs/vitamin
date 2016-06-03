
var Relation = require('./base')

module.exports = Relation.extend({
  
  /**
   * HasOneOrMany relation constructor
   * 
   * @param {Model} parent
   * @param {Model} related
   * @param {String} fk related model key
   * @param {String} pk parent model key
   * @constructor
   */
  constructor: function HasOneOrMany(parent, related, fk, pk) {
    Relation.apply(this, [parent, related])
    this.otherKey = fk
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
      .set(this.otherKey, this.parent.get(this.localKey))
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
    model.set(this.otherKey, this.parent.get(this.localKey))
    return model.save(cb)
  },
  
})

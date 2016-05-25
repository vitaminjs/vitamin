
var Relation = require('./base-relation')

module.exports = Relation.extend({
  
  /**
   * HasOne relation constructor
   * 
   * @param {Model} parent
   * @param {Query} query
   * @param {String} fk foreign key
   * @param {String} pk local key
   * @constructor
   */
  constructor: function HasOne(parent, query, fk, pk) {
    Relation.apply(this, [parent, query])
    
    this.foreignKey = fk
    this.localKey = pk
  },
  
  /**
   * Load the related model from the database
   * 
   * @param {Function} cb (optional)
   * @return {Promise}
   */
  load: function load(cb) {
    this.applyConstraints([this.parent])
    return this.query.fetch(cb)
  },
  
  /**
   * Apply relation query constraints
   * 
   * @param {Array} models
   */
  applyConstraints: function applyConstraints(models) {
    this.query.where(this.foreignKey, this.getKeys(models, this.localKey))
  }
  
})


var Relation = require('./base')

module.exports = Relation.extend({
  
  /**
   * @param {Model} parent
   * @param {Query} query
   * @param {String} fk
   * @param {String} pk
   * @constructor
   */
  constructor: function(parent, query, fk, pk) {
    Relation.apply(this, [parent, query]
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
  }
  
})

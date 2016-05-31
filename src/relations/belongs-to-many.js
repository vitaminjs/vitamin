
var _ = require('underscore'),
    Relation = require('./base')

var BelongsToMany = Relation.extend({
  
  /**
   * HasAndBelongsToMany relationship constructor
   * 
   * @param {Model} parent
   * @param {Model} related
   * @param {String} table
   * @param {String} fk parent model key
   * @param {String} pk related model key
   */
  constructor: function HasAndBelongsToMany(parent, related, table, fk, pk) {
    Relation.apply(this, [parent, related])
    this.pivot = table
    this.localKey = fk
    this.otherKey = pk
  },
  
  /**
   * Apply constraints on the relation query
   * 
   * @private
   */
  _applyConstraints: function _applyConstraints() {
    var other = this.related.getKeyName()
    
    this.query.whereIn(other, function (query) {
      return query
        .select(this.otherKey)
        .distinct()
        .from(this.pivot)
        .where(this.localKey, this.parent.getId())
    }.bind(this))
  },
  
  /**
   * Apply eager constraints on the relation query
   * 
   * @param {Array} models
   * @private
   */
  _applyEagerConstraints: function _applyEagerConstraints(models) {
    var local = this.parent.getKeyName(),
        other = this.related.getKeyName()
    
    this.query.whereIn(other, function (query) {
      return query
        .select(this.otherKey)
        .distinct()
        .from(this.pivot)
        .whereIn(this.localKey, this._getKeys(models, local))
    }.bind(this))
  }
  
})

// use mixin
_.assign(BelongsToMany.prototype, require('./mixins/one-to-many'))

module.exports = BelongsToMany

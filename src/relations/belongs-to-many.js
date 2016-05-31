
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
    var query = this.query.clone(),
        other = this.related.getKeyName()
    
    this.query.whereIn(
      other, 
      query
        .distinct()
        .from(this.pivot)
        .select(this.otherKey)
        .where(this.localKey, this.parent.getId())
    )
  },
  
  /**
   * Apply eager constraints on the relation query
   * 
   * @param {Array} models
   * @private
   */
  _applyEagerConstraints: function _applyEagerConstraints(models) {
    var query = this.query.clone(),
        local = this.parent.getKeyName(),
        other = this.related.getKeyName()
    
    this.query.whereIn(
      other,
      query
        .distinct()
        .from(this.pivot)
        .select(this.otherKey)
        .whereIn(this.localKey, this._getKeys(models, local))
    )
  }
  
})

// use mixin
_.assign(BelongsToMany.prototype, require('./mixins/one-to-many'))

module.exports = BelongsToMany

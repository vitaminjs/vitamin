
var _ = require('underscore'),
    Model = require('../model'),
    Relation = require('./base')

var BelongsToMany = Relation.extend({
  
  /**
   * BelongsToMany relationship constructor
   * 
   * @param {Model} parent
   * @param {Model} related
   * @param {String} fk parent model key
   * @param {String} pk related model key
   * @param {String|Model} pivot
   */
  constructor: function BelongsToMany(parent, related, fk, pk, pivot) {
    Relation.apply(this, [parent, related])
    this.withPivot(pivot || "pivot")
    this.localKey = fk
    this.otherKey = pk
  },
  
  /**
   * Set the pivot model for the relationship
   * 
   * @param {String|Model} pivot source nme or model constructor
   * @return BelongsToMany instance
   */
  withPivot: function withPivot(pivot) {
    if ( _.isString(pivot) ) {
      pivot = Model.extend({
        getSourceName: function () {
          return String(pivot)
        }
      })
    }
    
    this.pivot = new pivot
    return this
  },
  
  /**
   * Attach a model the the parent
   * 
   * @param {Model|any} id
   * @param {Function} cb
   * @return Promise instance
   */
  attach: function attach(id, cb) {
    var pivot = this.pivot.newInstance()
    
    // set pivot model properties 
    pivot.set(this.localKey, this.parent.getId())
    pivot.set(this.otherKey, ( id instanceof Model ) ? id.getId() : id)
    
    return pivot.save(cb)
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
        .select(this.otherKey)
        .from(this.pivot.getSourceName())
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
        .select(this.otherKey)
        .from(this.pivot.getSourceName())
        .whereIn(this.localKey, this._getKeys(models, local))
    )
  }
  
})

// use mixin
_.assign(BelongsToMany.prototype, require('./mixins/one-to-many'))

module.exports = BelongsToMany

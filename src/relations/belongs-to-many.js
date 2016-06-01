
var _ = require('underscore'),
    Model = require('../model'),
    Relation = require('./base')

var BelongsToMany = Relation.extend({
  
  /**
   * BelongsToMany relationship constructor
   * 
   * @param {Model} parent model of the relationship
   * @param {Model} related model
   * @param {String} pivot table or collection name
   * @param {String} rk related model key
   * @param {String} pk parent model key
   */
  constructor: function BelongsToMany(parent, related, pivot, rk, pk) {
    Relation.apply(this, [parent, related])
    
    // use a default pivot model
    if ( pivot ) {
      pivot = Model.extend({
        getSourceName: function () {
          return String(pivot)
        }
      })
      
      this.through(pivot, rk, pk)
    }
  },
  
  /**
   * Use a custom pivot model for the relationship
   * 
   * @param {Model} model constructor
   * @param {String} rk related model key
   * @param {String} pk parent model key
   * @return BelongsToMany instance
   */
  through: function through(model, rk, pk) {
    this.pivot = model.factory()
    this.localKey = pk
    this.otherKey = rk
    
    return this
  },
  
  /**
   * Attach a model the the parent
   * 
   * @param {Model|any} id
   * @param {Object} attrs
   * @param {Function} cb
   * @return Promise instance
   */
  attach: function attach(id, attrs, cb) {
    var pivot = this.pivot.newInstance(attrs)
    
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

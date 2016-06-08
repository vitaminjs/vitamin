
var _ = require('underscore'),
    Model = require('../model'),
    Relation = require('./base'),
    Promise = require('bluebird')

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
    
    this.pivotColumns = []
    
    // use a default pivot model
    if ( pivot ) {
      pivot = Model.extend({
        $table: String(pivot)
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
   * Add the pivot table columns to fetch
   * 
   * @param {String|Array} field
   * @return BelongsToMany instance
   */
  withPivot: function withPivot(field) {
    if (! _.isArray(field) ) field = _.toArray(arguments)
    
    this.pivotColumns = this.pivotColumns(field)
    return this
  },
  
  /**
   * Attach a model the the parent
   * 
   * @param {Any} id
   * @param {Function} cb
   * @return Promise instance
   */
  attach: function attach(id, cb) {
    if ( _.isArray(id) ) return this.attachMany(id, cb)
    
    var pivot = this.pivot.newInstance()
    
    // set pivot model properties
    pivot.set(this.localKey, this.parent.getId())
    pivot.set(this.otherKey, ( id instanceof Model ) ? id.getId() : id)
    
    return pivot.save(cb)
  },
  
  /**
   * Attach many models to the parent
   * 
   * @param {Array} ids
   * @param {Function} cb (optional)
   * @return Promise instance
   */
  attachMany: function attachMany(ids, cb) {
    return Promise
      .bind(this, ids)
      .map(this.attach)
      .nodeify(cb)
  },
  
  /**
   * Detach one or many models from the parent
   * 
   * @param {Any} ids
   * @param {Function} cb (optional)
   * @return Promise instance
   */
  detach: function detach(ids, cb) {
    var query = this._newPivotQuery()
    
    // detach all related models
    if ( _.isFunction(ids) ) {
      cb = ids
      ids = []
    }
    
    // in case it is a model instance
    if ( ids instanceof Model ) ids = ids.getId()
    
    if (! _.isArray(ids) ) ids = [ids]
    
    if ( ids.length > 0 ) query.whereIn(this.otherKey, ids)
    
    return Promise.resolve(query.destroy()).nodeify(cb)
  },
  
  /**
   * Apply constraints on the relation query
   * 
   * @private
   */
  _applyConstraints: function _applyConstraints() {
    this._setJoin()
    this.query.where(this._getForeignKey(), this.parent.getId())
  },
  
  /**
   * Apply eager constraints on the relation query
   * 
   * @param {Array} models
   * @private
   */
  _applyEagerConstraints: function _applyEagerConstraints(models) {
    this._setJoin()
    this.query.whereIn(this._getForeignKey(), this._getKeys(models))
  },
  
  /**
   * Set the join clause for the relation query
   * 
   * @private
   */
  _setJoin: function _setJoin() {
    var pivotTable = this.pivot.getTableName(),
        modelTable = this.related.getTableName(),
        pivotColumn = pivotTable + '.' + this.otherKey,
        modelColumn = modelTable + '.' + this.related.getKeyName(),
        columns = [this.localKey, this.otherKey].concat(this.pivotColumns)
    
    // add an alias to pivot columns
    columns = _.map(columns, function (col) {
      return (col + ' as pivot_' + col)
    })
    
    // set query clauses
    this.query.select([modelTable + '.*'].concat(columns))
    this.query.join(pivotTable, modelColumn, pivotColumn)
  },
  
  /**
   * Create a new pivot query
   * 
   * @return Query instance
   * @private
   */
  _newPivotQuery: function _newPivotQuery() {
    var query = this.pivot.newQuery()
    
    return query.where(this.localKey, this.parent.getId())
  },
  
  /**
   * Get the fully qualified foreign key for the relation
   * 
   * @return String
   * @private
   */
  _getForeignKey: function _getForeignKey() {
    return this.pivot.getTableName() + '.' + this.localKey
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
    var dictionary = this._buildDictionary(results, this.localKey)
    
    _.each(models, function (owner) {
      var key = String(owner.getId())
      
      owner.related(name, dictionary[key] || this._getRelatedDefaultValue())
    }, this)
  },
  
  /**
   * Build a model dictionary keyed by the given key
   * 
   * @param {Array} models
   * @param {String} attr
   * @private
   */
  _buildDictionary: function _buildDictionary(models, attr) {
    var dict = {}
    
    _.each(models, function (mdl) {
      var _key = String(mdl.get('pivot_' + attr))
      
      if (! _.has(dict, _key) ) dict[_key] = []
      
      // transform numeric keys to string keys for good matching
      dict[_key].push(mdl)
      
      // inject the pivot model
      mdl.related('pivot', this._newPivotFromRelated(mdl))
    }, this)
    
    return dict
  },
  
  /**
   * Get and clean pivot attributes from a model
   * 
   * @return Model instance
   * @private
   */
  _newPivotFromRelated: function _newPivotFromRelated(model) {
    var data = {}
    
    _.each(model.getData(), function (value, key) {
      if ( key.indexOf('pivot_') === 0 ) {
        data[key.substring(6)] = value
        delete model.$data[key]
      }
    })
    
    return this.pivot.newInstance().setData(data, true)
  }
  
})

// use mixin
_.defaults(BelongsToMany.prototype, require('./mixins/one-to-many'))

module.exports = BelongsToMany

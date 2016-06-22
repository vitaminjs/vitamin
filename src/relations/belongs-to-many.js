
var _ = require('underscore'),
    Model = require('../model'),
    Relation = require('./base'),
    Promise = require('bluebird'),
    Collection = require('../collection')

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
    
    this.localKey = this.parent.getKeyName()
    
    // use a default pivot model
    if ( pivot ) {
      var pivotModel = Model.extend({
        $table: String(pivot)
      })
      
      this.through(pivotModel, rk, pk)
    }
  },
  
  /**
   * Use a custom pivot model for the relationship
   * 
   * @param {Model} model constructor
   * @param {String} rk related model foreign key
   * @param {String} pk parent model foreign key
   * @return BelongsToMany instance
   */
  through: function through(model, rk, pk) {
    this.pivot = model.factory()
    this.thirdKey = rk
    this.otherKey = pk
    this.pivotColumns = []
    
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
    
    this.pivotColumns = this.pivotColumns.concat(field)
    
    return this
  },
  
  /**
   * Attach a model the the parent
   * 
   * @param {Any} ids
   * @param {Object} attrs pivot table attributes
   * @param {Function} cb (optional)
   * @return Promise instance
   */
  attach: function attach(ids, attrs, cb) {
    if ( ids instanceof Collection ) ids = ids.keys()
    
    if (! _.isArray(ids) ) ids = [ids]
    
    if ( _.isFunction(attrs) ) {
      cb = attrs
      attrs = {}
    }
    
    var query = this.pivot.newQuery(),
        records = this.createPivotRecords(ids, attrs)
    
    return Promise.resolve(query.insert(records)).nodeify(cb)
  },
  
  /**
   * Detach one or many models from the parent
   * 
   * @param {Any} ids
   * @param {Function} cb (optional)
   * @return Promise instance
   */
  detach: function detach(ids, cb) {
    var query = this.newPivotQuery()
    
    if ( ids instanceof Collection ) ids = ids.keys()
    
    // detach all related models
    if (! ids ) ids = []
    if ( _.isFunction(ids) ) {
      cb = ids
      ids = []
    }
    
    if (! _.isArray(ids) ) ids = [ids]
    
    // accept also an array of models
    ids = _.map(ids, function (id) {
      return ( ids instanceof Model ) ? ids.getId() : id
    })
    
    if ( ids.length > 0 ) query.whereIn(this.thirdKey, ids)
    
    return Promise.resolve(query.destroy()).nodeify(cb)
  },
  
  /**
   * Save a new model and attach it to the parent
   * 
   * @param {Model} related
   * @param {Object} attrs (optional)
   * @param {Function} cb (optional)
   * @return Promise instance
   */
  save: function save(related, attrs, cb) {
    if ( _.isFunction(attrs) ) {
      cb = attrs
      attrs = {}
    }
    
    return Promise
      .bind(this, related.save())
      .then(function (model) {
        return this.attach(model.getId(), attrs)
      })
      .nodeify(cb)
  },
  
  /**
   * Save an array of new models and attach them to their parent
   * 
   * @param {Array} related
   * @param {Array} attrs
   * @param {Function} cb (optional)
   * @return Promise instance
   */
  saveMany: function saveMany(related, attrs, cb) {
    if ( _.isFunction(attrs) ) {
      cb = attrs
      attrs = []
    }
    
    if (! _.isArray(attrs) ) attrs = []
    
    return Promise
      .bind(this, related)
      .map(function (model, index) {
        return this.save(model, attrs[index] || {})
      })
      .nodeify(cb)
  },
  
  /**
   * Create and attach a new instance of the related model
   * 
   * @param {Object} attrs
   * @param {Object} pivots (optional)
   * @param {Function} cb (optional)
   * @return Promise instance
   */
  create: function create(attrs, pivots, cb) {
    var related = this.related.newInstance(attrs)
    
    return this.save(related, pivots, cb)
  },
  
  /**
   * Create an array of new instances of the related models
   * 
   * @param {Array} records
   * @param {Array} pivots
   * @param {Function} cb (optional)
   * @return Promise instance
   */
  createMany: function createMany(records, pivots, cb) {
    if ( _.isFunction(pivots) ) {
      cb = pivots
      pivots = []
    }
    
    if (! _.isArray(pivots) ) pivots = []
    
    return Promise
      .bind(this, records)
      .map(function (attrs, index) {
        return this.create(attrs, pivots[index] || {})
      })
      .nodeify(cb)
  },
  
  /**
   * Update an existing record on the pivot table
   * 
   * @param {Any} id
   * @param {Object} attrs
   * @param {Function} cb (optional)
   * @return Promise instance
   */
  updatePivot: function updatePivot(id, attrs, cb) {
    var query = this.newPivotQuery().where(this.thirdKey, id)
    
    return Promise.resolve(query.update(attrs)).nodeify(cb)
  },
  
  /**
   * Sync the intermediate table with a list of IDs 
   * 
   * @param {Array|Collection} ids
   * @param {Function} cb (optional)
   * @return Promise instance
   */
  sync: function sync(ids, cb) {
    if ( ids instanceof Collection ) ids = ids.keys()
    
    if (! _.isArray(ids) ) ids = [ids]
    
    var newRecords = this.formatPivotRecords(ids)
    var newIds = _.keys(newRecords).map(function (id) {
      return _.isNaN(id) ? id : Number(id)
    })
    
    return this
      .newPivotQuery()
      .pluck(this.thirdKey)
      .bind(this)
      
      // detach
      .tap(function (oldIds) {
        var toDetach = _.difference(oldIds, newIds)
        
        return _.isEmpty(toDetach) ? false : this.detach(toDetach)
      })
      
      // attach
      .tap(function (oldIds) {
        var toAttach = _.difference(newIds, oldIds)
        
        if ( _.isEmpty(toAttach) ) return false
        
        return this.attach(_.pick(newRecords, toAttach))
      })
      
      // update
      .tap(function (oldIds) {
        var toUpdate = _.intersection(oldIds, newIds)
        
        if ( _.isEmpty(toUpdate) ) return false
        
        return Promise.map(toUpdate, function (id) {
          var attrs = newRecords[id]
          
          if ( _.isEmpty(attrs) ) return false
          
          return this.updatePivot(id, attrs)
        }.bind(this))
      })
      .nodeify(cb)
  },
  
  /**
   * Format the pivot records
   * 
   * @param {Array} ids
   * @param {Object} attrs (optional)
   * @return Object
   * @private
   */
  formatPivotRecords: function _formatPivotRecords(ids, attrs) {
    if (! _.isArray(ids) ) return ids
    
    // we reduce the array of ids into one object,
    // keyed by the id of related model, and the value
    // is an object of the pivot table attributes
    return _.reduce(ids, function (memo, id) {
      if ( id instanceof Model ) id = id.getId()
      
      if ( _.isObject(id) ) return _.extend(memo, id)
      
      memo[id] = attrs || {}
      
      return memo
    }, {})
  },
  
  /**
   * Create an array of records to insert into the pivot table
   * 
   * @param {Array} ids
   * @param {Object} attrs (optional)
   * @return Array
   * @private
   */
  createPivotRecords: function _createPivotRecords(ids, attrs) {
    var records = []
    
    ids = this.formatPivotRecords(ids, attrs)
    
    // each key-value should be converted into an array 
    // of pivot table records
    _.each(ids, function (value, key) {
      var record = _.extend({}, value)
      
      record[this.otherKey] = this.parent.getId()
      record[this.thirdKey] = key
      
      records.push(record)
    }, this)
    
    return records
  },
  
  /**
   * Apply constraints on the relation query
   * 
   * @private
   */
  applyConstraints: function _applyConstraints() {
    this.setJoin()
    this.query.where(this.getForeignKey(), this.parent.getId())
  },
  
  /**
   * Apply eager constraints on the relation query
   * 
   * @param {Array} models
   * @private
   */
  applyEagerConstraints: function _applyEagerConstraints(models) {
    this.setJoin()
    this.query.whereIn(this.getForeignKey(), this.getKeys(models))
  },
  
  /**
   * Set the join clause for the relation query
   * 
   * @private
   */
  setJoin: function _setJoin() {
    var pivotTable = this.pivot.getTableName(),
        pivotColumn = 'pivot.' + this.thirdKey,
        modelTable = this.related.getTableName(),
        modelColumn = this.related.getQualifiedKeyName(),
        columns = [this.thirdKey, this.otherKey].concat(this.pivotColumns)
    
    // add an alias to pivot columns
    columns = _.map(columns, function (col) {
      return 'pivot.' + (col + ' as pivot_' + col)
    })
    
    // set query clauses
    this.query.select([modelTable + '.*'].concat(columns))
    this.query.join(pivotTable + ' as pivot', modelColumn, pivotColumn)
  },
  
  /**
   * Create a new pivot query
   * 
   * @return Query instance
   * @private
   */
  newPivotQuery: function _newPivotQuery() {
    var query = this.pivot.newQuery()
    
    return query.where(this.otherKey, this.parent.getId())
  },
  
  /**
   * Get the fully qualified foreign key for the relation
   * 
   * @return String
   * @private
   */
  getForeignKey: function _getForeignKey() {
    return 'pivot.' + this.otherKey
  },
  
  /**
   * Clean pivot attributes from models
   * 
   * @param {Array} models
   * @private
   */
  cleanPivotAttributes: function _cleanPivotAttributes(models) {
    models.forEach(function (model) {
      var data = {}
      
      _.each(model.getData(), function (value, key) {
        if ( key.indexOf('pivot_') === 0 ) {
          data[key.substring(6)] = value
          delete model.$data[key]
          delete model.$original[key]
        }
      })
      
      model.related('pivot', this.pivot.newExistingInstance(data))
    }, this)
  }
  
})

// use mixin
_.defaults(BelongsToMany.prototype, require('./mixins/many-to-many'))

module.exports = BelongsToMany

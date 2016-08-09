
import _ from 'underscore'
import Model from '../model'
import Relation from './base'
import Promise from 'bluebird'
import mixin from './mixins/one-to-many'

// exports
export default class extends mixin(Relation) {
  
  /**
   * BelongsToManyRelation constructor
   * 
   * @param {String} name of the relation
   * @param {Model} parent model instance
   * @param {Model} target mdoel instance
   * @param {String} pivot table name
   * @param {String} pfk parent model foreign key
   * @param {String} tfk target model foreign key
   * @constructor
   */
  constructor(name, parent, target, pivot, pfk, tfk) {
    super(name, parent, target)
    
    this.localKey = parent.primaryKey
    this.pivotColumns = [pfk, tfk]
    this.pivot = new Model
    this.targetKey = tfk
    this.otherKey = pfk
    this.table = pivot
    
    // add pivot table join
    this.addPivotJoin()
  }
  
  /**
   * Add the pivot table columns to fetch
   * 
   * @param {Array} columns
   * @return this relation
   */
  withPivot(columns) {
    if (! _.isArray(columns) ) columns = _.toArray(arguments)
    
    this.pivotColumns = _.uniq(this.pivotColumns.concat(columns))
    
    return this
  }
  
  /**
   * Update an existing record on the pivot table
   * 
   * @param {Any} id of the target model
   * @param {Object} attrs
   * @return promise
   */
  updatePivot(id, attrs) {
    return this.newPivotQuery().where(this.targetKey, id).update(attrs)
  }
  
  /**
   * Create and attach a new instance of the related model
   * 
   * @param {Object} attrs
   * @param {Array} returning
   * @return promise
   */
  create(attrs, returning = ['*']) {
    var pivots = {}
    
    if ( attrs.pivot ) {
      pivots = attrs.pivot
      delete attrs.pivot
    }
    
    return this.save(this.target.newInstance(attrs), pivots, returning)
  }
  
  /**
   * Save a new model and attach it to the parent
   * 
   * @param {Model} related
   * @param {Object} pivots
   * @param {Array} returning
   * @return promise
   */
  save(related, pivots = {}, returning = ['*']) {
    return related.save(returning).then(model => {
      return this.attach(this.createPivotRecord(model.getId(), pivots))
    })
  }
  
  /**
   * Save many models and attach them to the parent model
   * 
   * @param {Array} related
   * @param {Array} pivots
   * @parma {Array} returning
   * @return promise
   */
  saveMany(related, pivots = [], returning = ['*']) {
    return Promise.map(related, (model, i) => {
      return this.save(model, pivots[i], returning)
    })
  }
  
  /**
   * Attach a models to the parent model
   * 
   * @param {Array} ids
   * @return promise
   */
  attach(ids) {
    if (! _.isArray(ids) ) ids = [ids]
    
    var records = this.createPivotRecords(ids)
    
    return this.newPivotQuery(false).insert(records)
  }
  
  /**
   * Detach one or many models from the parent
   * 
   * @param {Array} ids
   * @return promise
   */
  detach(ids = []) {
    var query = this.newPivotQuery()
    
    ids = (_.isArray(ids) ? ids : [ids]).map(value => {
      return (value instanceof Model) ? value.getId() : value
    })
    
    if ( ids.length > 0 ) query.whereIn(this.targetKey, ids)
    
    return query.destroy()
  }
  
  /**
   * Sync the intermediate table with a list of IDs
   * 
   * @param {Array} ids
   * @return promise
   */
  sync(ids) {
    var newIds = [], toAttach = [], toUpdate = [], toDetach
    
    return this
      .newPivotQuery()
      .pluck(this.targetKey)
      
      // traversing
      .tap(oldIds => {
        ids.forEach(value => {
          var id
          
          if ( value instanceof Model ) value = value.getId()
          
          if ( _.isArray(value) ) value = [value]
          
          // add the new id
          newIds.push(id = value[0])
          
          // looking for ids that should be attached or updated
          if (! _.contains(oldIds, id) ) toAttach.push(value)
          else if (! _.isEmpty(value[1]) ) toUpdate.push(value)
        })
        
        toDetach = _.difference(oldIds, newIds)
      })
      
      // detach
      .tap(oldIds => _.isEmpty(toDetach) ? false : this.detach(toDetach))
      
      // attach
      .tap(oldIds => _.isEmpty(toAttach) ? false : this.attach(toAttach))
      
      // update pivots
      .tap(oldIds => Promise.map(toUpdate, args => this.updatePivot(...args)))
  }
  
  /**
   * Create a query for the pivot table
   * 
   * @param {Boolean} constraints
   * @return query
   * @private
   */
  newPivotQuery(constraints = true) {
    var query = this.pivot.newQuery().from(this.table)
    
    if ( constraints ) query.where(this.otherKey, this.parent.get(this.localKey))
    
    return query
  }
  
  /**
   * Create an array of records to insert into the pivot table
   * 
   * @param {Array} ids
   * @return array
   * @private
   */
  createPivotRecords(ids) {
    return ids.map(args => {
      if ( args instanceof Model ) args = [args.getId()]
      
      if (! _.isArray(args) ) args = [args]
      
      return this.createPivotRecord(...args)
    })
  }
  
  /**
   * Create a record to insert into the pivot table
   * 
   * @param {Any} id of the target model
   * @param {Object} pivots pivot table attributes
   * @return plain object
   * @private
   */
  createPivotRecord(id, pivots = {}) {
    var record = _.extend({}, pivots)
    
    record[this.otherKey] = this.parent.get(this.localKey)
    record[this.targetKey] = id
    
    return record
  }
  
  /**
   * Apply constraints on the relation query
   * 
   * @private
   */
  addLoadConstraints() {
    super.addConstraints()
    this.addPivotColumns()
  }
  
  /**
   * Apply eager constraints on the relation query
   * 
   * @param {Array} models
   * @private
   */
  addEagerLoadConstraints(models) {
    super.addEagerLoadConstraints(models)
    this.addPivotColumns()
  }
  
  /**
   * Set the columns of the relation query
   * 
   * @private
   */
  addPivotColumns() {
    var columns = this.pivotColumns.map(col => {
      return this._through.getQualifiedColumn(col) + ' as pivot_' + col
    })
    
    this.query.toBase().select(columns)
  }
  
  /**
   * Build model dictionary keyed by the given key
   * 
   * @param {Collection} related
   * @param {String} key
   * @return plain object
   * @private
   */
  buildDictionary(related, key) {
    return related.groupBy(model => {
      return model.get('pivot_' + key)
    })
  }
  
  /**
   * Add `join`constraints to the intermediate table
   * 
   * @private
   */
  addPivotJoin() {
    var alias = this.name + '_pivot'
    
    this.query.join(
      this.table + ' as ' + alias
      alias + '.' + this.targetKey,
      this.query.getQualifiedColumn(this.target.primaryKey)
    )
  }
  
}

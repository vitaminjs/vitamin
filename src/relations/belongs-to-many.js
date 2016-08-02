
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
   * @param {Model} parent model instance
   * @param {Model} target mdoel instance
   * @param {String} pivot table name
   * @param {String} pfk parent model foreign key
   * @param {String} tfk target model foreign key
   * @constructor
   */
  constructor(name, parent, target, pivot = null, pfk = null, tfk = null) {
    super(name, parent, target)
    
    this.localKey = parent.primaryKey
    this.pivot = new Model
    
    if ( pivot ) {
      var alias = this.name + '_pivot'
      var query = this.newPivotQuery(false).from(pivot, alias)
      
      this.addThroughJoin(query, target.primaryKey, tfk)
      this.setPivot(pivot, pfk, tfk)
      this._through = query
    }
  }
  
  /**
   * Add `through` relationship constraints
   * 
   * @param {String} name of the pivot relation
   * @param {String} pfk parent model foreign key
   * @return this relation
   */
  through(name, pfk) {
    var rel = this.target.getRelation(name)
    
    this.addThroughJoin(rel.query, rel.localKey, rel.otherKey)
    this.setPivot(rel.query.table, pfk, rel.localKey)
    this._through = rel.query
    
    return this
  }
  
  /**
   * Add the pivot table columns to fetch
   * 
   * @param {Array} columns
   * @return this relation
   */
  withPivot(columns) {
    this.pivotColumns.push(..._.flatten(arguments))
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
   * @return promise
   */
  create(attrs) {
    var pivots = {}
    
    if ( attrs.pivot ) {
      pivots = attrs.pivot
      delete attrs.pivot
    }
    
    return this.save(this.target.newInstance(attrs), pivots)
  }
  
  /**
   * Save a new model and attach it to the parent
   * 
   * @param {Model} related
   * @param {Object} attrs (optional)
   * @return promise
   */
  save(related, pivots = {}) {
    return related.save().then(model => {
      return this.attach(this.createPivotRecord(model.getId(), pivots))
    })
  }
  
  /**
   * Attach a models the the parent model
   * 
   * @param {Array} ids
   * @return promise
   */
  attach(ids) {
    ids = (_.isArray(ids) ? ids : [ids]).map(value => {
      return (value instanceof Model) ? value.getId() : value
    })
    
    return this.newPivotQuery(false).insert(this.createPivotRecords(ids))
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
    
    if ( constraints ) query.where(this.otherKey, this.parent.getId())
    
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
    
    record[this.otherKey] = this.parent.getId()
    record[this.targetKey] = id
    
    return record
  }
  
  /**
   * Set the pivot table informations
   * 
   * @param {String} table name
   * @param {String} pfk parent model foreign key
   * @param {String} tfk target model foreign key
   * @private
   */
  setPivot(table, pfk, tfk) {
    this.pivotColumns = [pfk, tfk]
    this.targetKey = tfk
    this.otherKey = pfk
    this.table = table
  }
  
  /**
   * Apply constraints on the relation query
   * 
   * @private
   */
  addConstraints() {
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
      return this._through.getQualifiedColumn(col)
    })
    
    this.query.toBase().select(columns)
  }
  
}

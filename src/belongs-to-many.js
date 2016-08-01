
import _ from 'underscore'
import Model from '../model'
import Relation from './base'
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
  constructor(name, parent, target, pivot, pfk, tfk) {
    super(name, parent, target)
    
    this.localKey = parent.primaryKey
    this.pivotColumns = [pfk, tfk]
    this.targetKey = tfk
    this.otherKey = pfk
    this.table = pivot
  }
  
  /**
   * Add `through` relationship constraints
   * 
   * @param {String} relation name
   * @return this relation
   */
  through(relation) {
    // because of the special behavior of belongs-to-many relations,
    // we should use the parent model foreign key as target key,
    // to make possible the joining between tables
    return super(relation, this.otherKey)
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
    var newRecords = this.formatSyncRecords(ids)
    var newIds = newRecords.map(v => v[0])
    
    return this
      .newPivotQuery()
      .pluck(this.targetKey)
      
      // detach
      .tap(oldIds => {
        var toDetach = _.difference(oldIds, newIds)
        
        return _.isEmpty(toDetach) ? false : this.detach(toDetach)
      })
      
      // attach
      .tap(oldIds => {
        var toAttach = _.difference(newIds, oldIds)
        
        if ( _.isEmpty(toAttach) ) return false
        
        // TODO
      })
  }
  
  /**
   * Format the pivot records for sync operation
   * 
   * @param {Array} ids
   * @return array
   * @private
   */
  formatSyncRecords(ids) {
    return ids.map(id => {
      if ( id instanceof Model ) id = id.getId()
      
      return ( _.isArray(id) ) id : [id]
    })
  }
  
  /**
   * Create a query for the pivot table
   * 
   * @param {Boolean} constraints
   * @return query
   * @private
   */
  newPivotQuery(constraints = true) {
    // TODO
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
  createPivotRecord(id, pivots) {
    var record = _.extend({}, pivots)
    
    record[this.otherKey] = this.parent.getId()
    record[this.targetKey] = id
    
    return record
  }
  
}

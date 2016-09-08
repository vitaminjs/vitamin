
import _ from 'underscore'
import Model from '../model'
import Relation from './base'
import Promise from 'bluebird'
import Mapper from '../mapper'
import mixin from './mixins/one-to-many'

// exports
export default class extends mixin(Relation) {
  
  /**
   * BelongsToManyRelation constructor
   * 
   * @param {Mapper} parent mapper instance
   * @param {Mapper} target mapper instance
   * @param {String} pivot table name
   * @param {String} pfk parent model foreign key
   * @param {String} tfk target model foreign key
   * @constructor
   */
  constructor(parent, target, pivot, pfk, tfk) {
    super(parent, target)
    
    this.pivot = new Mapper({ tableName: pivot })
    this.table = this.pivot.tableName
    
    this.localKey = parent.primaryKey
    this.pivotColumns = [pfk, tfk]
    this.targetKey = tfk
    this.otherKey = pfk
    
    this._through = this.newPivotQuery(false).from(this.table, target.name + '_pivot')
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
    return super.save(related, returning).then(model => {
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
    var records = this.createPivotRecords(_.isArray(ids) ? ids : [ids])
    
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
      .then(oldIds => {
        ids.forEach(value => {
          var id
          
          if ( value instanceof Model ) value = value.getId()
          
          if (! _.isArray(value) ) value = [value]
          
          // add the new id
          newIds.push(id = value[0])
          
          // looking for ids that should be attached or updated
          if (! _.contains(oldIds, id) ) toAttach.push(value)
          else if (! _.isEmpty(value[1]) ) toUpdate.push(value)
        })
        
        toDetach = _.difference(oldIds, newIds)
      })
      
      // detach
      .then(() => _.isEmpty(toDetach) ? false : this.detach(toDetach))
      
      // attach
      .then(() => _.isEmpty(toAttach) ? false : this.attach(toAttach))
      
      // update pivots
      .then(() => Promise.map(toUpdate, args => this.updatePivot(...args)))
      
      // return
      .then(() => {
        return {
          'detached': toDetach.length,
          'attached': toAttach.length,
          'updated': toUpdate.length,
        }
      })

  }
  
  /**
   * Apply constraints on the relation query
   * 
   * @param {Model} model
   * @return this relation
   */
  addConstraints(model) {
    this.addPivotJoin()
    this.addPivotColumns()
    return super.addConstraints(model)
  }
  
  /**
   * Create a query for the pivot table
   * 
   * @param {Boolean} constraints
   * @return query
   * @private
   */
  newPivotQuery(constraints = true) {
    var query = this.pivot.newQuery()
    
    if ( constraints ) 
      query.where(this.otherKey, this.model.get(this.localKey))
    
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
    
    record[this.otherKey] = this.model.get(this.localKey)
    record[this.targetKey] = id
    
    return record
  }
  
  /**
   * Get the fully qualified compare key of the relation
   * 
   * @return string
   * @private
   */
  getCompareKey() {
    return this._through.getQualifiedColumn(this.otherKey)
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
    this.addPivotJoin()
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
    return related.groupBy(model => model.related.pivot.get(key))
  }
  
  /**
   * Add `join`constraints to the intermediate table
   * 
   * @private
   */
  addPivotJoin() {
    this.query.join(
      this._through.table + ' as ' + this._through.alias,
      this._through.getQualifiedColumn(this.targetKey),
      this.query.getQualifiedColumn(this.target.primaryKey)
    )
  }
  
}

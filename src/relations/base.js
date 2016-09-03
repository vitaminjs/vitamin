
import Promise from 'bluebird'
import Query from './query'
import _ from 'underscore'

// exports
export default class {
  
  /**
   * BaseRelation constructor
   * 
   * @param {Model} parent mapper instance
   * @param {Model} target mapper instance
   * @constructor
   */
  constructor(parent, target = null) {
    this.name   = null
    this.parent = parent
    this.localKey = null // parent key
    this.otherKey = null // target key
    
    if ( target != null ) this.setTarget(target)
  }
  
  /**
   * Set the target mapper instance
   * 
   * @param {Mapper} target
   * @return this relation
   */
  setTarget(target) {
    this.query = new Query(target.newQuery()).setRelation(this)
    this.target = target
    return this
  }
  
  /**
   * Set the name of the relationship
   * 
   * @param {String} name
   * @return this relation
   */
  setName(name) {
    if ( this.query ) this.query.from(this.target.tableName, name)
    
    this.name = name
    return this
  }
  
  /**
   * Get the relation query
   * 
   * @return query
   */
  getQuery() {
    return this.query
  }
  
  /**
   * Create a new instance of the related model
   * 
   * @param {Object} attrs
   * @param {Array} returning
   * @return promise
   */
  create(attrs, returning = ['*']) {
    return this.save(this.target.newInstance(attrs), returning)
  }
  
  /**
   * Create many instances of the related model
   * 
   * @param {Array} records
   * @parma {Array} returning
   * @return promise
   */
  createMany(records, returning = ['*']) {
    return Promise.map(records, attrs => this.create(attrs, returning))
  }
  
  /**
   * Save the related model
   * 
   * @param {Model} model
   * @param {Array} returning
   * @return promise
   */
  save(model, returning = ['*']) {
    return this.target.save(...arguments)
  }
  
  /**
   * Save the related models
   * 
   * @param {Array} models
   * @parma {Array} returning
   * @return promise
   */
  saveMany(models, returning = ['*']) {
    return Promise.map(models, model => this.save(model, returning))
  }
  
  /**
   * Modify the query of the relationship
   * 
   * @param {Function} fn
   * @param {Array} args
   * @return this relation
   */
  modify(fn, ...args) {
    fn(this.query, ...args)
    return this
  }
  
  /**
   * Load and populate the related models
   * 
   * @param {Array} models
   * @return promise
   */
  eagerLoad(models) {
    this.addEagerLoadConstraints(models)
    return this.getQuery().fetch().then(res => this.populate(models, res))
  }
  
  /**
   * Add constraints on the relation query
   * 
   * @param {Model} model
   * @return this relation
   */
  addConstraints(model) {
    this.query.where(this.getCompareKey(), model.get(this.localKey))
    this.model = model
    return this
  }
  
  /**
   * Add eager load constraints on the relation query
   * 
   * @param {Array} models
   * @private
   */
  addEagerLoadConstraints(models) {
    this.query.whereIn(this.getCompareKey(), this.getKeys(models, this.localKey))
  }
  
  /**
   * Get the fully qualified compare key of the relation
   * 
   * @return string
   * @private
   */
  getCompareKey() {
    return this.query.getQualifiedColumn(this.otherKey)
  }
  
  /**
   * Get the keys of the given models
   * 
   * @param {Array} models
   * @param {String} key
   * @return array
   * @private
   */
  getKeys(models, key) {
    return _.chain(models).map(m => key ? m.get(key): m.getId()).uniq().value()
  }
  
  /**
   * Populate the parent models with the eagerly loaded results
   * 
   * @param {Array} models
   * @param {Array} results
   * @private
   */
  populate(models, related) {
    var dict = this.buildDictionary(related, this.otherKey)
    
    models.forEach(parent => {
      var value = dict[parent.get(this.localKey)]
      
      parent.setRelated(this.name, this.parseRelationValue(value))
    })
  }
  
}

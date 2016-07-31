
import Query from './query'
import _ from 'underscore'

// exports
export default class {
  
  /**
   * BaseRelation constructor
   * 
   * @param {Model} parent model instance
   * @param {Model} target model instance
   * @constructor
   */
  constructor(parent, target) {
    this.parent = parent
    this.target = target
    
    this.localKey = null
    this.otherKey = null
    
    this.constraints = false
    this.query = new Query(target.newQuery()).setRelation(this)
  }
  
  /**
   * Set the name of this relation
   * 
   * @param {String} name
   * @return this relation
   */
  setName(name) {
    this.query.from(this.target.tableName, name)
    this.name = name
    return this
  }
  
  /**
   * Modify the query of the relationship
   * 
   * @param {Function} fn
   * @return this relation
   */
  modify(fn) {
    fn(this.query, ..._.rest(arguments))
    return this
  }
  
  /**
   * Get the relation query
   * 
   * @return query
   */
  getQuery() {
    if (! this.constraints ) {
      this.constraints = true
      this.addConstraints()
    }
    
    return this.query
  }
  
  /**
   * Load and populate the related models
   * 
   * @param {Array} models
   * @return promise
   */
  eagerLoad(models) {
    this.addEagerLoadConstraints(models)
    return this.query.fetch().then(res => this.populate(models, res))
  }
  
  /**
   * Add constraints on the relation query
   * 
   * @private
   */
  addConstraints() {
    this.query.where(this.getCompareKey(), this.parent.get(this.localKey))
  }
  
  /**
   * Add eager load constraints on the relation query
   * 
   * @param {Array} models
   * @private
   */
  addEagerLoadConstraints(models) {
    this.query.whereIn(this.getCompareKey(), this.getKeys(models, this.otherKey))
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
  
  /**
   * Parse the value for the relationship
   * 
   * @param {Model} value
   * @return any
   * @private
   */
  parseRelationValue(value) {
    if (! _.isArray(value) ) return value || null
    
    return this.target.newCollection(value || [])
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
    return related.keyBy(key)
  }
  
}
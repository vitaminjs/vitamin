
import _ from 'underscore'
import Query from '../query'

// exports
export default class extends Query {
  
  /**
   * RelationQuery constructor
   * 
   * @param {Query} query
   * @constructor
   */
  constructor(query) {
    super(query.toBase())
    
    this.setModel(query.model)
    this.from(this.model.tableName)
  }
  
  /**
   * Set relation mapper of this query
   * 
   * @param {Relation} relation
   * @return this query
   */
  setRelation(relation) {
    this.relation = relation
    return this
  }
  
  /**
   * Get the first record matching the attributes or create it
   * 
   * @param {Object} attrs
   * @return promise
   */
  firstOrCreate(attrs) {
    return this.firstOrNew(attrs).then(model => {
      if ( _.isFunction(this.relation.create) ) {
        return this.relation.create(attrs)
      } 
      
      return model.save()
    })
  }
  
}
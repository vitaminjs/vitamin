
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
   * @param {Array} returning
   * @return promise
   */
  firstOrCreate(attrs, returning = ['*']) {
    return this.firstOrNew(attrs).then(model => {
      if ( _.isFunction(this.relation.create) ) {
        return this.relation.create(attrs, returning)
      }
      
      return model.save(returning)
    })
  }
  
  /**
   * Fetch many records from the database
   * 
   * @param {Array} columns
   * @return promise
   */
  fetch(columns) {
    return super.fetch(...arguments).tap(this.hydratePivotAttributes.bind(this))
  }
  
  /**
   * Hydrate pivot attributes
   * 
   * @param {Collection} collection
   * @private
   */
  hydratePivotAttributes(collection) {
    if ( _.isEmpty(this.relation.pivotColumns) ) return
    
    collection.forEach(model => {
      var data = {}
      
      // unset the pivot attributes from the target model
      _.each(model.getData(), (value, attr) => {
        if ( attr.indexOf('pivot_') === 0 ) {
          data[attr.substring(6)] = value
          model.unset(attr, true)
        }
      })
      
      // prevent adding an empty `pivot` model
      if ( _.isEmpty(data) ) return
      
      // set the pivot attributes as a pivot model
      model.setRelated('pivot', this.relation.pivot.newInstance(data, true))
    })
  }
  
}


import _ from 'underscore'
import Query from './query'
import Promise from 'bluebird'
import registry from '../registry'
import Relation from './belongs-to'

// exports
export default class extends Relation {
  
  /**
   * MorphToRelation constructor
   * 
   * @param {Model} parent model instance
   * @param {String} type
   * @param {String} fk parent model foreign key
   * @param {String} pk target model primary key
   * @constructor
   */
  constructor(parent, type, fk, pk) {
    super(parent, null, fk, pk)
    
    this.morphType = type
  }
  
  /**
   * Associate the model instance to the current model
   * 
   * @param {Model} model
   * @return parent model
   */
  associate(model) {
    return super.associate(model).set(this.morphType, model.mapper.name)
  }
  
  /**
   * Dissociate the parent model from the current model
   * 
   * @return parent model
   */
  dissociate() {
    return super.dissociate().set(this.morphType, null)
  }
  
  /**
   * Get the relation query
   * 
   * @return query
   */
  getQuery() {
    if (! this.target ) {
      let target = registry.get(this.model.get(this.morphType))
      
      this.setTarget(target)
    }
    
    return super.getQuery()
  }
  
  /**
   * Load and populate the related models
   * 
   * @param {Array} models
   * @return promise
   */
  eagerLoad(models) {
    var groups = _.groupBy(models, m => m.get(this.morphType))
    
    return Promise.map(_.keys(groups), type => {
      // we define the current target mapper object
      this.setTarget(registry.get(type))
      
      // run a separate query for each model type
      return super.eagerLoad(groups[type])
    })
    .return(models)
  }
  
  /**
   * Add constraints on the relation query
   * 
   * @param {Model} model
   * @return this relation
   */
  addConstraints(model) {
    this.model = model
    
    this.getQuery().where(this.getCompareKey(), model.get(this.localKey))
    
    return this
  }
  
  /**
   * Set the relation target model
   * 
   * @param {Model} target model instance
   * @return this relation
   * @private
   */
  setTarget(target) {
    this.otherKey = target.primaryKey
    return super.setTarget(target)
  }
  
}

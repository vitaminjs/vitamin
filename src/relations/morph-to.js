
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
  constructor(parent, target, type, fk, pk) {
    super(parent, target, fk, pk)
    
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
   * Get the result of the relationship
   * 
   * @return promise
   */
  load() {
    var target = this._createModelByName(this.model.get(this.morphType))
    
    return this.setTarget(target).getQuery().first()
  }
  
  /**
   * Load and populate the related models
   * 
   * @param {Array} models
   * @return promise
   */
  eagerLoad(models) {
    var groups = _.groupBy(models, model => model.get(this.morphType))
    
    return Promise
      .map(groups, (_models, type) => {
        var target = this._createModelByName(type)
        
        this.otherKey = target.primaryKey
        
        // run a separate query for each model type
        return target.newQuery()
          .findMany(this.getKeys(_models))
          .then(res => this.populate(_models, res))
      })
      .return(models)
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
    super.setTarget(target)
    return this
  }
  
  /**
   * Create an instance of the given model name
   * 
   * @param {String} name
   * @return model instance
   * @private
   */
  _createModelByName(name) {
    return registry.get(name).make()
  }
  
}

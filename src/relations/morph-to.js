
import Query from './query'
import Promise from 'bluebird'
import Relation from './belongs-to'

// exports
export default class extends Relation {
  
  /**
   * MorphToRelation constructor
   * 
   * @param {String} name of the relationship
   * @param {Model} parent model instance
   * @param {String} type
   * @param {String} fk parent model foreign key
   * @param {String} pk target model primary key
   * @constructor
   */
  constructor(name, parent, type, fk, pk = null) {
    super(name, parent, parent, fk, pk)
    
    this.morphType = type
  }
  
  /**
   * Associate the model instance to the current model
   * 
   * @param {Model} model
   * @return parent model
   */
  associate(model) {
    return super.associate(model).set(this.morphType, model.morphName || model.tableName)
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
    var target = this.createModelByName(this.parent.get(this.morphType))
    
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
        var target = this.createModelByName(type)
        
        this.otherKey = target.primaryKey
        
        // run a separate query for each model group
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
    var query = target.newQuery()
    
    this.query = query.from(target.tableName, name)
    this.otherKey = target.primaryKey
    this.target = target
    
    return this
  }
  
  /**
   * Create an instance of the given model name
   * 
   * @param {String} name
   * @return model instance
   * @private
   */
  createModelByName(name) {
    return registry.get(name).make()
  }
  
}

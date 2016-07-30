
import Relation from './base'

// exports
export default class extends Relation {
  
  /**
   * HasOneOrManyRelation constructor
   * 
   * @param {Model} parent model instance
   * @param {Model} target model instance
   * @param {String} fk target model foreign key
   * @param {String} pk parent model primary key
   * @constructor
   */
  constructor(parent, target, fk, pk) {
    super(parent, target)
    
    this.localKey = pk
    this.otherKey = fk
  }
  
  /**
   * Create a new instance of the related model
   * 
   * @param {Object} attrs
   * @return promise
   */
  create(attrs) {
    return this.save(this.target.newInstance(attrs))
  }
  
  /**
   * Attach a model instance to the parent model
   * 
   * @param {Model} model
   * @return promise
   */
  save(model) {
    return model.set(this.otherKey, this.parent.get(this.localKey)).save()
  }
  
}
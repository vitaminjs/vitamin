
import Relation from './base'

// exports
export default class extends Relation {
  
  /**
   * HasOneOrManyRelation constructor
   * 
   * @param {String} name of the relationship
   * @param {Model} parent model instance
   * @param {Model} target model instance
   * @param {String} fk target model foreign key
   * @param {String} pk parent model primary key
   * @constructor
   */
  constructor(name, parent, target, fk, pk) {
    super(name, parent, target)
    
    this.localKey = pk
    this.otherKey = fk
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
   * Attach a model instance to the parent model
   * 
   * @param {Model} model
   * @param {Array} returning
   * @return promise
   */
  save(model, returning = ['*']) {
    return model.set(this.otherKey, this.parent.get(this.localKey)).save(returning)
  }
  
}
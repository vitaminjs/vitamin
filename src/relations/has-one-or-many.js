
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

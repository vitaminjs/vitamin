
import Relation from './base'
import mixin from './mixins/one-to-one'

// exports
export default class extends mixin(Relation) {
  
  /**
   * BelongsToRelation constructor
   * 
   * @param {Model} parent model instance
   * @param {Model} target model instance
   * @param {String} fk parent model foreign key
   * @param {String} pk target model primary key
   * @constructor
   */
  constructor(parent, target, fk, pk) {
    super(parent, target)
    
    this.localKey = fk
    this.otherKey = pk
  }
  
  /**
   * Associate the model instance to the current model
   * 
   * @param {Model} model
   * @return parent model
   */
  associate(model) {
    if ( model.get ) model = model.get(this.otherKey)
    
    return this.parent.set(this.localKey, model)
  }
  
  /**
   * Dissociate the parent model from the current model
   * 
   * @return parent model
   */
  dissociate() {
    return this.parent.set(this.localKey, null)
  }
  
}
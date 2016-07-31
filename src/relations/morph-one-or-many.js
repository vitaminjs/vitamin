
import Relation from './has-one-or-many'

// exports
export default class extends Relation {
  
  /**
   * MorphOneOrManyRelation constructor
   * 
   * @param {Model} parent model instance
   * @param {Model} target model instance
   * @param {String} type
   * @param {String} fk target model foreign key
   * @param {String} pk parent model primary key
   * @constructor
   */
  constructor(parent, target, type, fk, pk) {
    super(parent, target, fk, pk)
    
    this.morphType = type
    this.morphName = this.parent.morphName
    
    this.query.where(this.getQualifiedMorphType(), this.morphName)
  }
  
  /**
   * Attach a model instance to the parent model
   * 
   * @param {Model} model
   * @return Promise
   */
  save(model) {
    return super.save(model.set(this.morphType, this.morphName))
  }
  
  /**
   * Get the qualified morph type name
   * 
   * @return string
   */
  getQualifiedMorphType() {
    return this.query.getQualifiedColumn(this.morphType)
  }
  
}
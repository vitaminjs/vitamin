
import Relation from './has-one-or-many'

// exports
export default class extends Relation {
  
  /**
   * MorphOneOrManyRelation constructor
   * 
   * @param {Model} parent mapper instance
   * @param {Model} target mapper instance
   * @param {String} type
   * @param {String} fk target model foreign key
   * @param {String} pk parent model primary key
   * @constructor
   */
  constructor(parent, target, type, fk, pk) {
    super(parent, target, fk, pk)
    
    this.morphType = type
    this.morphName = parent.name
  }
  
  /**
   * Save a related model instance into the database
   * 
   * @param {Model} model
   * @param {Array} returning
   * @return Promise
   */
  save(model, returning = ['*']) {
    return super.save(model.set(this.morphType, this.morphName), returning)
  }
  
  /**
   * Get the qualified morph type name
   * 
   * @return string
   */
  getQualifiedTypeColumn() {
    return this.query.getQualifiedColumn(this.morphType)
  }
  
  /**
   * Add `morphType` constraint on the relation query
   * 
   * @private
   */
  addMorphTypeConstraint() {
    this.query.where(this.getQualifiedTypeColumn(), this.morphName)
  }
  
  /**
   * Add constraints on the relation query
   * 
   * @private
   */
  addLoadConstraints() {
    super.addLoadConstraints()
    this.addMorphTypeConstraint()
  }
  
  /**
   * Add eager load constraints on the relation query
   * 
   * @param {Array} models
   * @private
   */
  addEagerLoadConstraints(models) {
    super.addEagerLoadConstraints(models)
    this.addMorphTypeConstraint()
  }
  
}

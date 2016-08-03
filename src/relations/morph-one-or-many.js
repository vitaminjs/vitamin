
import Relation from './has-one-or-many'

// exports
export default class extends Relation {
  
  /**
   * MorphOneOrManyRelation constructor
   * 
   * @param {String} name of the relationship
   * @param {Model} parent model instance
   * @param {Model} target model instance
   * @param {String} type
   * @param {String} fk target model foreign key
   * @param {String} pk parent model primary key
   * @constructor
   */
  constructor(name, parent, target, type, fk, pk) {
    super(name, parent, target, fk, pk)
    
    this.morphType = type
    this.morphName = parent.morphName || parent.tableName 
  }
  
  /**
   * Attach a model instance to the parent model
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
   * Add join constraints with the intermediate table
   * 
   * @param {Query} query
   * @param {String} localKey
   * @param {String} otherKey
   * @private
   */
  addThroughJoin(query, localKey, otherKey) {
    this.query.join(query.table + ' as ' + query.alias, (qb) => {
      qb.on(
        query.getQualifiedColumn(otherKey),
        this._through.getQualifiedColumn(localKey)
      ).andOn(
        this.getQualifiedTypeColumn(), this.morphName
      )
    })
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
  addConstraints() {
    super.addConstraints()
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

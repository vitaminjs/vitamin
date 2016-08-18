
import Relation from './belongs-to-many'

// exports
export default class extends Relation {
  
  /**
   * MorphToManyRelation constructor
   * 
   * @param {Model} parent model instance
   * @param {Model} target mdoel instance
   * @param {String} type
   * @param {String} pivot table name
   * @param {String} pfk parent model foreign key
   * @param {String} tfk target model foreign key
   * @constructor
   */
  constructor(parent, target, type, pivot, pfk, tfk) {
    super(parent, target, pivot, pfk, tfk)
    
    this.morphType = type
    this.morphName = parent.name
  }
  
  /**
   * Create a query for the pivot table
   * 
   * @param {Boolean} constraints
   * @return query
   * @private
   */
  newPivotQuery(constraints = true) {
    var query = super.newPivotQuery(constraints)
    
    if ( constraints ) query.where(this.morphType, this.morphName)
    
    return query
  }
  
  /**
   * Create a record to insert into the pivot table
   * 
   * @param {Any} id of the target model
   * @param {Object} pivots attributes
   * @return plain object
   * @private
   */
  createPivotRecord(id, pivots = {}) {
    var record = super.createPivotRecord(...arguments)
    
    record[this.morphType] = this.morphName
    
    return record
  }
  
  /**
   * Get the qualified morph type name
   * 
   * @return string
   */
  getQualifiedTypeColumn() {
    return this._through.getQualifiedColumn(this.morphType)
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
  
  /**
   * Add `join`constraints to the intermediate table
   * 
   * @private
   */
  addPivotJoin() {
    this.query.join(this.table + ' as ' + this._through.alias, qb => {
      qb.on(this.getQualifiedTypeColumn(), this.morphName).andOn(
        this.query.getQualifiedColumn(this.target.primaryKey),
        this._through.getQualifiedColumn(this.targetKey)
      )
    })
  }
  
}

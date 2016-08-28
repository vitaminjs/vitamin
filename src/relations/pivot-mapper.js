
import Model from '../model'
import Mapper from '../mapper'

// exports
export default class extends Mapper {
  
  /**
   * PivotMapper constructor
   * 
   * @param {Mapper} parent
   * @param {String} table
   */
  constructor(parent, table) {
    super()
    
    this.tableName = table
    this.connection = parent.connection
    this.modelClass = Model.extend({ mapper: this })
  }
  
  /**
   * Get the model constructor from the registry
   *
   * @param {String} name
   * @return model constructor
   */
  model() {
    return this.modelClass
  }
  
}
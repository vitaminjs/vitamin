
import XError from 'es6-error'

// exports 
export default class extends XError {
    
  /**
   * InvalidRelationObjectError constructor
   * 
   * @param {String} name of the relationship
   * @constructor
   */ 
  constructor(name) {
    super(`The relationship ${name} must be an object of type 'Relation'`)
  }
  
}

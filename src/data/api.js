
var _ = require('underscore')

module.exports = dataAPI

function dataAPI(Model) {
  
  /**
   * Identifier getter
   */
  Model.prototype.getId = function getId() { 
    return this.get(this.getKeyName())
  }
  
  /**
   * Identifier setter
   */
  Model.prototype.setId = function setId(id) {
    this.set(this.getKeyName(), id)
    return this
  }
  
  /**
   * Set model attributes
   */
  Model.prototype.set = function set(key, val) {
    if ( _.isObject(key) ) this.data.fill(key)
    else this.data.set(key, val)
    return this
  }

  /**
   * Get the value of an attribute.
   * 
   * @param {String} attr name
   */
  Model.prototype.get = function get(attr) {
    return this.data.get(attr)
  }

  /**
   * @param {String} attr name
   */
  Model.prototype.has = function has(attr) {
    return this.data.has(attr)
  }

  /**
   * 
   */
  Model.prototype.isNew = function isNew() {
    return !this.has(this.getKeyName())
  }

  /**
   * 
   */
  Model.prototype.toJSON = function toJSON() {
    return this.data.toJSON()
  }

  /**
   * @param {String} attr name
   */
  Model.prototype.isDirty = function isDirty(attr) {
    return this.data.isDirty(attr)
  }
  
  /**
   * 
   */
  Model.prototype.getDirty = function getDirty() {
    return this.data.getDirty()
  }
  
  /**
   * 
   */
  Model.prototype.serialize = function serialize() {
    return this.data.serialize()
  }
  
  /**
   * Setup model's data
   * 
   * @private
   */
  Model.prototype._initData = function _initData(data) {
    var DataClass = require('./container')
    
    // define model's data object
    this.data = new DataClass(this, data || {})
  }
  
}
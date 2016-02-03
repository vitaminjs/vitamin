/* global define */
/**
 * 
 */
(function(root, factory) {
	
	if ( typeof define === 'function' && define.amd ) {
		define(['underscore'], factory);
	}
	else if ( typeof exports === 'object' ) {
		module.exports = factory(require('underscore'));
	}
	else {
		factory(root._);
	}
	
})(this, function(_) {
  'use strict';
  
  /**
   * 
   */
  function dataAPI(Model) {
    
    /**
     * attribute proxy definer
     */
    function proxy(obj, key) {
      Object.defineProperty(obj, key, {
          enumerable: true,
          configurable: true,
          set: function setter(value) { this.set(key, value) },
          get: function getter() { return this.get(key) }
      })
    }
    
    /**
     * Validator of schema property
     * 
     * @param {Object} property descriptor
     * @param {any} value
     */
    function validate(prop, value) {
      if ( value == null && prop.required === true ) return false;
      
      var valid = true,
          type = prop.type;
      
      if ( type ) {
        // boolean values
        if ( type === Boolean ) valid = _.isBoolean(value);
        
        // string values
        else if ( type === String ) valid = _.isString(value);
        
        // numeric values
        else if ( type === Number ) valid = _.isNumber(value);
        
        // date values
        else if ( type === Date ) valid = _.isDate(value);
        
        // object values
        else if ( type === Object ) valid = _.isObject(value);
        
        // array values
        else if ( type === Array ) valid = _.isArray(value);
        
        // custom types
        else { valid = value instanceof type }
      }
      
      // use custom validator
      if ( _.isFunction(prop.validator) ) {
        valid = prop.validator.call(null, value);
      }
      
      return valid;
    }
    
    /**
     * Coerce attribute value
     */
    function coerce(prop, value) {
      if ( _.isFunction(prop.coerce) ) {
        return prop.coerce.call(null, value)
      }
      
      return value;
    }
    
    /**
     * A setter/getter for primary key attribute
     */
    Model.prototype.pk = function primaryKey(id) {
      if ( id ) this.set(this.$options.pk, id);
      
      return this.get(this.$options.pk);
    }
    
    /**
     * Set model attributes
     */
    Model.prototype.set = function set(attr, val, options) {
      if ( _.isEmpty(attr) ) return this;
      
      var attributes = {};
        
      if ( _.isObject(attr) ) {
        attributes = attr;
        options = val;
      }
      else {
        attributes[attr] = val;
      }
      
      options = _.extend({validate: true}, options);
      
      // update model state
      var changing = this.$state.changing;
      this.$state.changing = true;
      if (! changing ) {
        this.$state.previous = this.toJSON();
        this.$state.changed = {};
      }
      
      // for each attribute, update the current value.
      for ( attr in attributes ) {
        val = attributes[attr];
        
        // set the attribute's new value
        this._set(attr, val, options); 
        
        // define a proxy for that attribute
        if (! _.has(this, attr) ) proxy(this, attr);
      }
      
      // prevent emit global change event in `changing` state
      if ( changing ) return this;
      
      // trigger global change event
      if ( !options.silent && this.hasChanged() ) {
        this.emit('change', this.$state.changed, this, options);
      }
      
      // remove changing state
      this.$state.changing = false;
      
      return this;
    }
    
    /**
     * Get the value of an attribute.
     */
    Model.prototype.get = function get(attr) {
        return this.$data[attr];
    }
    
    /**
     * 
     */
    Model.prototype.has = function has(attr) {
      return !_.isUndefined(this.$data[attr]);
    }
    
    /**
     * 
     */
    Model.prototype.isNew = function isNew() {
        return !this.has(this.$options.pk);
    }
    
    /**
     * 
     */
    Model.prototype.toJSON = function toJSON() {
        return _.clone(this.$data);
    }
    
    /**
     * 
     */
    Model.prototype.hasChanged = function hasChanged(attr) {
      if ( attr == null ) return !_.isEmpty(this.$state.changed);
      
      return _.has(this.$state.changed, attr);
    }
        
    /**
     * 
     */
    Model.prototype.clear = function clear(options) {
        var attrs = {};
        
        for ( var key in this.$data ) attrs[key] = void 0;
        this.set(attrs, options);
    }
    
    /**
     * Validate and set attribute value
     * 
     * @return {boolean} false if no changes made or invalid value
     * @private
     */
    Model.prototype._set = function _set(key, newVal, options) {
      var oldVal = this.$data[key],
          prop = this.$options.schema[key] || {};
      
      // coerce value
      newVal = coerce(prop, newVal);
      
      // validate the new value
      if ( options.validate && validate(prop, newVal) ) return false;
      
      // if no changes, return false
      if ( oldVal === newVal ) return false;
      
      this.$data[key] = newVal;
      this.$state.changed[key] = newVal;
      
      if (! options.silent ) this.emit('change:' + key, newVal, this);
    }
    
    /**
     * Normalize schema object and set default attributes
     * 
     * @private
     */
    Model.prototype._initSchema = function _initSchema() {
      var props = this.$options.schema;
      
      _.each(props, function(options, name) {
        // normalize schema object format
        if ( _.isFunction(options) ) props[name] = {'type': options};
        
        // set attribute default value
        if ( _.has(options, 'default') ) {
          this.set(name, options.default, {silent: true})
        }
      }, this)
    }
    
  }
  
  /**
   * 
   */
  function eventsAPI(Model) {
    
    /**
     * Channel event emitter
     */
    var EventChannel = (function() {
      
      /**
       * Channel constructor
       */
      function Channel() { this.events = {} }
      
      /**
       * 
       */
      Channel.prototype.subscribe = function subscribe(event, fn) {
        var events = this.events;
        
        _.each(event.split(" "), function(name) {
          if ( name.trim() ) {
            (events[name] || (events[name] = [])).push(fn)
          }
        })
      }
      
      /**
       * 
       */
      Channel.prototype.publish = function publish(event) {
        var cbs = this.events[event],
            args = _.rest(arguments);
        
        if (! cbs ) return;
        
        for (var i = 0; i < cbs.length; i++) {
          var fn = cbs[i];
          if ( fn.apply(null, args) === false ) break;
        }
      }
      
      /**
       * 
       */
      Channel.prototype.unsubscribe = function unsubscribe(event, fn) {
        // all events
        if (! arguments.length ) {
            this.events = {};
            return;
        }
        
        // specific event
        var cbs = this.events[event];
        if ( cbs ) {
            this.events[event] = null;
            return;
        }
        
        // specific handler
        var i = cbs.length;
        while ( i-- ) {
            var cb = cbs[i];
            
            if ( cb === fn || cb.fn === fn ) {
                cbs.splice(i, 1);
                return;
            }
        }
      }
      
      return Channel;
      
    })()
    
    /**
     * 
     */
    Model.prototype.on = function on(event, fn, context) {
      this.$options.channel.subscribe(event, _.bind(fn, context || this));
      
      return this;
    }
    
    /**
     * 
     */
    Model.prototype.once = function once(event, fn, context) {
      var model = this;
      
      function on() {
        model.off(event, on);
        fn.apply(context || model, arguments);
      }
      
      // useful when we want to remove a handler not yet triggered
      on.fn = fn;
      this.$options.channel.subscribe(event, on);
      
      return this;
    }
    
    /**
     * 
     */
    Model.prototype.off = function off(event, fn) {
      this.$options.channel.unsubscribe(event, fn);
      
      return this;
    }
    
    /**
     * 
     */
    Model.prototype.emit = 
    Model.prototype.trigger = function emit(event) {
      var channel = this.$options.channel;
      
      channel.publish.apply(channel, arguments);
      
      return this;
    }
    
    /**
     * init and register event callbacks
     */
    Model.prototype._initEvents = function() {
      var self = this;
      
      function register(cbs, event) {
          _.each(cbs, function(fn) {
              if ( _.isString(fn) ) fn = self[fn];
              
              if (! _.isFunction(fn) ) return;
              
              self.on(event, fn);
          });
      };
      
      this.$options.channel = new EventChannel;
      
      _.each(this.$options.events, register);
    }
    
  }
  
  /**
   * Helper to merge options from parent class to subclasses
   */
  function mergeOptions(parent, child) {
    var options = _.extend({}, parent);
    
    if (! child ) return options;
    if (! parent ) return child;
    
    function mergeField(key, newVal, oldVal) {
      switch (key) {
        case 'events':
          return mergeEvents(newVal, oldVal);
        
        default: 
          return newVal; 
      }
    };
    
    function mergeEvents(to, from) {
      var events = _.extend({}, from);
      
      // for each event, push all callbacks into an array
      _.each(to, function(cb, e) {
        // using Array.concat() prevent copying references,
        // by returning a new array object
        events[e] = [].concat(events[e] || [], [cb]);
      });
      
      return events;
    };
    
    // iterate over child options
    _.each(child, function(val, key) {
      options[key] = mergeField(key, val, options[key]);
    });
    
    return options;
  }
  
  /**
   * Vitamin model constructor
   */
  var Vitamin = function Vitamin() { this.init.apply(this, arguments) }
  
  /**
   * Default Vitamin options
   */
  Vitamin.options = {
    
    // model schema definition
    'schema': {},
    
    // primary key name
    'pk': "id"
    
  }
  
  /**
   * Set up correctly the prototype chain for subclasses
   * 
   * @static
   */
  Vitamin.extend = function extend(props, options) {
    var Super = this;
    
    // Default constructor simply calls the parent constructor
    function Model() { Super.apply(this, arguments) }
    
    // Set the prototype chain to inherit from `parent`
    Model.prototype = Object.create(Super.prototype, { constructor: { value: Model } });
    
    // Add static and instance properties
    _.extend(Model, Super);
    _.extend(Model.prototype, props);
    
    // merge options
    Model.options = mergeOptions(Super.options, options);
    
    // return the final product
    return Model;
  }
  
  /**
   * Use a plugin as many as necessary
   * 
   * @param {Function|Object} an object with `install` method, or simply a function
   */
  Vitamin.use = function use(plugin) {
      if ( plugin.installed === true ) return this;
      
      var args = _.rest(arguments);
      
      args.unshift(this);
      
      if ( _.isFunction(plugin.install) ) {
          plugin.install.apply(null, args);
      }
      else {
          plugin.apply(null, args);
      }
      
      return this;
  }
  
  /**
   * Use a plugin once
   */
  Vitamin.useOnce = function useOnce(plugin) {
    this.use(plugin);
    
    // prevent reuse the same plugin next time
    plugin.installed = true;
    
    return this;
  }
    
  /**
   * 
   */
  Vitamin.prototype.init = function init(data, options) {
    // define unenumerable attributes
    Object.defineProperty(this, '$data', { value: {} });
    Object.defineProperty(this, '$state', { value: {} });
    Object.defineProperty(this, '$options', {
      value: mergeOptions(this.constructor.options, options)
    });
    
    // define a unique client identifier
    Object.defineProperty(this, 'cid', { value: _.uniqueId('___') });
    
    // register events
    this._initEvents();
    
    // init model schema
    this._initSchema();
    
    // set data
    this.set(data);
    this.$state.changed = {};
    
    this.emit('init', this);
  };
  
  Vitamin
    .useOnce(dataAPI)
    .useOnce(eventsAPI)
  
  // module exports
  return Vitamin;
  
})
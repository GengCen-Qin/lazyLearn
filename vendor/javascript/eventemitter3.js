// eventemitter3@4.0.7 downloaded from https://ga.jspm.io/npm:eventemitter3@4.0.7/index.js

var e={};var t=Object.prototype.hasOwnProperty,n="~";function Events(){}if(Object.create){Events.prototype=Object.create(null);(new Events).__proto__||(n=false)}
/**
 * Representation of a single event listener.
 *
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
 * @constructor
 * @private
 */function EE(e,t,n){this.fn=e;this.context=t;this.once=n||false}
/**
 * Add a listener for a given event.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} context The context to invoke the listener with.
 * @param {Boolean} once Specify if the listener is a one-time listener.
 * @returns {EventEmitter}
 * @private
 */function addListener(e,t,r,s,o){if("function"!==typeof r)throw new TypeError("The listener must be a function");var i=new EE(r,s||e,o),v=n?n+t:t;e._events[v]?e._events[v].fn?e._events[v]=[e._events[v],i]:e._events[v].push(i):(e._events[v]=i,e._eventsCount++);return e}
/**
 * Clear event by name.
 *
 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
 * @param {(String|Symbol)} evt The Event name.
 * @private
 */function clearEvent(e,t){0===--e._eventsCount?e._events=new Events:delete e._events[t]}function EventEmitter(){this._events=new Events;this._eventsCount=0}
/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @public
 */EventEmitter.prototype.eventNames=function eventNames(){var e=[],r,s;if(0===this._eventsCount)return e;for(s in r=this._events)t.call(r,s)&&e.push(n?s.slice(1):s);return Object.getOwnPropertySymbols?e.concat(Object.getOwnPropertySymbols(r)):e};
/**
 * Return the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Array} The registered listeners.
 * @public
 */EventEmitter.prototype.listeners=function listeners(e){var t=n?n+e:e,r=this._events[t];if(!r)return[];if(r.fn)return[r.fn];for(var s=0,o=r.length,i=new Array(o);s<o;s++)i[s]=r[s].fn;return i};
/**
 * Return the number of listeners listening to a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Number} The number of listeners.
 * @public
 */EventEmitter.prototype.listenerCount=function listenerCount(e){var t=n?n+e:e,r=this._events[t];return r?r.fn?1:r.length:0};
/**
 * Calls each of the listeners registered for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @returns {Boolean} `true` if the event had listeners, else `false`.
 * @public
 */EventEmitter.prototype.emit=function emit(e,t,r,s,o,i){var v=n?n+e:e;if(!this._events[v])return false;var c=this._events[v],a=arguments.length,f,l;if(c.fn){c.once&&this.removeListener(e,c.fn,void 0,true);switch(a){case 1:return c.fn.call(c.context),true;case 2:return c.fn.call(c.context,t),true;case 3:return c.fn.call(c.context,t,r),true;case 4:return c.fn.call(c.context,t,r,s),true;case 5:return c.fn.call(c.context,t,r,s,o),true;case 6:return c.fn.call(c.context,t,r,s,o,i),true}for(l=1,f=new Array(a-1);l<a;l++)f[l-1]=arguments[l];c.fn.apply(c.context,f)}else{var u=c.length,E;for(l=0;l<u;l++){c[l].once&&this.removeListener(e,c[l].fn,void 0,true);switch(a){case 1:c[l].fn.call(c[l].context);break;case 2:c[l].fn.call(c[l].context,t);break;case 3:c[l].fn.call(c[l].context,t,r);break;case 4:c[l].fn.call(c[l].context,t,r,s);break;default:if(!f)for(E=1,f=new Array(a-1);E<a;E++)f[E-1]=arguments[E];c[l].fn.apply(c[l].context,f)}}}return true};
/**
 * Add a listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */EventEmitter.prototype.on=function on(e,t,n){return addListener(this,e,t,n,false)};
/**
 * Add a one-time listener for a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn The listener function.
 * @param {*} [context=this] The context to invoke the listener with.
 * @returns {EventEmitter} `this`.
 * @public
 */EventEmitter.prototype.once=function once(e,t,n){return addListener(this,e,t,n,true)};
/**
 * Remove the listeners of a given event.
 *
 * @param {(String|Symbol)} event The event name.
 * @param {Function} fn Only remove the listeners that match this function.
 * @param {*} context Only remove the listeners that have this context.
 * @param {Boolean} once Only remove one-time listeners.
 * @returns {EventEmitter} `this`.
 * @public
 */EventEmitter.prototype.removeListener=function removeListener(e,t,r,s){var o=n?n+e:e;if(!this._events[o])return this;if(!t){clearEvent(this,o);return this}var i=this._events[o];if(i.fn)i.fn!==t||s&&!i.once||r&&i.context!==r||clearEvent(this,o);else{for(var v=0,c=[],a=i.length;v<a;v++)(i[v].fn!==t||s&&!i[v].once||r&&i[v].context!==r)&&c.push(i[v]);c.length?this._events[o]=1===c.length?c[0]:c:clearEvent(this,o)}return this};
/**
 * Remove all listeners, or those of the specified event.
 *
 * @param {(String|Symbol)} [event] The event name.
 * @returns {EventEmitter} `this`.
 * @public
 */EventEmitter.prototype.removeAllListeners=function removeAllListeners(e){var t;if(e){t=n?n+e:e;this._events[t]&&clearEvent(this,t)}else{this._events=new Events;this._eventsCount=0}return this};EventEmitter.prototype.off=EventEmitter.prototype.removeListener;EventEmitter.prototype.addListener=EventEmitter.prototype.on;EventEmitter.prefixed=n;EventEmitter.EventEmitter=EventEmitter;e=EventEmitter;var r=e;export default r;


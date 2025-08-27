/**
 * @module @vorthain/nexus
 * @description Lightweight, type-safe event hub for JavaScript applications
 * @author Vorthain
 * @license MIT
 */

/**
 * Create a strongly-typed event hub with autocomplete for event names and runtime debugging.
 *
 * @template {string} T
 * @param {T[]} eventNames - List of allowed event names
 * @returns {{
 *   on(eventName: T, id: string, callback: (data?: any) => void): typeof hub,
 *   once(eventName: T, id: string, callback: (data?: any) => void): typeof hub,
 *   off(eventName: T, id?: string): typeof hub,
 *   emit(eventName: T, data?: any): boolean,
 *   clear(eventName?: T): typeof hub,
 *   listenerCount(eventName?: T): number,
 *   listeners(eventName?: T): Function[],
 *   eventNames(): T[],
 *   setDebug(enabled: boolean | T[]): typeof hub,
 *   setLogger(fn: (eventName: T, data: any) => void): typeof hub
 * }}
 */
export function createNexusHub(eventNames) {
  // Validate input
  if (!Array.isArray(eventNames)) {
    throw new TypeError('Event names must be an array');
  }

  if (eventNames.length === 0) {
    throw new Error('At least one event name must be provided');
  }

  // Check for duplicate event names
  const uniqueNames = new Set(eventNames);
  if (uniqueNames.size !== eventNames.length) {
    throw new Error('Duplicate event names are not allowed');
  }

  // Initialize callbacks object with null prototype for security
  const callbacks = Object.create(null);
  const validEvents = new Set(eventNames);

  for (const name of eventNames) {
    if (typeof name !== 'string') {
      throw new TypeError(`Event name must be a string, got ${typeof name}`);
    }
    callbacks[name] = Object.create(null);
  }

  // Debug configuration
  let debugAll = false;
  /** @type {Set<T> | null} */
  let debugFilter = null;

  /** @type {(eventName: T, data: any) => void} */
  let logger = (eventName, data) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [nexus:emit] ${eventName}`, data);
  };

  // Track once listeners for proper cleanup
  const onceWrappers = new WeakMap();

  const hub = {
    /**
     * Subscribe to an event
     * @param {T} eventName - Event to subscribe to
     * @param {string} id - Unique identifier for this listener
     * @param {Function} callback - Function to call when event is emitted
     */
    on(eventName, id, callback) {
      if (!validEvents.has(eventName)) {
        throw new Error(`Event "${eventName}" is not registered. Valid events: ${[...validEvents].join(', ')}`);
      }

      if (typeof id !== 'string' || id.trim() === '') {
        throw new TypeError('Listener ID must be a non-empty string');
      }

      if (typeof callback !== 'function') {
        throw new TypeError('Callback must be a function');
      }

      callbacks[eventName][id] = callback;
      return hub;
    },

    /**
     * Subscribe to an event once
     * @param {T} eventName - Event to subscribe to
     * @param {string} id - Unique identifier for this listener
     * @param {Function} callback - Function to call when event is emitted
     */
    once(eventName, id, callback) {
      if (!validEvents.has(eventName)) {
        throw new Error(`Event "${eventName}" is not registered. Valid events: ${[...validEvents].join(', ')}`);
      }

      if (typeof callback !== 'function') {
        throw new TypeError('Callback must be a function');
      }

      const wrapper = (data) => {
        callback(data);
        hub.off(eventName, id);
      };

      // Track the wrapper so we can properly clean it up if needed
      onceWrappers.set(callback, wrapper);

      return hub.on(eventName, id, wrapper);
    },

    /**
     * Unsubscribe from an event
     * @param {T} eventName - Event to unsubscribe from
     * @param {string} [id] - Listener ID to remove (if not provided, removes all listeners)
     */
    off(eventName, id) {
      if (!validEvents.has(eventName)) {
        throw new Error(`Event "${eventName}" is not registered. Valid events: ${[...validEvents].join(', ')}`);
      }

      if (id === undefined) {
        // Clear all listeners for this event
        callbacks[eventName] = Object.create(null);
      } else {
        if (typeof id !== 'string') {
          throw new TypeError('Listener ID must be a string');
        }
        delete callbacks[eventName][id];
      }

      return hub;
    },

    /**
     * Emit an event
     * @param {T} eventName - Event to emit
     * @param {any} [data] - Data to pass to listeners
     * @returns {boolean} True if there were listeners
     */
    emit(eventName, data) {
      if (!validEvents.has(eventName)) {
        throw new Error(`Event "${eventName}" is not registered. Valid events: ${[...validEvents].join(', ')}`);
      }

      const cbs = callbacks[eventName];
      const listeners = Object.values(cbs);

      if (debugAll || (debugFilter && debugFilter.has(eventName))) {
        logger(eventName, data);
      }

      // Execute callbacks in a try-catch to prevent one error from breaking all
      let errors = [];
      listeners.forEach((cb) => {
        try {
          cb(data);
        } catch (error) {
          errors.push(error);
          console.error(`Error in listener for event "${eventName}":`, error);
        }
      });

      // If there were errors and we're in debug mode, report them
      if (errors.length > 0 && (debugAll || (debugFilter && debugFilter.has(eventName)))) {
        console.error(`[nexus] ${errors.length} error(s) occurred while emitting "${eventName}"`);
      }

      return listeners.length > 0;
    },

    /**
     * Clear listeners
     * @param {T} [eventName] - Clear specific event or all if not provided
     */
    clear(eventName) {
      if (eventName !== undefined) {
        if (!validEvents.has(eventName)) {
          throw new Error(`Event "${eventName}" is not registered. Valid events: ${[...validEvents].join(', ')}`);
        }
        callbacks[eventName] = Object.create(null);
      } else {
        // Clear all events
        for (const name of eventNames) {
          callbacks[name] = Object.create(null);
        }
      }
      return hub;
    },

    /**
     * Get listener count
     * @param {T} [eventName] - Get count for specific event or total if not provided
     * @returns {number} Number of listeners
     */
    listenerCount(eventName) {
      if (eventName !== undefined) {
        if (!validEvents.has(eventName)) {
          throw new Error(`Event "${eventName}" is not registered. Valid events: ${[...validEvents].join(', ')}`);
        }
        return Object.keys(callbacks[eventName]).length;
      } else {
        // Return total count across all events
        return eventNames.reduce((total, name) => {
          return total + Object.keys(callbacks[name]).length;
        }, 0);
      }
    },

    /**
     * Get listeners
     * @param {T} [eventName] - Get listeners for specific event or all if not provided
     * @returns {Function[]} Array of listener functions
     */
    listeners(eventName) {
      if (eventName !== undefined) {
        if (!validEvents.has(eventName)) {
          throw new Error(`Event "${eventName}" is not registered. Valid events: ${[...validEvents].join(', ')}`);
        }
        return Object.values(callbacks[eventName]);
      } else {
        // Return all listeners across all events
        return eventNames.reduce((all, name) => {
          return all.concat(Object.values(callbacks[name]));
        }, []);
      }
    },

    /**
     * Get all registered event names
     * @returns {T[]} Array of event names
     */
    eventNames() {
      return [...eventNames];
    },

    /**
     * Enable debug mode
     * @param {boolean | T[]} enabled - true = all events, false = off, array = specific events
     */
    setDebug(enabled) {
      if (enabled === true) {
        debugAll = true;
        debugFilter = null;
      } else if (enabled === false) {
        debugAll = false;
        debugFilter = null;
      } else if (Array.isArray(enabled)) {
        // Validate all events in the filter exist
        for (const event of enabled) {
          if (!validEvents.has(event)) {
            throw new Error(`Event "${event}" is not registered. Valid events: ${[...validEvents].join(', ')}`);
          }
        }
        debugAll = false;
        debugFilter = new Set(enabled);
      } else {
        throw new TypeError('Debug must be boolean or array of event names');
      }
      return hub;
    },

    /**
     * Set a custom logger function
     * @param {(eventName: T, data: any) => void} fn
     */
    setLogger(fn) {
      if (typeof fn !== 'function') {
        throw new TypeError('Logger must be a function');
      }
      logger = fn;
      return hub;
    },
  };

  return hub;
}

// Default export
export default createNexusHub;

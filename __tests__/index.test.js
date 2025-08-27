/**
 * @jest-environment jsdom
 */

import { createNexusHub } from '../src/index.js';

describe('Nexus Event Hub', () => {
  describe('Module exports', () => {
    test('exports createNexusHub function', () => {
      expect(typeof createNexusHub).toBe('function');
    });
  });

  describe('Initialization', () => {
    test('creates event hub with valid event names', () => {
      const hub = createNexusHub(['click', 'change', 'submit']);
      expect(hub).toBeDefined();
      expect(typeof hub.on).toBe('function');
      expect(typeof hub.emit).toBe('function');
    });

    test('throws error for non-array event names', () => {
      expect(() => createNexusHub('not-an-array')).toThrow('Event names must be an array');
      expect(() => createNexusHub(123)).toThrow('Event names must be an array');
      expect(() => createNexusHub(null)).toThrow('Event names must be an array');
    });

    test('throws error for empty event names array', () => {
      expect(() => createNexusHub([])).toThrow('At least one event name must be provided');
    });

    test('throws error for duplicate event names', () => {
      expect(() => createNexusHub(['click', 'change', 'click'])).toThrow('Duplicate event names are not allowed');
    });

    test('throws error for non-string event names', () => {
      expect(() => createNexusHub([123, 'valid'])).toThrow('Event name must be a string');
      expect(() => createNexusHub([null, 'valid'])).toThrow('Event name must be a string');
    });

    test('returns all registered event names', () => {
      const events = ['click', 'change', 'submit'];
      const hub = createNexusHub(events);
      expect(hub.eventNames()).toEqual(events);
    });
  });

  describe('Event subscription (on)', () => {
    let hub;

    beforeEach(() => {
      hub = createNexusHub(['click', 'change', 'submit']);
    });

    test('subscribes to valid events', () => {
      const callback = jest.fn();
      const result = hub.on('click', 'listener1', callback);
      expect(result).toBe(hub); // Should return hub for chaining
    });

    test('throws error for invalid event name', () => {
      const callback = jest.fn();
      expect(() => hub.on('invalid', 'id', callback)).toThrow('Event "invalid" is not registered');
    });

    test('throws error for invalid listener ID', () => {
      const callback = jest.fn();
      expect(() => hub.on('click', '', callback)).toThrow('Listener ID must be a non-empty string');
      expect(() => hub.on('click', 123, callback)).toThrow('Listener ID must be a non-empty string');
      expect(() => hub.on('click', '  ', callback)).toThrow('Listener ID must be a non-empty string');
    });

    test('throws error for non-function callback', () => {
      expect(() => hub.on('click', 'id', 'not-a-function')).toThrow('Callback must be a function');
      expect(() => hub.on('click', 'id', null)).toThrow('Callback must be a function');
    });

    test('allows multiple listeners with different IDs', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      hub.on('click', 'listener1', callback1);
      hub.on('click', 'listener2', callback2);

      hub.emit('click', 'test');

      expect(callback1).toHaveBeenCalledWith('test');
      expect(callback2).toHaveBeenCalledWith('test');
    });

    test('overwrites listener with same ID', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      hub.on('click', 'listener1', callback1);
      hub.on('click', 'listener1', callback2); // Same ID

      hub.emit('click');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    test('supports method chaining', () => {
      const callback = jest.fn();
      const result = hub.on('click', 'id1', callback).on('change', 'id2', callback).on('submit', 'id3', callback);

      expect(result).toBe(hub);
    });
  });

  describe('Event subscription once (once)', () => {
    let hub;

    beforeEach(() => {
      hub = createNexusHub(['click', 'change']);
    });

    test('executes callback only once', () => {
      const callback = jest.fn();
      hub.once('click', 'once-listener', callback);

      hub.emit('click', 'first');
      hub.emit('click', 'second');
      hub.emit('click', 'third');

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('first');
    });

    test('removes listener after execution', () => {
      const callback = jest.fn();
      hub.once('click', 'once-listener', callback);

      expect(hub.listenerCount('click')).toBe(1);
      hub.emit('click');
      expect(hub.listenerCount('click')).toBe(0);
    });

    test('throws error for invalid event', () => {
      expect(() => hub.once('invalid', 'id', jest.fn())).toThrow('Event "invalid" is not registered');
    });

    test('throws error for non-function callback', () => {
      expect(() => hub.once('click', 'id', 'not-a-function')).toThrow('Callback must be a function');
    });
  });

  describe('Event unsubscription (off)', () => {
    let hub;

    beforeEach(() => {
      hub = createNexusHub(['click', 'change']);
    });

    test('removes specific listener by ID', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      hub.on('click', 'listener1', callback1);
      hub.on('click', 'listener2', callback2);

      hub.off('click', 'listener1');
      hub.emit('click');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    test('removes all listeners when ID not provided', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      hub.on('click', 'listener1', callback1);
      hub.on('click', 'listener2', callback2);

      hub.off('click');
      hub.emit('click');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    test('throws error for invalid event', () => {
      expect(() => hub.off('invalid', 'id')).toThrow('Event "invalid" is not registered');
    });

    test('throws error for non-string ID when provided', () => {
      expect(() => hub.off('click', 123)).toThrow('Listener ID must be a string');
    });

    test('handles removing non-existent listener gracefully', () => {
      expect(() => hub.off('click', 'non-existent')).not.toThrow();
    });

    test('supports method chaining', () => {
      const result = hub.off('click', 'id').off('change');
      expect(result).toBe(hub);
    });
  });

  describe('Event emission (emit)', () => {
    let hub;

    beforeEach(() => {
      hub = createNexusHub(['click', 'error']);
    });

    test('emits event to all listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      hub.on('click', 'listener1', callback1);
      hub.on('click', 'listener2', callback2);

      const hadListeners = hub.emit('click', { x: 10, y: 20 });

      expect(hadListeners).toBe(true);
      expect(callback1).toHaveBeenCalledWith({ x: 10, y: 20 });
      expect(callback2).toHaveBeenCalledWith({ x: 10, y: 20 });
    });

    test('returns false when no listeners', () => {
      const hadListeners = hub.emit('click');
      expect(hadListeners).toBe(false);
    });

    test('throws error for invalid event', () => {
      expect(() => hub.emit('invalid')).toThrow('Event "invalid" is not registered');
    });

    test('handles listener errors gracefully', () => {
      const goodCallback = jest.fn();
      const badCallback = jest.fn(() => {
        throw new Error('Listener error');
      });
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      hub.on('error', 'good', goodCallback);
      hub.on('error', 'bad', badCallback);

      const hadListeners = hub.emit('error', 'data');

      expect(hadListeners).toBe(true);
      expect(goodCallback).toHaveBeenCalledWith('data');
      expect(badCallback).toHaveBeenCalledWith('data');
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });

    test('logs error count in debug mode when listeners throw', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      // Enable debug mode for all events
      hub.setDebug(true);

      // Add multiple failing listeners
      hub.on('error', 'bad1', () => {
        throw new Error('Error 1');
      });
      hub.on('error', 'bad2', () => {
        throw new Error('Error 2');
      });
      hub.on('error', 'good', jest.fn()); // This one succeeds

      hub.emit('error', 'test');

      // Should log individual errors
      expect(consoleError).toHaveBeenCalledWith('Error in listener for event "error":', expect.any(Error));

      // Should log the error count message
      expect(consoleError).toHaveBeenCalledWith('[nexus] 2 error(s) occurred while emitting "error"');

      consoleError.mockRestore();
    });

    test('logs error count with filtered debug when listeners throw', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      // Enable debug mode only for 'error' event
      hub.setDebug(['error']);

      // Add failing listeners
      hub.on('error', 'bad1', () => {
        throw new Error('Error 1');
      });
      hub.on('error', 'bad2', () => {
        throw new Error('Error 2');
      });

      hub.emit('error', 'test');

      // Should log the error count message because 'error' is in debug filter
      expect(consoleError).toHaveBeenCalledWith('[nexus] 2 error(s) occurred while emitting "error"');

      consoleError.mockRestore();
    });

    test('emits undefined when no data provided', () => {
      const callback = jest.fn();
      hub.on('click', 'listener', callback);
      hub.emit('click');
      expect(callback).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Clear functionality', () => {
    let hub;

    beforeEach(() => {
      hub = createNexusHub(['click', 'change', 'submit']);
    });

    test('clears specific event listeners', () => {
      const clickCallback = jest.fn();
      const changeCallback = jest.fn();

      hub.on('click', 'l1', clickCallback);
      hub.on('change', 'l2', changeCallback);

      hub.clear('click');

      hub.emit('click');
      hub.emit('change');

      expect(clickCallback).not.toHaveBeenCalled();
      expect(changeCallback).toHaveBeenCalled();
    });

    test('clears all event listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      hub.on('click', 'l1', callback1);
      hub.on('change', 'l2', callback2);
      hub.on('submit', 'l3', callback3);

      hub.clear();

      hub.emit('click');
      hub.emit('change');
      hub.emit('submit');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();
    });

    test('throws error for invalid event', () => {
      expect(() => hub.clear('invalid')).toThrow('Event "invalid" is not registered');
    });

    test('supports method chaining', () => {
      const result = hub.clear('click').clear();
      expect(result).toBe(hub);
    });
  });

  describe('Listener count and listing', () => {
    let hub;

    beforeEach(() => {
      hub = createNexusHub(['click', 'change']);
    });

    test('counts listeners for specific event', () => {
      hub.on('click', 'l1', () => {});
      hub.on('click', 'l2', () => {});
      hub.on('change', 'l3', () => {});

      expect(hub.listenerCount('click')).toBe(2);
      expect(hub.listenerCount('change')).toBe(1);
    });

    test('counts total listeners when no event specified', () => {
      hub.on('click', 'l1', () => {});
      hub.on('click', 'l2', () => {});
      hub.on('change', 'l3', () => {});

      expect(hub.listenerCount()).toBe(3);
    });

    test('returns listener functions for specific event', () => {
      const fn1 = () => {};
      const fn2 = () => {};

      hub.on('click', 'l1', fn1);
      hub.on('click', 'l2', fn2);

      const listeners = hub.listeners('click');
      expect(listeners).toContain(fn1);
      expect(listeners).toContain(fn2);
      expect(listeners.length).toBe(2);
    });

    test('returns all listeners when no event specified', () => {
      const fn1 = () => {};
      const fn2 = () => {};
      const fn3 = () => {};

      hub.on('click', 'l1', fn1);
      hub.on('click', 'l2', fn2);
      hub.on('change', 'l3', fn3);

      const listeners = hub.listeners();
      expect(listeners).toContain(fn1);
      expect(listeners).toContain(fn2);
      expect(listeners).toContain(fn3);
      expect(listeners.length).toBe(3);
    });

    test('throws error for invalid event in listenerCount', () => {
      expect(() => hub.listenerCount('invalid')).toThrow('Event "invalid" is not registered');
    });

    test('throws error for invalid event in listeners', () => {
      expect(() => hub.listeners('invalid')).toThrow('Event "invalid" is not registered');
    });
  });

  describe('Debug functionality', () => {
    let hub;
    let consoleLog;

    beforeEach(() => {
      hub = createNexusHub(['click', 'change', 'submit']);
      consoleLog = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleLog.mockRestore();
    });

    test('logs all events when debug is true', () => {
      hub.setDebug(true);
      hub.on('click', 'l1', () => {});

      hub.emit('click', 'data1');
      hub.emit('change', 'data2');

      expect(consoleLog).toHaveBeenCalledTimes(2);
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('[nexus:emit] click'), 'data1');
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('[nexus:emit] change'), 'data2');
    });

    test('stops logging when debug is false', () => {
      hub.setDebug(true);
      hub.setDebug(false);

      hub.emit('click');
      expect(consoleLog).not.toHaveBeenCalled();
    });

    test('logs only specified events with array filter', () => {
      hub.setDebug(['click']);
      hub.on('click', 'l1', () => {});
      hub.on('change', 'l2', () => {});

      hub.emit('click', 'data1');
      hub.emit('change', 'data2');

      expect(consoleLog).toHaveBeenCalledTimes(1);
      expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining('[nexus:emit] click'), 'data1');
    });

    test('throws error for invalid events in debug filter', () => {
      expect(() => hub.setDebug(['invalid'])).toThrow('Event "invalid" is not registered');
    });

    test('throws error for invalid debug parameter', () => {
      expect(() => hub.setDebug('invalid')).toThrow('Debug must be boolean or array of event names');
      expect(() => hub.setDebug(123)).toThrow('Debug must be boolean or array of event names');
    });

    test('supports method chaining', () => {
      const result = hub.setDebug(true).setDebug(false);
      expect(result).toBe(hub);
    });
  });

  describe('Custom logger', () => {
    let hub;

    beforeEach(() => {
      hub = createNexusHub(['click']);
    });

    test('uses custom logger function', () => {
      const customLogger = jest.fn();
      hub.setLogger(customLogger);
      hub.setDebug(true);
      hub.on('click', 'l1', () => {});

      hub.emit('click', 'test-data');

      expect(customLogger).toHaveBeenCalledWith('click', 'test-data');
    });

    test('throws error for non-function logger', () => {
      expect(() => hub.setLogger('not-a-function')).toThrow('Logger must be a function');
      expect(() => hub.setLogger(null)).toThrow('Logger must be a function');
    });

    test('supports method chaining', () => {
      const result = hub.setLogger(() => {});
      expect(result).toBe(hub);
    });
  });

  describe('Complex scenarios', () => {
    test('handles rapid subscription/unsubscription', () => {
      const hub = createNexusHub(['test']);
      const callbacks = Array.from({ length: 100 }, () => jest.fn());

      // Add all listeners
      callbacks.forEach((cb, i) => hub.on('test', `listener${i}`, cb));
      expect(hub.listenerCount('test')).toBe(100);

      // Remove half
      for (let i = 0; i < 50; i++) {
        hub.off('test', `listener${i}`);
      }
      expect(hub.listenerCount('test')).toBe(50);

      // Emit and check
      hub.emit('test');
      callbacks.slice(0, 50).forEach((cb) => expect(cb).not.toHaveBeenCalled());
      callbacks.slice(50).forEach((cb) => expect(cb).toHaveBeenCalled());
    });

    test('maintains separate namespaces for different events', () => {
      const hub = createNexusHub(['event1', 'event2', 'event3']);
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      hub.on('event1', 'shared-id', callback1);
      hub.on('event2', 'shared-id', callback2);
      hub.on('event3', 'shared-id', callback3);

      hub.emit('event2', 'data');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith('data');
      expect(callback3).not.toHaveBeenCalled();
    });

    test('handles multiple once listeners correctly', () => {
      const hub = createNexusHub(['test']);
      const callbacks = Array.from({ length: 5 }, () => jest.fn());

      callbacks.forEach((cb, i) => hub.once('test', `once${i}`, cb));

      hub.emit('test', 'first');
      hub.emit('test', 'second');

      callbacks.forEach((cb) => {
        expect(cb).toHaveBeenCalledTimes(1);
        expect(cb).toHaveBeenCalledWith('first');
      });
    });
  });
});

# ⚡ @vorthain/nexus

[![npm](https://img.shields.io/npm/v/@vorthain/nexus.svg)](https://www.npmjs.com/package/@vorthain/nexus)
[![Downloads](https://img.shields.io/npm/dm/@vorthain/nexus.svg)](https://www.npmjs.com/package/@vorthain/nexus)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@vorthain/nexus)](https://bundlephobia.com/package/@vorthain/nexus)

A lightweight, type-safe pub/sub library for JavaScript applications. Create a central communication hub with strongly-typed events, built-in debugging, and zero dependencies.

## Why Nexus?

Building decoupled, maintainable applications often requires a reliable way for components to communicate without direct dependencies. Nexus provides:

- **Type Safety**: Define your events upfront and get autocomplete in modern IDEs
- **Debugging Built-in**: Toggle debug mode to see all events flowing through your system
- **Lightweight**: Zero dependencies
- **Predictable**: No wildcard events, no event bubbling, no hidden surprises
- **Battle-tested patterns**: Implements proven pub/sub patterns with a clean API

Perfect for:

- Decoupling components in large applications
- Managing application-wide events
- Building plugin systems
- Creating reactive architectures
- State synchronization across modules
- Inter-frame communication

## Installation

```bash
npm install @vorthain/nexus
```

## Quick Start

```javascript
import { createNexusHub } from '@vorthain/nexus';

// Define your events upfront
const hub = createNexusHub(['user:login', 'user:logout', 'data:updated', 'modal:open', 'modal:close']);

// Subscribe to events
hub.on('user:login', 'auth-handler', (user) => {
  console.log('User logged in:', user);
});

// Emit events
hub.emit('user:login', { id: 123, name: 'Alice' });
```

## Core Concepts

### Event Names Are Contracts

Unlike traditional event emitters, Nexus requires you to define all event names upfront. This provides:

- **Type safety** - Your IDE knows all valid events
- **Documentation** - Event names serve as API documentation
- **No typos** - Invalid event names throw errors immediately
- **Discoverability** - Use `hub.eventNames()` to see all available events

### Listener IDs Prevent Duplication

Every listener must have a unique ID per event. This prevents:

- Accidental duplicate subscriptions
- Memory leaks from forgotten listeners
- Makes debugging easier (you know exactly which listener is firing)

## API

### `createNexusHub(eventNames)`

Creates a new event hub with the specified event names.

```javascript
const hub = createNexusHub(['click', 'change', 'submit']);
```

### `hub.on(eventName, id, callback)`

Subscribe to an event.

```javascript
hub.on('click', 'button-handler', (data) => {
  console.log('Button clicked:', data);
});
```

### `hub.once(eventName, id, callback)`

Subscribe to an event once. The listener is automatically removed after the first emission.

```javascript
hub.once('submit', 'form-validator', (formData) => {
  console.log('Form submitted once:', formData);
});
```

### `hub.off(eventName, id?)`

Unsubscribe from an event. If no ID is provided, removes all listeners for that event.

```javascript
// Remove specific listener
hub.off('click', 'button-handler');

// Remove all listeners for an event
hub.off('click');
```

### `hub.emit(eventName, data?)`

Emit an event to all listeners. Returns `true` if there were listeners, `false` otherwise.

```javascript
const hadListeners = hub.emit('click', { x: 100, y: 200 });
if (!hadListeners) {
  console.log('No one was listening to click event');
}
```

### `hub.clear(eventName?)`

Clear listeners. If no event name provided, clears all listeners.

```javascript
// Clear specific event
hub.clear('click');

// Clear all events
hub.clear();
```

### `hub.listenerCount(eventName?)`

Get the number of listeners.

```javascript
// Count for specific event
const clickListeners = hub.listenerCount('click');

// Total count across all events
const totalListeners = hub.listenerCount();
```

### `hub.listeners(eventName?)`

Get array of listener functions.

```javascript
// Get listeners for specific event
const clickHandlers = hub.listeners('click');

// Get all listeners
const allHandlers = hub.listeners();
```

### `hub.eventNames()`

Get all registered event names.

```javascript
const events = hub.eventNames();
// ['click', 'change', 'submit']
```

### `hub.setDebug(enabled)`

Enable debug mode to log all events.

```javascript
// Log all events
hub.setDebug(true);

// Log specific events only
hub.setDebug(['click', 'submit']);

// Disable logging
hub.setDebug(false);
```

### `hub.setLogger(fn)`

Set a custom logger function.

```javascript
hub.setLogger((eventName, data) => {
  myLogger.log(`Event: ${eventName}`, data);
});
```

## Examples

### React

```javascript
// eventHub.js
import { createNexusHub } from '@vorthain/nexus';

export const appEvents = createNexusHub(['theme:change', 'notification:show', 'notification:hide', 'data:refresh']);
```

```javascript
// ThemeToggle.jsx
import { appEvents } from './eventHub';

function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const handleThemeChange = (newTheme) => setTheme(newTheme);

    appEvents.on('theme:change', 'theme-toggle-component', handleThemeChange);

    return () => {
      appEvents.off('theme:change', 'theme-toggle-component');
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    appEvents.emit('theme:change', newTheme);
  };

  return <button onClick={toggleTheme}>Current: {theme}</button>;
}
```

### Vue

```javascript
// eventHub.js
import { createNexusHub } from '@vorthain/nexus';

export const hub = createNexusHub(['cart:add', 'cart:remove', 'cart:clear', 'user:update']);

// Vue plugin
export default {
  install(app) {
    app.config.globalProperties.$hub = hub;
    app.provide('hub', hub);
  },
};
```

```javascript
// main.js
import { createApp } from 'vue';
import eventHubPlugin from './eventHub';

const app = createApp(App);
app.use(eventHubPlugin);
app.mount('#app');
```

```vue
<!-- Cart.vue -->
<script setup>
import { inject, onMounted, onUnmounted } from 'vue';

const hub = inject('hub');
const cartItems = ref([]);

const handleCartAdd = (item) => {
  cartItems.value.push(item);
};

onMounted(() => {
  hub.on('cart:add', 'cart-component', handleCartAdd);
});

onUnmounted(() => {
  hub.off('cart:add', 'cart-component');
});
</script>
```

### Plugin System

```javascript
class PluginSystem {
  constructor() {
    this.hub = createNexusHub([
      'plugin:register',
      'plugin:unregister',
      'plugin:enable',
      'plugin:disable',
      'hook:before-save',
      'hook:after-save',
      'hook:before-delete',
      'hook:after-delete',
    ]);

    this.plugins = new Map();
  }

  register(plugin) {
    this.plugins.set(plugin.name, plugin);

    // Let plugin subscribe to events
    plugin.init(this.hub);

    this.hub.emit('plugin:register', { name: plugin.name });
  }

  async save(data) {
    // Run before-save hooks
    const shouldContinue = this.hub.emit('hook:before-save', data);
    if (!shouldContinue) return;

    // Perform save
    const result = await saveToDatabase(data);

    // Run after-save hooks
    this.hub.emit('hook:after-save', result);

    return result;
  }
}

// Plugin example
class ValidationPlugin {
  constructor() {
    this.name = 'validation';
  }

  init(hub) {
    hub.on('hook:before-save', 'validation-plugin', (data) => {
      if (!this.validate(data)) {
        throw new Error('Validation failed');
      }
    });
  }

  validate(data) {
    // Validation logic
    return data.name && data.email;
  }
}
```

### State Synchronization

```javascript
class StateManager {
  constructor() {
    this.hub = createNexusHub(['state:change', 'state:sync', 'state:reset']);

    this.state = {};

    // Enable debug in development
    if (process.env.NODE_ENV === 'development') {
      this.hub.setDebug(true);
    }
  }

  set(path, value) {
    const oldValue = this.get(path);

    // Update state
    this.state[path] = value;

    // Notify listeners
    this.hub.emit('state:change', {
      path,
      oldValue,
      newValue: value,
    });
  }

  subscribe(path, id, callback) {
    this.hub.on('state:change', id, (change) => {
      if (change.path === path) {
        callback(change.newValue, change.oldValue);
      }
    });
  }

  // Sync with external source
  syncWith(externalState) {
    const changes = this.diff(this.state, externalState);
    changes.forEach((change) => {
      this.set(change.path, change.value);
    });
    this.hub.emit('state:sync', changes);
  }
}
```

### Testing

```javascript
import { createNexusHub } from '@vorthain/nexus';

describe('UserService', () => {
  let hub;
  let userService;

  beforeEach(() => {
    hub = createNexusHub(['user:created', 'user:updated', 'user:deleted']);
    userService = new UserService(hub);
  });

  test('emits user:created event when creating user', async () => {
    const listener = jest.fn();
    hub.on('user:created', 'test', listener);

    const user = await userService.create({ name: 'Alice' });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        name: 'Alice',
      })
    );
  });

  test('handles errors in event listeners', () => {
    hub.on('user:created', 'bad-listener', () => {
      throw new Error('Listener error');
    });

    hub.on('user:created', 'good-listener', jest.fn());

    // Should not throw - errors are caught
    expect(() => {
      userService.create({ name: 'Bob' });
    }).not.toThrow();
  });
});
```

## Debug Mode

Debug mode helps you understand event flow in your application:

```javascript
// Enable debug for all events
hub.setDebug(true);

// Enable debug for specific events only
hub.setDebug(['user:login', 'data:save']);

// Custom logger
hub.setLogger((eventName, data) => {
  console.group(`[${new Date().toISOString()}] Event: ${eventName}`);
  console.log('Data:', data);
  console.log('Listener count:', hub.listenerCount(eventName));
  console.groupEnd();
});

// Disable debug
hub.setDebug(false);
```

## Best Practices

### 1. Use Namespaced Event Names

```javascript
// Good
const hub = createNexusHub(['user:login', 'user:logout', 'user:update', 'cart:add', 'cart:remove']);

// Less clear
const hub = createNexusHub(['login', 'logout', 'update', 'add', 'remove']);
```

### 2. Use Descriptive Listener IDs

```javascript
// Good - clearly identifies the listener
hub.on('data:update', 'header-username-display', updateUsername);
hub.on('data:update', 'sidebar-user-avatar', updateAvatar);

// Bad - unclear IDs
hub.on('data:update', 'listener1', updateUsername);
hub.on('data:update', 'listener2', updateAvatar);
```

### 3. Always Clean Up

```javascript
class Component {
  constructor(hub) {
    this.hub = hub;
    this.id = `component-${Math.random()}`;
  }

  mount() {
    this.hub.on('update', this.id, this.handleUpdate);
  }

  unmount() {
    // Always remove listeners when done
    this.hub.off('update', this.id);
  }
}
```

### 4. Handle Errors Gracefully

```javascript
hub.on('save', 'auto-save', async (data) => {
  try {
    await saveData(data);
  } catch (error) {
    // Handle error appropriately
    console.error('Auto-save failed:', error);
    hub.emit('save:error', error);
  }
});
```

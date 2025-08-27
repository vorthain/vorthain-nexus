// Mock Worker in jsdom environment since it's not fully supported
global.Worker = class {
  constructor(scriptURL) {
    this.scriptURL = scriptURL;
    this.onmessage = null;
    this.onerror = null;
    this.postMessage = jest.fn();
    this.terminate = jest.fn();
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

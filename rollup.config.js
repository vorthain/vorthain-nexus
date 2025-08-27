// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Generate TypeScript definitions
const generateTypes = () => ({
  name: 'generate-types',
  writeBundle() {
    // Ensure dist directory exists
    mkdirSync('dist', { recursive: true });

    const types = `// Type definitions for @vorthain/nexus

export interface EventBus<T extends string = string> {
  on(eventName: T, id: string, callback: (data?: any) => void): EventBus<T>;
  once(eventName: T, id: string, callback: (data?: any) => void): EventBus<T>;
  off(eventName: T, id?: string): EventBus<T>;
  emit(eventName: T, data?: any): boolean;
  clear(eventName?: T): EventBus<T>;
  listenerCount(eventName?: T): number;
  listeners(eventName?: T): Function[];
  eventNames(): T[];
  setDebug(enabled: boolean | T[]): EventBus<T>;
  setLogger(fn: (eventName: T, data: any) => void): EventBus<T>;
}

/**
 * Create a strongly-typed event hub
 * @param eventNames - List of allowed event names
 * @returns Event hub instance
 */
export declare function createNexusHub<T extends string>(eventNames: T[]): EventBus<T>;

export default createNexusHub;
`;
    writeFileSync(join('dist', 'index.d.ts'), types);
  },
});

export default [
  // ESM build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      exports: 'named',
    },
    plugins: [resolve(), commonjs(), generateTypes()],
  },
  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      exports: 'named',
    },
    plugins: [resolve(), commonjs()],
  },
  // UMD build (minified)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.umd.min.js',
      format: 'umd',
      name: 'Nexus',
      exports: 'named',
    },
    plugins: [resolve(), commonjs(), terser()],
  },
];

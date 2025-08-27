/**
 * @module @vorthain/nexus
 * @description Lightweight, type-safe event hub for JavaScript applications
 * @author Vorthain
 * @license MIT
 */

/**
 * Event hub instance with strongly-typed event names
 */
export interface NexusHub<T extends string> {
  on(eventName: T, id: string, callback: (data?: any) => void): this;
  once(eventName: T, id: string, callback: (data?: any) => void): this;
  off(eventName: T, id?: string): this;
  emit(eventName: T, data?: any): boolean;
  clear(eventName?: T): this;
  listenerCount(eventName?: T): number;
  listeners(eventName?: T): Function[];
  eventNames(): T[];
  setDebug(enabled: boolean | T[]): this;
  setLogger(fn: (eventName: T, data: any) => void): this;
}

/**
 * Create a strongly-typed event hub with autocomplete for event names and runtime debugging
 */
export function createNexusHub<T extends string>(eventNames: T[]): NexusHub<T>;

export default createNexusHub;

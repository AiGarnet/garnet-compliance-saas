/**
 * Simple crypto polyfill for TypeORM compatibility with Node.js 18+
 */

import { randomUUID } from 'crypto';

// Simple polyfill for TypeORM's crypto.randomUUID requirement
if (typeof globalThis !== 'undefined' && !globalThis.crypto) {
  (globalThis as any).crypto = {
    randomUUID: randomUUID
  };
}

if (typeof global !== 'undefined' && !(global as any).crypto) {
  (global as any).crypto = {
    randomUUID: randomUUID
  };
}

console.log('✅ Crypto polyfill loaded for TypeORM compatibility'); 
// This shim properly re-exports moment to work with both ESM and CommonJS
import * as momentNamespace from 'moment';

// Extract the default export if it's available
const moment = (momentNamespace as any).default || momentNamespace;

export default moment;
export * from 'moment'; 
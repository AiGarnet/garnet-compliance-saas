/**
 * @deprecated This file is being maintained for backward compatibility.
 * Please import from the new structure:
 * - Types: import from '../types/vendor.types'
 * - Data: import from '../data/vendors'
 * - Functions: import from '../services/vendorService'
 */

import { Vendor, VendorStatus, RiskLevel } from './types/vendor.types';
import { vendorsData as vendors } from './data/vendors';
import { VendorService } from './services/vendorService';

// Re-export for backward compatibility
export type { Vendor };
export { vendors, VendorStatus, RiskLevel, VendorService };

// Default export for convenience
export default vendors;
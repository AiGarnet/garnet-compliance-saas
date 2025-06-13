import express from 'express';
import { TrustPortalRepository } from '../db/trustPortalRepository';
import { VendorRepository } from '../db/vendorRepository';

const router = express.Router();
const trustPortalRepo = new TrustPortalRepository();
const vendorRepo = new VendorRepository();

/**
 * GET /api/trust-portal/vendors
 * Get all vendors that have trust portal items
 */
router.get('/vendors', async (req, res) => {
  try {
    const vendors = await trustPortalRepo.getVendorsWithTrustPortalItems();
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors with trust portal items:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

/**
 * GET /api/trust-portal/items?vendorId=123
 * Get all trust portal items for a specific vendor
 */
router.get('/items', async (req, res) => {
  try {
    const vendorId = req.query.vendorId as string;
    
    if (!vendorId) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    const items = await trustPortalRepo.getVendorTrustPortalItems(parseInt(vendorId));
    res.json(items);
  } catch (error) {
    console.error('Error fetching trust portal items:', error);
    res.status(500).json({ error: 'Failed to fetch trust portal items' });
  }
});

/**
 * POST /api/trust-portal/items
 * Add a new item to the trust portal
 */
router.post('/items', async (req, res) => {
  try {
    const item = req.body;
    
    // Validate required fields
    if (!item.vendorId || !item.title || !item.category) {
      return res.status(400).json({ 
        error: 'Missing required fields: vendorId, title, category' 
      });
    }

    const newItem = await trustPortalRepo.addTrustPortalItem(item);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error adding trust portal item:', error);
    res.status(500).json({ error: 'Failed to add trust portal item' });
  }
});

export default router; 
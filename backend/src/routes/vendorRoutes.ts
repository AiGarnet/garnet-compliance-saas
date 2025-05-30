import express from 'express';
import { VendorController } from '../controllers/vendorController';

const router = express.Router();
const vendorController = new VendorController();

// Get all vendors
router.get('/', vendorController.getAllVendors.bind(vendorController));

// Get vendor statistics
router.get('/stats', vendorController.getVendorStats.bind(vendorController));

// Get vendors by status
router.get('/status/:status', vendorController.getVendorsByStatus.bind(vendorController));

// Get a vendor by ID
router.get('/:id', vendorController.getVendorById.bind(vendorController));

// Create a new vendor
router.post('/', vendorController.createVendor.bind(vendorController));

// Create a new vendor with questionnaire answers
router.post('/with-answers', vendorController.createVendorWithAnswers.bind(vendorController));

// Update a vendor
router.put('/:id', vendorController.updateVendor.bind(vendorController));

// Delete a vendor
router.delete('/:id', vendorController.deleteVendor.bind(vendorController));

// Save questionnaire answers for a vendor
router.post('/:id/answers', vendorController.saveVendorQuestionnaireAnswers.bind(vendorController));

export default router; 
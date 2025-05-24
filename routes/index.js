import express from 'express';
import exampleController from '../controllers/exampleController.js';

const router = express.Router();

// Basic health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is healthy' });
});

// Example API routes
router.get('/api/v1/examples', exampleController.getAllItems);
router.get('/api/v1/examples/:id', exampleController.getItemById);
router.post('/api/v1/examples', exampleController.createItem);
router.put('/api/v1/examples/:id', exampleController.updateItem);
router.delete('/api/v1/examples/:id', exampleController.deleteItem);

export default router; 
import exampleModel from '../models/example.js';

/**
 * Example controller with basic CRUD operations
 */
class ExampleController {
  // Get all items
  getAllItems(req, res) {
    try {
      const items = exampleModel.getAll();
      return res.status(200).json({ 
        success: true, 
        data: items 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Server error' 
      });
    }
  }

  // Get item by ID
  getItemById(req, res) {
    try {
      const { id } = req.params;
      const item = exampleModel.getById(id);
      
      if (!item) {
        return res.status(404).json({ 
          success: false, 
          error: 'Item not found' 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data: item 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Server error' 
      });
    }
  }

  // Create new item
  createItem(req, res) {
    try {
      const newItem = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date()
      };
      
      const item = exampleModel.create(newItem);
      
      return res.status(201).json({ 
        success: true, 
        data: item 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Server error' 
      });
    }
  }

  // Update item
  updateItem(req, res) {
    try {
      const { id } = req.params;
      const updatedItem = exampleModel.update(id, req.body);
      
      if (!updatedItem) {
        return res.status(404).json({ 
          success: false, 
          error: 'Item not found' 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data: updatedItem 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Server error' 
      });
    }
  }

  // Delete item
  deleteItem(req, res) {
    try {
      const { id } = req.params;
      const deletedItem = exampleModel.delete(id);
      
      if (!deletedItem) {
        return res.status(404).json({ 
          success: false, 
          error: 'Item not found' 
        });
      }

      return res.status(200).json({ 
        success: true, 
        data: {} 
      });
    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        error: error.message || 'Server error' 
      });
    }
  }
}

export default new ExampleController(); 
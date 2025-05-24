/**
 * Example model - Replace with actual database models
 * This is just a placeholder for demonstration purposes
 */

class ExampleModel {
  constructor() {
    this.data = [];
  }

  getAll() {
    return this.data;
  }

  getById(id) {
    return this.data.find(item => item.id === id);
  }

  create(item) {
    this.data.push(item);
    return item;
  }

  update(id, updatedItem) {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updatedItem };
      return this.data[index];
    }
    return null;
  }

  delete(id) {
    const index = this.data.findIndex(item => item.id === id);
    if (index !== -1) {
      const deleted = this.data[index];
      this.data.splice(index, 1);
      return deleted;
    }
    return null;
  }
}

export default new ExampleModel(); 
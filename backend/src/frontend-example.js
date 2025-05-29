// Example frontend code for interacting with the waitlist API
// This can be adapted to work with React, Vue, or vanilla JavaScript

/**
 * Submit waitlist form data to the backend API
 * @param {Object} formData - The form data object with user information
 * @returns {Promise} - A promise that resolves with the API response
 */
async function submitToWaitlist(formData) {
  try {
    // Validate email (basic validation)
    if (!formData.email || !formData.email.includes('@')) {
      throw new Error('Please enter a valid email address');
    }
    
    // API endpoint - adjust based on your deployment
    const apiUrl = 'http://localhost:3001/join-waitlist';
    // For production with Railway deployment, use the Railway URL:
    // const apiUrl = 'https://your-railway-app-name.up.railway.app/join-waitlist';
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    // Parse the JSON response
    const data = await response.json();
    
    // Handle different response statuses
    if (!response.ok) {
      // If the server returned an error message, use it
      const errorMessage = data.error || 'Failed to join waitlist';
      throw new Error(errorMessage);
    }
    
    // Return the successful response
    return {
      success: true,
      message: data.message || 'Successfully joined the waitlist!',
      data: data.data
    };
    
  } catch (error) {
    console.error('Waitlist submission error:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred'
    };
  }
}

// Example usage with a form submit event handler
document.addEventListener('DOMContentLoaded', () => {
  const waitlistForm = document.getElementById('waitlist-form');
  
  if (waitlistForm) {
    waitlistForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      // Get form data
      const formData = {
        email: document.getElementById('email').value,
        name: document.getElementById('name')?.value,
        company: document.getElementById('company')?.value,
        role: document.getElementById('role')?.value,
        // Add any other form fields here
      };
      
      // Show loading state
      const submitButton = waitlistForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = 'Submitting...';
      submitButton.disabled = true;
      
      // Submit the form
      const result = await submitToWaitlist(formData);
      
      // Reset button state
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
      
      // Handle the result
      if (result.success) {
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = result.message;
        waitlistForm.innerHTML = ''; // Clear the form
        waitlistForm.appendChild(successMessage);
      } else {
        // Show error message
        const errorElement = document.getElementById('form-error') || document.createElement('div');
        errorElement.id = 'form-error';
        errorElement.className = 'error-message';
        errorElement.textContent = result.message;
        
        if (!document.getElementById('form-error')) {
          waitlistForm.prepend(errorElement);
        }
      }
    });
  }
});

// React example component (commented out, for reference)
/*
import React, { useState } from 'react';

const WaitlistForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
    role: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });
    
    try {
      const apiUrl = 'http://localhost:3001/join-waitlist';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }
      
      // Success
      setMessage({ 
        text: data.message || 'Successfully joined the waitlist!', 
        type: 'success' 
      });
      
      // Reset form
      setFormData({
        email: '',
        name: '',
        company: '',
        role: ''
      });
      
    } catch (error) {
      setMessage({ 
        text: error.message || 'An error occurred', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="waitlist-form-container">
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email (required)</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="company">Company</label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="role">Role</label>
          <input
            type="text"
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="submit-button"
        >
          {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
        </button>
      </form>
    </div>
  );
};

export default WaitlistForm;
*/ 
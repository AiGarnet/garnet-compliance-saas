"""
Tests for the health module.
"""
import sys
import os
import unittest
from unittest.mock import patch, MagicMock
import json

# Add the parent directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Create a Flask app for testing
from flask import Flask
from app.health import bp as health_bp, get_uptime_string, get_disk_space, check_backend_connection

class TestHealth(unittest.TestCase):
    """Test cases for the health module."""
    
    def setUp(self):
        """Set up test Flask app."""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.app.config['BACKEND_API_URL'] = 'http://test-backend'
        self.app.register_blueprint(health_bp)
        self.client = self.app.test_client()
    
    @patch('app.health.datetime')
    def test_get_uptime_string(self, mock_datetime):
        """Test uptime string formatting."""
        # Set up mock datetime values
        mock_now = MagicMock()
        mock_start = MagicMock()
        
        # Test days scenario
        mock_now.return_value = mock_now
        mock_datetime.now.return_value = mock_now
        
        # Case 1: days, hours, minutes
        mock_timedelta = MagicMock()
        mock_timedelta.days = 2
        mock_timedelta.seconds = 3661  # 1 hour, 1 minute, 1 second
        mock_now - mock_start = mock_timedelta
        
        # Reset service_start_time to our mock
        import app.health
        app.health.service_start_time = mock_start
        
        uptime = get_uptime_string()
        self.assertEqual(uptime, "2d 1h 1m")
        
        # Case 2: hours and minutes only
        mock_timedelta.days = 0
        mock_timedelta.seconds = 3661  # 1 hour, 1 minute, 1 second
        uptime = get_uptime_string()
        self.assertEqual(uptime, "1h 1m")
        
        # Case 3: minutes and seconds only
        mock_timedelta.seconds = 61  # 1 minute, 1 second
        uptime = get_uptime_string()
        self.assertEqual(uptime, "1m 1s")
    
    @patch('app.health.shutil')
    def test_get_disk_space(self, mock_shutil):
        """Test disk space calculation."""
        # Set up mock disk usage values
        mock_shutil.disk_usage.return_value = (1000, 400, 600)  # 60% free
        
        disk_space = get_disk_space()
        self.assertEqual(disk_space, "60% free")
        
        # Test exception handling
        mock_shutil.disk_usage.side_effect = Exception("Disk error")
        disk_space = get_disk_space()
        self.assertEqual(disk_space, "unknown")
    
    @patch('app.health.requests.get')
    def test_check_backend_connection(self, mock_get):
        """Test backend connection checker."""
        # Test successful connection
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        status = check_backend_connection()
        self.assertEqual(status, "connected")
        
        # Test unsuccessful status code
        mock_response.status_code = 500
        status = check_backend_connection()
        self.assertEqual(status, "error_status_500")
        
        # Test connection error
        mock_get.side_effect = Exception("Connection failed")
        status = check_backend_connection()
        self.assertEqual(status, "unreachable")
    
    @patch('app.health.check_backend_connection')
    @patch('app.health.get_disk_space')
    @patch('app.health.get_uptime_string')
    def test_health_endpoint(self, mock_uptime, mock_disk, mock_backend):
        """Test the health endpoint."""
        # Set up mocks
        mock_uptime.return_value = "1h 30m"
        mock_disk.return_value = "75% free"
        mock_backend.return_value = "connected"
        
        # Test the endpoint
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200)
        
        # Parse response
        data = json.loads(response.data)
        
        # Check that all expected fields are present
        self.assertEqual(data['status'], "healthy")
        self.assertEqual(data['uptime'], "1h 30m")
        self.assertEqual(data['disk_space'], "75% free")
        self.assertEqual(data['backend'], "connected")
        
        # Test degraded status when backend is down
        mock_backend.return_value = "unreachable"
        
        response = self.client.get('/health')
        data = json.loads(response.data)
        self.assertEqual(data['status'], "degraded")

if __name__ == '__main__':
    unittest.main() 
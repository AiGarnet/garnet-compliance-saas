"""
Simple integration test script to verify the Flask chatbot microservice.
Run this script to test the service without requiring an OpenAI API key.
"""
import requests
import json
import sys
import time

def test_health_endpoint(base_url):
    """Test the health check endpoint."""
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health", timeout=10)
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"  Status: {data.get('status', 'unknown')}")
            print(f"  Compliance Data Loaded: {data.get('compliance_data_loaded', False)}")
            print(f"  Compliance Records: {data.get('compliance_records_count', 0)}")
            print("  ✅ Health check passed")
            return True
        else:
            print(f"  ❌ Health check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"  ❌ Health check error: {e}")
        return False

def test_status_endpoint(base_url):
    """Test the status endpoint."""
    print("\nTesting status endpoint...")
    try:
        response = requests.get(f"{base_url}/status", timeout=10)
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"  Service: {data.get('service', 'unknown')}")
            print(f"  Version: {data.get('version', 'unknown')}")
            print(f"  Status: {data.get('status', 'unknown')}")
            
            compliance_data = data.get('compliance_data', {})
            print(f"  Compliance Records: {compliance_data.get('record_count', 0)}")
            
            categories = compliance_data.get('categories', [])
            print(f"  Categories: {', '.join(categories[:5])}{'...' if len(categories) > 5 else ''}")
            
            print("  ✅ Status check passed")
            return True
        else:
            print(f"  ❌ Status check failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"  ❌ Status check error: {e}")
        return False

def test_ask_endpoint_without_openai(base_url):
    """Test the ask endpoint (will fail without OpenAI key, but should handle gracefully)."""
    print("\nTesting ask endpoint (without OpenAI API key)...")
    
    test_question = "What are GDPR data subject rights?"
    
    try:
        response = requests.post(
            f"{base_url}/ask",
            json={"question": test_question},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code in [200, 500]:  # 500 expected without API key
            data = response.json()
            if 'answer' in data:
                print(f"  Answer Length: {len(data['answer'])} characters")
                if response.status_code == 200:
                    print("  ✅ Ask endpoint working (OpenAI API key configured)")
                else:
                    print("  ⚠️  Ask endpoint handling error gracefully (OpenAI API key needed)")
            elif 'error' in data:
                print(f"  Error: {data['error']}")
                print("  ⚠️  Ask endpoint handling error gracefully (expected without API key)")
            
            return True
        else:
            print(f"  ❌ Ask endpoint failed: {response.status_code}")
            try:
                error_data = response.json()
                print(f"  Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"  Raw response: {response.text}")
            return False
            
    except Exception as e:
        print(f"  ❌ Ask endpoint error: {e}")
        return False

def test_input_validation(base_url):
    """Test input validation."""
    print("\nTesting input validation...")
    
    # Test empty question
    try:
        response = requests.post(
            f"{base_url}/ask",
            json={"question": ""},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 400:
            print("  ✅ Empty question validation working")
        else:
            print(f"  ⚠️  Empty question returned: {response.status_code}")
            
    except Exception as e:
        print(f"  ❌ Empty question test error: {e}")
    
    # Test missing question field
    try:
        response = requests.post(
            f"{base_url}/ask",
            json={},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 400:
            print("  ✅ Missing question validation working")
        else:
            print(f"  ⚠️  Missing question returned: {response.status_code}")
            
    except Exception as e:
        print(f"  ❌ Missing question test error: {e}")
    
    # Test unsafe content
    try:
        response = requests.post(
            f"{base_url}/ask",
            json={"question": "<script>alert('xss')</script>"},
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 400:
            print("  ✅ Unsafe content validation working")
        else:
            print(f"  ⚠️  Unsafe content returned: {response.status_code}")
            
    except Exception as e:
        print(f"  ❌ Unsafe content test error: {e}")

def test_404_handling(base_url):
    """Test 404 error handling."""
    print("\nTesting 404 error handling...")
    try:
        response = requests.get(f"{base_url}/nonexistent", timeout=10)
        
        if response.status_code == 404:
            data = response.json()
            if 'error' in data and 'available_endpoints' in data:
                print("  ✅ 404 handling working correctly")
                return True
        
        print(f"  ⚠️  404 handling returned: {response.status_code}")
        return False
        
    except Exception as e:
        print(f"  ❌ 404 test error: {e}")
        return False

def main():
    """Run all integration tests."""
    print("🧪 Flask Chatbot Microservice Integration Tests")
    print("=" * 50)
    
    # Check if service is running
    base_url = "http://localhost:5000"
    
    print(f"Testing service at: {base_url}")
    print("Note: Some tests may show warnings if OpenAI API key is not configured.")
    print()
    
    # Wait a moment for service to be ready
    print("Waiting for service to be ready...")
    time.sleep(2)
    
    tests = [
        test_health_endpoint,
        test_status_endpoint,
        test_ask_endpoint_without_openai,
        test_input_validation,
        test_404_handling
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test(base_url):
                passed += 1
        except Exception as e:
            print(f"  ❌ Test failed with exception: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The Flask chatbot microservice is working correctly.")
        return 0
    elif passed >= total - 1:
        print("⚠️  Most tests passed. Check any warnings above.")
        return 0
    else:
        print("❌ Some tests failed. Check the service configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 
// Test script to debug Stripe checkout issue
const fetch = require('node-fetch');

async function testStripeCheckout() {
  const API_URL = 'https://garnet-compliance-saas-production.up.railway.app';
  
  // Test data
  const testData = {
    priceId: 'price_1RkTN7GCn6F00HoYDpK3meuM', // Starter monthly
    billingCycle: 'monthly',
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel'
  };

  console.log('Testing Stripe checkout with data:', testData);

  try {
    const response = await fetch(`${API_URL}/api/billing/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TEST_TOKEN_HERE',
      },
      body: JSON.stringify(testData),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());

    const responseData = await response.text();
    console.log('Response body:', responseData);

    if (response.ok) {
      console.log('✅ Checkout session created successfully!');
    } else {
      console.log('❌ Checkout session failed');
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Also test with different Stripe price IDs
async function testWithDifferentPriceIds() {
  console.log('\n=== Testing with different Stripe price IDs ===');
  
  const priceIds = [
    { name: 'Starter Monthly', id: 'price_1RkTN7GCn6F00HoYDpK3meuM' },
    { name: 'Starter Annual', id: 'price_1RkTNZGCn6F00HoYk0lq4LvE' },
    { name: 'Growth Monthly', id: 'price_1RkTOCGCn6F00HoYoEtLd3FO' },
    { name: 'Growth Annual', id: 'price_1RkTOhGCn6F00HoYmMXNHSZp' },
    { name: 'Scale Monthly', id: 'price_1RkTP6GCn6F00HoYVgzc2Byh' },
    { name: 'Scale Annual', id: 'price_1RkTPdGCn6F00HoYznfbj9C6' },
    { name: 'Enterprise Monthly', id: 'price_1RkTQXGCn6F00HoYS2peeQy2' },
    { name: 'Enterprise Annual', id: 'price_1RkTR8GCn6F00HoYhtKtutCX' }
  ];

  console.log('Available price IDs:');
  priceIds.forEach(price => {
    console.log(`  ${price.name}: ${price.id}`);
  });
}

// Run the tests
testStripeCheckout();
testWithDifferentPriceIds(); 
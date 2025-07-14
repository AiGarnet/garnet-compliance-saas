# Netlify Environment Setup for Stripe Integration

This document provides step-by-step instructions for setting up the required environment variables in Netlify for frontend Stripe payment processing.

## Required Environment Variables

### Stripe Configuration
You need to set the following environment variable in your Netlify project:

#### NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- **Purpose**: Client-side Stripe API key for creating payment elements
- **Format**: `pk_test_...` (for testing) or `pk_live_...` (for production)
- **Where to get it**: 
  1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
  2. Navigate to "Developers" → "API keys"
  3. Copy the "Publishable key" (starts with `pk_`)

### Backend API Configuration
#### NEXT_PUBLIC_API_URL
- **Purpose**: Points to your Railway backend API for payment processing
- **Format**: `https://your-railway-domain.up.railway.app`
- **Example**: `https://garnet-compliance-saas-production.up.railway.app`

## Setting Environment Variables in Netlify

### Method 1: Netlify Dashboard
1. Go to your Netlify site dashboard
2. Navigate to "Site settings" → "Environment variables"
3. Click "Add a variable"
4. Add each environment variable:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   NEXT_PUBLIC_API_URL=https://your-railway-domain.up.railway.app
   ```

### Method 2: Netlify CLI
If you have Netlify CLI installed:
```bash
netlify env:set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY pk_test_your_stripe_publishable_key_here
netlify env:set NEXT_PUBLIC_API_URL https://your-railway-domain.up.railway.app
```

### Method 3: netlify.toml File
You can also set environment variables in your `netlify.toml` file (not recommended for sensitive keys):
```toml
[build.environment]
  NEXT_PUBLIC_API_URL = "https://your-railway-domain.up.railway.app"
  # Don't put STRIPE keys in netlify.toml - use dashboard instead
```

## Production vs. Development Keys

### Development/Testing
- Use keys that start with `pk_test_`
- These work with Stripe's test mode
- No real money is processed
- Use test credit card numbers from [Stripe Testing](https://stripe.com/docs/testing)

### Production
- Use keys that start with `pk_live_`
- These process real payments
- Ensure your Stripe account is fully verified
- Test thoroughly before going live

## Frontend Integration Points

The frontend uses these environment variables in the following locations:

### 1. Landing Page Pricing Section
- **File**: `components/GarnetLandingPage.tsx`
- **Function**: `handleSelectPlan()`
- **Purpose**: Creates checkout sessions via backend API

### 2. Pricing Page
- **File**: `app/pricing/page.tsx`
- **Function**: `handleSelectPlan()`
- **Purpose**: Full pricing page with detailed plans

### 3. Billing Dashboard
- **File**: `app/billing/page.tsx`
- **Purpose**: Manage existing subscriptions and billing

## Build Configuration

### Next.js Configuration
Make sure your `next.config.js` includes the environment variables:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... other config
  env: {
    NEXT_PUBLIC_STATIC_EXPORT: 'true',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app',
  },
  // ... rest of config
};
```

### Build Command
Ensure your Netlify build settings are correct:
- **Build command**: `cd garnet-compliance-saas-frontend/frontend && npm install && npm run build`
- **Publish directory**: `garnet-compliance-saas-frontend/frontend/out`

## Verification

After setting up the environment variables:

### 1. Check Build Logs
- Look for successful environment variable loading in Netlify build logs
- Verify no "undefined" values for NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

### 2. Test Frontend
- Visit your deployed site's pricing section
- Check browser console for any Stripe-related errors
- Verify that API calls are being made to the correct backend URL

### 3. Test Payment Flow
- Click on a pricing plan button
- Should redirect to Stripe checkout (test mode)
- Use test credit card: `4242 4242 4242 4242`

## Common Issues & Troubleshooting

### 1. "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is undefined"
**Cause**: Environment variable not set or incorrect name
**Solution**: 
- Verify variable name exactly matches `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Redeploy after setting the variable

### 2. "Failed to create checkout session"
**Cause**: Backend API URL incorrect or backend not accessible
**Solution**:
- Verify `NEXT_PUBLIC_API_URL` points to your Railway backend
- Test backend API directly: `curl https://your-backend.up.railway.app/health`

### 3. CORS Errors
**Cause**: Backend not configured to accept requests from Netlify domain
**Solution**: Update backend CORS settings to include your Netlify domain

### 4. Build Failures
**Cause**: Missing environment variables during build
**Solution**: Set all required variables in Netlify dashboard before building

## Deploy Previews

For deploy previews (branch deployments):
1. Environment variables are inherited from production by default
2. You can override specific variables for specific branches
3. Test deployments use the same Stripe test keys

## Security Best Practices

### ✅ DO:
- Use `NEXT_PUBLIC_` prefix for client-side variables
- Use test keys during development
- Set environment variables via Netlify dashboard
- Regularly rotate API keys

### ❌ DON'T:
- Commit API keys to your repository
- Use live keys in development/testing
- Put sensitive keys in `netlify.toml`
- Share publishable keys (though they're less sensitive)

## Testing Checklist

Before going live, verify:

- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set correctly
- [ ] NEXT_PUBLIC_API_URL points to your Railway backend
- [ ] Landing page pricing buttons work
- [ ] Pricing page loads correctly
- [ ] Checkout flow redirects to Stripe
- [ ] Test payments complete successfully
- [ ] Webhook events are received by backend
- [ ] User subscriptions are created in database

## Related Documentation

- [Stripe.js Documentation](https://stripe.com/docs/js)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Railway Environment Setup](./RAILWAY_ENVIRONMENT_SETUP.md) 
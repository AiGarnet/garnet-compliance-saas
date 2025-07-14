# Railway Environment Setup for Stripe Integration

This document provides step-by-step instructions for setting up the required environment variables in Railway for Stripe payment processing.

## Required Environment Variables

### Stripe Configuration
You need to set the following environment variables in your Railway project:

#### 1. STRIPE_SECRET_KEY
- **Purpose**: Server-side Stripe API key for processing payments
- **Format**: `sk_test_...` (for testing) or `sk_live_...` (for production)
- **Where to get it**: 
  1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
  2. Navigate to "Developers" → "API keys"
  3. Copy the "Secret key" (starts with `sk_`)

#### 2. STRIPE_WEBHOOK_SECRET
- **Purpose**: Validates webhook events from Stripe to ensure they're authentic
- **Format**: `whsec_...`
- **Where to get it**:
  1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
  2. Navigate to "Developers" → "Webhooks"
  3. Create a new webhook endpoint or select existing one
  4. Set the endpoint URL to: `https://your-railway-domain.up.railway.app/api/billing/webhook`
  5. Select the following events:
     - `checkout.session.completed`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
  6. Copy the "Signing secret" (starts with `whsec_`)

## Setting Environment Variables in Railway

### Method 1: Railway Dashboard
1. Go to your Railway project dashboard
2. Select your backend service
3. Navigate to the "Variables" tab
4. Click "New Variable"
5. Add each environment variable:
   ```
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### Method 2: Railway CLI
If you have Railway CLI installed:
```bash
railway variables set STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
railway variables set STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Production vs. Development Keys

### Development/Testing
- Use keys that start with `sk_test_` and `whsec_test_`
- These work with Stripe's test mode
- No real money is processed

### Production
- Use keys that start with `sk_live_` and `whsec_live_`
- These process real payments
- Ensure your Stripe account is fully verified

## Webhook Endpoint Configuration

Your webhook endpoint URL should be:
```
https://your-railway-domain.up.railway.app/api/billing/webhook
```

### Required Webhook Events
Configure your webhook to listen for these events:
- `checkout.session.completed` - When a payment is successful
- `invoice.paid` - When a subscription invoice is paid
- `invoice.payment_failed` - When a payment fails
- `customer.subscription.updated` - When subscription details change
- `customer.subscription.deleted` - When a subscription is cancelled

## Verification

After setting up the environment variables:

1. **Check Backend Logs**: 
   - Look for "Stripe initialized successfully" in your Railway logs
   - If you see "STRIPE_SECRET_KEY not configured", check your environment variable

2. **Test Webhook**:
   - Use Stripe CLI to test webhooks locally: `stripe listen --forward-to localhost:8080/api/billing/webhook`
   - Or use Stripe dashboard webhook testing tool

3. **Test Payment Flow**:
   - Try creating a test subscription through your application
   - Check that webhook events are received successfully

## Troubleshooting

### Common Issues

1. **"Stripe is not configured" Error**
   - Verify STRIPE_SECRET_KEY is set correctly
   - Ensure it starts with `sk_test_` or `sk_live_`

2. **"Stripe webhook secret not configured" Error**
   - Verify STRIPE_WEBHOOK_SECRET is set correctly
   - Ensure it starts with `whsec_`

3. **Webhook Events Not Processing**
   - Check that webhook URL is accessible publicly
   - Verify webhook secret matches Stripe dashboard
   - Check Railway logs for webhook processing errors

### Logs to Monitor
In Railway logs, look for:
```
✅ Stripe initialized successfully
✅ Created checkout session [session_id] for user [user_id]
✅ Received webhook event: checkout.session.completed
```

## Security Best Practices

1. **Never commit secret keys** to your repository
2. **Use different keys** for development and production
3. **Regularly rotate** your webhook secrets
4. **Monitor webhook events** for unusual activity
5. **Keep Stripe libraries updated** to latest versions

## Related Documentation

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [Railway Environment Variables Guide](https://docs.railway.app/develop/variables) 
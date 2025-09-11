# Stripe Integration Setup Guide

This document provides a complete guide for setting up Stripe payments and subscriptions in the REI Toolkit application.

## Overview

The Stripe integration enables:
- Subscription-based billing (Pro $19/month, Team $49/month)
- Secure payment processing via Stripe Checkout
- Customer billing portal for subscription management
- Webhook handling for subscription lifecycle events
- Annual billing with discounts (20% off)

## Components Created

### 1. Core Services

#### `src/services/stripeService.js`
- **Purpose**: Main payment processing service
- **Key Features**:
  - Stripe SDK initialization
  - Checkout session creation
  - Billing portal access
  - Plan management
  - Error handling and loading states

#### `src/services/webhookHandler.js`
- **Purpose**: Backend webhook event processing (implementation guide)
- **Key Features**:
  - Subscription lifecycle events
  - Payment success/failure handling
  - User data synchronization
  - Email notifications

### 2. UI Components

#### `src/components/DealManagement/components/BillingComponent.vue`
- **Purpose**: Subscription management interface
- **Key Features**:
  - Current plan display
  - Usage tracking
  - Upgrade/downgrade options
  - Billing portal access

#### `src/views/PricingView.vue`
- **Purpose**: Public pricing page
- **Key Features**:
  - Plan comparison
  - Monthly/annual billing toggle
  - Feature comparisons
  - FAQ section
  - Direct checkout integration

#### `src/views/CheckoutSuccess.vue`
- **Purpose**: Post-purchase success page
- **Key Features**:
  - Subscription confirmation
  - Feature unlocked display
  - Quick access to new features
  - Billing portal shortcut

### 3. Data Schema Updates

#### `src/services/firestoreSchemas.js`
Updated UserSchema with subscription fields:
```javascript
subscription: {
  plan: 'free', // 'free', 'pro', 'team'
  status: 'inactive', // 'active', 'inactive', 'canceled', 'past_due'
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  billingInterval: 'monthly', // 'monthly', 'annual'
}
```

#### `src/services/authService.js`
Enhanced with subscription methods:
- `updateSubscription(subscriptionData)`
- `getSubscription()`
- Updated `isPremiumUser()` logic

## Environment Configuration

### Required Environment Variables

Create/update `.env.local`:
```bash
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_STRIPE_PRO_PRICE_ID=price_pro_monthly_id
VITE_STRIPE_TEAM_PRICE_ID=price_team_monthly_id
VITE_STRIPE_PRO_ANNUAL_PRICE_ID=price_pro_annual_id
VITE_STRIPE_TEAM_ANNUAL_PRICE_ID=price_team_annual_id

# Backend Configuration (for webhooks)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Update `.env.example`:
```bash
# Stripe Payment Processing
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_STRIPE_PRO_PRICE_ID=price_pro_monthly_id
VITE_STRIPE_TEAM_PRICE_ID=price_team_monthly_id
VITE_STRIPE_PRO_ANNUAL_PRICE_ID=price_pro_annual_id
VITE_STRIPE_TEAM_ANNUAL_PRICE_ID=price_team_annual_id
```

## Stripe Dashboard Setup

### 1. Create Products and Prices

#### Pro Plan
- **Product Name**: "REI Toolkit Pro"
- **Monthly Price**: $19.00 USD (recurring)
- **Annual Price**: $15.00 USD (recurring, billed annually)

#### Team Plan
- **Product Name**: "REI Toolkit Team"
- **Monthly Price**: $49.00 USD (recurring)
- **Annual Price**: $39.00 USD (recurring, billed annually)

### 2. Webhook Configuration

#### Webhook Endpoint
- **URL**: `https://your-domain.com/api/stripe/webhook`
- **Events to Send**:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

#### Webhook Security
- Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`
- Verify signatures in your webhook handler

## Backend Implementation

### Required Backend Routes

#### 1. Create Checkout Session
```
POST /api/stripe/create-checkout-session
```

**Request Body**:
```javascript
{
  "priceId": "price_xyz123",
  "userId": "firebase_user_id",
  "userEmail": "user@example.com",
  "successUrl": "https://your-app.com/checkout/success",
  "cancelUrl": "https://your-app.com/pricing"
}
```

**Response**:
```javascript
{
  "sessionId": "cs_test_xyz123"
}
```

#### 2. Create Billing Portal Session
```
POST /api/stripe/create-portal-session
```

**Request Body**:
```javascript
{
  "customerId": "cus_xyz123",
  "returnUrl": "https://your-app.com/settings"
}
```

**Response**:
```javascript
{
  "url": "https://billing.stripe.com/p/session/xyz123"
}
```

#### 3. Webhook Handler
```
POST /api/stripe/webhook
```

- Verify webhook signature
- Process subscription events
- Update user data in Firebase
- Send confirmation emails

## Navigation Updates

### Routes Added
- `/pricing` - Public pricing page
- `/checkout/success` - Post-purchase success page

### Navigation Links
- Added "Pricing" link to main navigation
- Added "Home" link for better UX

## Testing Checklist

### 1. Local Development Testing
- [ ] Stripe SDK loads correctly
- [ ] Pricing page displays all plans
- [ ] Monthly/annual toggle works
- [ ] Plan selection redirects to Stripe Checkout
- [ ] Checkout success page displays correctly
- [ ] Billing component shows subscription status

### 2. Payment Flow Testing
- [ ] Use Stripe test cards for payment testing
- [ ] Test successful payments
- [ ] Test failed payments
- [ ] Test subscription updates
- [ ] Test subscription cancellations

### 3. Webhook Testing
- [ ] Use Stripe CLI for local webhook testing
- [ ] Verify webhook signature validation
- [ ] Test all subscription events
- [ ] Verify user data updates correctly

## Security Considerations

### 1. API Keys
- Never expose secret keys in frontend code
- Use environment variables for all keys
- Use test keys in development

### 2. Webhook Security
- Always verify webhook signatures
- Use HTTPS in production
- Rate limit webhook endpoints
- Log webhook events for debugging

### 3. User Data
- Validate user authentication before processing payments
- Sanitize all user inputs
- Implement proper error handling

## Deployment Steps

### 1. Frontend Deployment
- Set production environment variables
- Update Stripe keys to production values
- Deploy to hosting service (Netlify, Vercel, etc.)

### 2. Backend Deployment
- Deploy webhook handler to production server
- Configure webhook endpoint in Stripe Dashboard
- Set up monitoring and logging

### 3. Testing in Production
- Test with small amounts using live mode
- Monitor webhook delivery
- Verify email notifications

## Troubleshooting

### Common Issues

#### 1. Stripe Not Loading
- Check publishable key is set correctly
- Verify network connectivity
- Check browser console for errors

#### 2. Checkout Session Fails
- Verify backend API is accessible
- Check authentication tokens
- Validate price IDs exist in Stripe

#### 3. Webhooks Not Received
- Verify webhook endpoint is accessible
- Check webhook signing secret
- Review Stripe Dashboard webhook logs

#### 4. Subscription Status Not Updating
- Check webhook event processing
- Verify Firebase updates are working
- Review webhook handler logs

## Monitoring and Analytics

### Key Metrics to Track
- Conversion rates (free to paid)
- Subscription retention rates
- Revenue growth
- Payment failure rates

### Recommended Tools
- Stripe Dashboard analytics
- Google Analytics for conversion tracking
- Custom Firebase Analytics events
- Error monitoring (Sentry, etc.)

## Future Enhancements

### Potential Features
- Usage-based billing
- Team member management
- API rate limiting based on plan
- Advanced analytics dashboard
- Custom branding options
- Enterprise plans

### Integration Opportunities
- CRM integration (HubSpot, Salesforce)
- Email marketing (Mailchimp, ConvertKit)
- Customer support (Intercom, Zendesk)
- Advanced analytics (Mixpanel, Amplitude)

## Support and Documentation

### Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Vue.js Stripe Integration Guide](https://stripe.com/docs/payments/accept-a-payment?platform=web&ui=checkout)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Vuetify Components](https://vuetifyjs.com/)

### Contact Information
- Technical Support: support@rei-toolkit.com
- Billing Questions: billing@rei-toolkit.com
- Feature Requests: features@rei-toolkit.com

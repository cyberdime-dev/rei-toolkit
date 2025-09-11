/**
 * Stripe Webhook Handler (Backend Implementation Guide)
 * 
 * This file demonstrates how to handle Stripe webhooks for subscription events.
 * This should be implemented as a backend service (Node.js/Express, etc.)
 * 
 * Key webhook events to handle:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

// Example webhook handler for Node.js/Express backend
const handleStripeWebhook = async (req, res) => {
  // Note: In actual implementation, you would verify the webhook signature
  // const sig = req.headers['stripe-signature']
  // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
  
  let event
  
  try {
    // Verify webhook signature
    // Note: 'stripe' would be imported as: const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    // event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    event = { type: 'placeholder', data: { object: {} } } // Placeholder for example
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
  
  // Handle the event
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object)
      break
      
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object)
      break
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object)
      break
      
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object)
      break
      
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object)
      break
      
    default:
      console.log(`Unhandled event type ${event.type}`)
  }
  
  res.json({ received: true })
}

/**
 * Handle subscription creation
 */
const handleSubscriptionCreated = async (subscription) => {
  try {
    const customerId = subscription.customer
    const subscriptionId = subscription.id
    const status = subscription.status
    const currentPeriodEnd = subscription.current_period_end
    
    // Get price ID to determine plan
    const priceId = subscription.items.data[0].price.id
    const planName = getPlanNameFromPriceId(priceId)
    
    console.log('New subscription created:', {
      customerId,
      subscriptionId,
      status,
      planName,
    })
    
    // Update user in Firebase/Firestore
    await updateUserSubscription(customerId, {
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: customerId,
      status,
      plan: planName,
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      updatedAt: new Date(),
    })
    
    // Send welcome email (optional)
    await sendWelcomeEmail(customerId, planName)
    
  } catch (error) {
    console.error('Error handling subscription created:', error)
    throw error
  }
}

/**
 * Handle subscription updates
 */
const handleSubscriptionUpdated = async (subscription) => {
  try {
    const customerId = subscription.customer
    const subscriptionId = subscription.id
    const status = subscription.status
    const currentPeriodEnd = subscription.current_period_end
    
    // Get price ID to determine plan
    const priceId = subscription.items.data[0].price.id
    const planName = getPlanNameFromPriceId(priceId)
    
    console.log('Subscription updated:', {
      customerId,
      subscriptionId,
      status,
      planName,
    })
    
    // Update user in Firebase/Firestore
    await updateUserSubscription(customerId, {
      status,
      plan: planName,
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      updatedAt: new Date(),
    })
    
    // Handle plan changes
    if (status === 'active') {
      await handlePlanActivation(customerId, planName)
    } else if (status === 'canceled') {
      await handlePlanCancellation(customerId)
    }
    
  } catch (error) {
    console.error('Error handling subscription updated:', error)
    throw error
  }
}

/**
 * Handle subscription deletion/cancellation
 */
const handleSubscriptionDeleted = async (subscription) => {
  try {
    const customerId = subscription.customer
    const subscriptionId = subscription.id
    
    console.log('Subscription deleted:', {
      customerId,
      subscriptionId,
    })
    
    // Update user to free plan
    await updateUserSubscription(customerId, {
      status: 'canceled',
      plan: 'free',
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    
    // Send cancellation email (optional)
    await sendCancellationEmail(customerId)
    
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
    throw error
  }
}

/**
 * Handle successful payment
 */
const handlePaymentSucceeded = async (invoice) => {
  try {
    const customerId = invoice.customer
    const subscriptionId = invoice.subscription
    const amountPaid = invoice.amount_paid
    
    console.log('Payment succeeded:', {
      customerId,
      subscriptionId,
      amountPaid,
    })
    
    // Update last payment date
    await updateUserSubscription(customerId, {
      lastPaymentDate: new Date(),
      updatedAt: new Date(),
    })
    
    // Send receipt email (optional)
    await sendReceiptEmail(customerId)
    
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
    throw error
  }
}

/**
 * Handle failed payment
 */
const handlePaymentFailed = async (invoice) => {
  try {
    const customerId = invoice.customer
    const subscriptionId = invoice.subscription
    
    console.log('Payment failed:', {
      customerId,
      subscriptionId,
    })
    
    // Update payment failure information
    await updateUserSubscription(customerId, {
      paymentFailed: true,
      lastPaymentFailure: new Date(),
      updatedAt: new Date(),
    })
    
    // Send payment failure email (optional)
    await sendPaymentFailureEmail(customerId)
    
  } catch (error) {
    console.error('Error handling payment failed:', error)
    throw error
  }
}

/**
 * Helper function to get plan name from Stripe price ID
 */
const getPlanNameFromPriceId = (priceId) => {
  const planMapping = {
    [process.env.VITE_STRIPE_PRO_PRICE_ID]: 'pro',
    [process.env.VITE_STRIPE_TEAM_PRICE_ID]: 'team',
    // Add annual plans if you have them
    [process.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID]: 'pro',
    [process.env.VITE_STRIPE_TEAM_ANNUAL_PRICE_ID]: 'team',
  }
  
  return planMapping[priceId] || 'free'
}

/**
 * Update user subscription in Firebase/Firestore
 */
const updateUserSubscription = async (stripeCustomerId, subscriptionData) => {
  // This function should:
  // 1. Find the user by their Stripe customer ID
  // 2. Update their subscription data in Firestore
  // 3. Handle any errors appropriately
  
  console.log('Updating user subscription:', {
    stripeCustomerId,
    subscriptionData,
  })
  
  // Implementation depends on your Firebase/Firestore setup
  // Example:
  // const userQuery = await firestore
  //   .collection('users')
  //   .where('subscription.stripeCustomerId', '==', stripeCustomerId)
  //   .get()
  
  // if (!userQuery.empty) {
  //   const userDoc = userQuery.docs[0]
  //   await userDoc.ref.update({
  //     'subscription': {
  //       ...userDoc.data().subscription,
  //       ...subscriptionData
  //     }
  //   })
  // }
}

/**
 * Handle plan activation
 */
const handlePlanActivation = async (customerId, planName) => {
  console.log(`Plan activated: ${planName} for customer ${customerId}`)
  
  // Additional logic for plan activation:
  // - Enable premium features
  // - Update usage limits
  // - Send activation notifications
}

/**
 * Handle plan cancellation
 */
const handlePlanCancellation = async (customerId) => {
  console.log(`Plan canceled for customer ${customerId}`)
  
  // Additional logic for plan cancellation:
  // - Disable premium features (gracefully)
  // - Export user data (if requested)
  // - Send cancellation confirmations
}

/**
 * Email helper functions (implement based on your email service)
 */
const sendWelcomeEmail = async (customerId, planName) => {
  console.log(`Sending welcome email for ${planName} plan to customer ${customerId}`)
  // Implementation depends on your email service (SendGrid, Mailgun, etc.)
}

const sendCancellationEmail = async (customerId) => {
  console.log(`Sending cancellation email to customer ${customerId}`)
}

const sendReceiptEmail = async (customerId) => {
  console.log(`Sending receipt email to customer ${customerId}`)
}

const sendPaymentFailureEmail = async (customerId) => {
  console.log(`Sending payment failure email to customer ${customerId}`)
}

// Export for use in your backend
export {
  handleStripeWebhook,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handlePaymentSucceeded,
  handlePaymentFailed,
}

/**
 * Deployment Notes:
 * 
 * 1. Environment Variables Needed:
 *    - STRIPE_WEBHOOK_SECRET
 *    - VITE_STRIPE_PRO_PRICE_ID
 *    - VITE_STRIPE_TEAM_PRICE_ID
 *    - FIREBASE_SERVICE_ACCOUNT_KEY
 * 
 * 2. Webhook Endpoint Setup:
 *    - Create endpoint at: /api/stripe/webhook
 *    - Set up in Stripe Dashboard: https://dashboard.stripe.com/webhooks
 *    - Configure events to send
 * 
 * 3. Security:
 *    - Always verify webhook signatures
 *    - Use HTTPS in production
 *    - Rate limit webhook endpoints
 *    - Log all webhook events for debugging
 * 
 * 4. Testing:
 *    - Use Stripe CLI for local testing: stripe listen --forward-to localhost:3000/api/stripe/webhook
 *    - Test with Stripe test cards
 *    - Monitor webhook delivery in Stripe Dashboard
 */

#!/bin/bash
# test-stripe-webhooks.sh

echo "Setting up Stripe CLI for webhook testing..."

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "Stripe CLI not found. Please install it first: https://stripe.com/docs/stripe-cli"
    exit 1
fi

# Login to Stripe if needed
echo "Logging in to Stripe..."
stripe login

# Forward webhooks to local server
echo "Starting webhook forwarding to http://localhost:3000/api/payment/webhook"
echo "This will run in the foreground. Press Ctrl+C to stop."
echo "Open another terminal to continue testing the rest of the application."

stripe listen --forward-to http://localhost:3000/api/payment/webhook

# Note: The following commands will not execute while stripe listen is running
# They are included for reference on how to trigger test webhook events

# To trigger test events in another terminal:
# stripe trigger checkout.session.completed
# stripe trigger customer.subscription.created
# stripe trigger customer.subscription.updated
# stripe trigger customer.subscription.deleted
# stripe trigger invoice.payment_failed
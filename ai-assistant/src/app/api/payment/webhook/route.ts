// src/app/api/payment/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import Stripe from "stripe";

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-03-31.basil", // Updated API version for 2025
});

// Stripe webhook secret from the dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(request: NextRequest) {
  try {
    // 1. Get the raw request body
    const body = await request.text();
    
    // 2. Get the signature from headers
    const headersList = headers();
    const signature = headersList.get("stripe-signature") as string;
    
    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 }
      );
    }
    
    // 3. Verify webhook signature
    let event: Stripe.Event;
    
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }
    
    // 4. Handle specific webhook events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Update user tier to PRO
        if (session.client_reference_id) {
          await prisma.user.update({
            where: { id: session.client_reference_id },
            data: {
              tier: "PRO",
              stripeCustomerId: session.customer as string,
            },
          });
          
          console.log(`User ${session.client_reference_id} upgraded to PRO tier`);
        }
        break;
      }
      
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find user by customer ID
        if (subscription.customer) {
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: subscription.customer as string },
          });
          
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { tier: "PRO" },
            });
            
            console.log(`User ${user.id} subscription created, tier set to PRO`);
          }
        }
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update user tier based on subscription status
        if (subscription.customer) {
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: subscription.customer as string },
          });
          
          if (user) {
            // Determine tier based on subscription status
            const tier = subscription.status === "active" ? "PRO" : "FREE";
            
            await prisma.user.update({
              where: { id: user.id },
              data: { tier },
            });
            
            console.log(`User ${user.id} subscription updated, tier set to ${tier}`);
          }
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Downgrade user to FREE tier
        if (subscription.customer) {
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: subscription.customer as string },
          });
          
          if (user) {
            await prisma.user.update({
              where: { id: user.id },
              data: { tier: "FREE" },
            });
            
            console.log(`User ${user.id} subscription deleted, tier downgraded to FREE`);
          }
        }
        break;
      }
      
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Handle failed payment (optional: notify user)
        if (invoice.customer) {
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: invoice.customer as string },
          });
          
          if (user) {
            console.log(`Payment failed for user ${user.id}, invoice: ${invoice.id}`);
            
            // Here you could trigger an email notification
            // This is left as an implementation detail
          }
        }
        break;
      }
    }
    
    // 5. Return success response
    return NextResponse.json({ success: true, received: true });
  } catch (error: any) {
    console.error("Error handling webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed", message: error.message },
      { status: 500 }
    );
  }
}

// Disable body parsing for this route (needed for Stripe webhooks)
export const config = {
  api: {
    bodyParser: false,
  },
};
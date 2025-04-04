// app/api/payment/create-checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { validateCsrfToken } from "@/lib/auth-utils";
import Stripe from "stripe";

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Validate CSRF token
    if (!await validateCsrfToken(request)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    
    // 3. Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // 4. Check if user already has a Stripe customer ID
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email as string,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      
      customerId = customer.id;
      
      // Save Stripe customer ID to database
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }
    
    // 5. Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel`,
      client_reference_id: user.id,
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
      },
    });
    
    // 6. Return checkout URL
    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", message: error.message },
      { status: 500 }
    );
  }
}

// app/api/payment/portal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { validateCsrfToken } from "@/lib/auth-utils";
import Stripe from "stripe";

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Validate CSRF token
    if (!await validateCsrfToken(request)) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }
    
    // 3. Get user with Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user || !user.stripeCustomerId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }
    
    // 4. Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/settings`,
    });
    
    // 5. Return portal URL
    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Error creating customer portal session:", error);
    return NextResponse.json(
      { error: "Failed to access subscription management", message: error.message },
      { status: 500 }
    );
  }
}

// app/api/payment/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import Stripe from "stripe";

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
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

// app/api/payment/subscription/route.ts (Get subscription status)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // 2. Get user with Stripe customer ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // 3. Default response for users without subscriptions
    if (!user.stripeCustomerId) {
      return NextResponse.json({
        tier: user.tier,
        subscription: null,
        hasActiveSubscription: false,
      });
    }
    
    // 4. Fetch subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
      expand: ["data.default_payment_method"],
    });
    
    // 5. Find the most recent subscription
    const subscription = subscriptions.data[0];
    
    if (!subscription) {
      return NextResponse.json({
        tier: user.tier,
        subscription: null,
        hasActiveSubscription: false,
      });
    }
    
    // 6. Format response
    return NextResponse.json({
      tier: user.tier,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        paymentMethod: subscription.default_payment_method,
        created: new Date(subscription.created * 1000).toISOString(),
      },
      hasActiveSubscription: subscription.status === "active",
    });
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription details", message: error.message },
      { status: 500 }
    );
  }
}
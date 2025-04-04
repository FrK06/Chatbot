// app/api/payment/subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { getStripe, formatSubscription } from "@/lib/stripe";

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
    
    // 4. Get Stripe client and fetch subscriptions
    const stripe = getStripe();
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
    
    // 6. Format response using helper function
    return NextResponse.json({
      tier: user.tier,
      subscription: formatSubscription(subscription),
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
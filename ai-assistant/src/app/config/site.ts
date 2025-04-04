// app/config/site.ts (Site-wide configuration)
export const siteConfig = {
    name: "AI Assistant",
    description: "Your personal AI assistant powered by Next.js and OpenAI",
    url: process.env.NEXTAUTH_URL || "http://localhost:3000",
    links: {
      github: "https://github.com/yourusername/ai-assistant",
      twitter: "https://twitter.com/yourusername",
    },
    nav: [
      {
        title: "Home",
        href: "/",
      },
      {
        title: "Chat",
        href: "/chat",
      },
      {
        title: "Pricing",
        href: "/pricing",
      },
      {
        title: "About",
        href: "/about",
      },
    ],
    tiers: {
      FREE: {
        name: "Free",
        description: "Basic AI assistant features",
        price: 0,
        features: [
          "Access to GPT-3.5 model",
          "Up to 60 requests per minute",
          "1 request per second to LLM API",
          "Conversation history for 7 days",
        ],
      },
      PRO: {
        name: "Pro",
        description: "Advanced AI assistant with enhanced capabilities",
        price: 19.99,
        features: [
          "Access to GPT-4o model",
          "Up to 120 requests per minute",
          "5 requests per second to LLM API",
          "Unlimited conversation history",
          "Priority support",
        ],
      },
    },
  };
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { city = "Unknown City", size = "A4" } = body as { city?: string; size?: string };

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: 500, // €5.00 in cents
            product_data: {
              name: `Map Poster – ${city} (${size})`,
              description: `High-resolution ${size} map poster of ${city}, ready to print at home.`,
              images: [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        city,
        posterSize: size,
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&city=${encodeURIComponent(city)}&size=${size}`,
      cancel_url: `${baseUrl}/editor?city=${encodeURIComponent(city)}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

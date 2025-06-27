import { type NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/db';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed:`, err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await connectDB();

        const { courseId, userId } = paymentIntent.metadata;

        if (!courseId || !userId) {
          console.error('Missing metadata in payment intent');
          return NextResponse.json(
            { error: 'Missing metadata' },
            { status: 400 }
          );
        }

        // Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
          user: userId,
          course: courseId,
        });

        if (!existingEnrollment) {
          // Create enrollment
          const enrollment = new Enrollment({
            user: userId,
            course: courseId,
            progress: 0,
            completedLectures: [],
            paymentIntentId: paymentIntent.id,
          });

          await enrollment.save();

          // Update course enrollment count
          await Course.findByIdAndUpdate(courseId, {
            $inc: { enrollmentCount: 1 },
          });

          console.log(`User ${userId} enrolled in course ${courseId}`);
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

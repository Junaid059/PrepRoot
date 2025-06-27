'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get('session_id');
  const courseId = searchParams.get('course_id');

  useEffect(() => {
    // Redirect to course page with success parameters
    if (courseId && sessionId) {
      router.replace(
        `/courses/${courseId}?payment=success&session_id=${sessionId}`
      );
    } else {
      // Fallback redirect if parameters are missing
      router.replace('/explore');
    }
  }, [courseId, sessionId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <Loader2 className="h-6 w-6 animate-spin text-gray-600 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-600">Redirecting you to your course...</p>
      </div>
    </div>
  );
}

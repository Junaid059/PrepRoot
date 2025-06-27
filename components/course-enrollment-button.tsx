'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface CourseEnrollmentButtonProps {
  courseId: string;
  coursePrice: number;
  courseTitle: string;
  className?: string;
}

export default function CourseEnrollmentButton({
  courseId,
  coursePrice,
  courseTitle,
  className = '',
}: CourseEnrollmentButtonProps) {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    checkEnrollmentStatus();
  }, [courseId]);

  const checkEnrollmentStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/enrollments/check?courseId=${courseId}`
      );

      if (response.ok) {
        const data = await response.json();
        setIsEnrolled(data.isEnrolled);
      }
    } catch (error) {
      console.error('Error checking enrollment status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnrollment = async () => {
    try {
      setIsProcessing(true);

      // Create Stripe checkout session
      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          amount: coursePrice,
          courseName: courseTitle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start payment process');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Button disabled className={className}>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isEnrolled) {
    return (
      <Button
        disabled
        className={`bg-green-600 hover:bg-green-600 ${className}`}
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Enrolled
      </Button>
    );
  }

  return (
    <Button
      onClick={handleEnrollment}
      disabled={isProcessing}
      className={className}
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Enroll Now - PKR {coursePrice.toLocaleString()}
        </>
      )}
    </Button>
  );
}

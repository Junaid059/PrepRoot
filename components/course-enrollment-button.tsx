'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/auth-context';

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
  const { user } = useAuth();
  
  // Don't show enrollment button for admin users
  const isAdmin = user?.isAdmin || false;

  useEffect(() => {
    if (!isAdmin) {
      checkEnrollmentStatus();
    } else {
      setIsLoading(false);
    }
  }, [courseId, isAdmin]);

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

      // If course is free (price is zero), enroll directly without payment
      if (coursePrice === 0) {
        // Call enrollment API directly
        const response = await fetch('/api/enrollments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId,
            amount: 0,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to enroll in course');
        }

        const enrollmentResult = await response.json();
        
        // Update enrollment status
        setIsEnrolled(true);
        toast.success('Successfully enrolled in the course!');
        setIsProcessing(false);
      } else {
        // For paid courses, create Stripe checkout session
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
      }
    } catch (error) {
      console.error('Error during enrollment process:', error);
      toast.error(coursePrice === 0 ? 'Failed to enroll in course' : 'Failed to start payment process');
      setIsProcessing(false);
    }
  };

  if (isAdmin) {
    return (
      <Button
        disabled
        className={`bg-gray-600 hover:bg-gray-600 text-white font-medium ${className}`}
      >
        <CreditCard className="h-4 w-4 mr-2" />
        Admin Preview Only
      </Button>
    );
  }

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
          {coursePrice === 0 ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Enroll for Free
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Enroll Now - PKR {coursePrice.toLocaleString()}
            </>
          )}
        </>
      )}
    </Button>
  );
}

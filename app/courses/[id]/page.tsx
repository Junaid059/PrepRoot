'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/auth-context';
import PaymentSuccessNotification from '@/components/payment-success-notification';
import {
  Star,
  Clock,
  Users,
  BookOpen,
  Globe,
  Award,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Play,
  Lock,
  Download,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Menu,
  X,
  CreditCard,
  Loader2,
} from 'lucide-react';

interface Lecture {
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: string;
  isFreePreview: boolean;
}

interface Section {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  lectures?: Lecture[];
  courseId?: string;
}

interface Instructor {
  _id: string;
  name: string;
  title?: string;
  bio?: string;
  rating?: string;
  students?: number;
  courses?: number;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  thumbnail?: string;
  category: string;
  rating?: string;
  reviews?: number;
  enrolledStudents?: number;
  duration?: string;
  featured?: boolean;
  instructor: string | Instructor;
  instructorName?: string;
}

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [instructor, setInstructor] = useState<Instructor | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [selectedVideo, setSelectedVideo] = useState<Lecture | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Payment success detection
  const paymentSuccess = searchParams.get('payment') === 'success';
  const sessionId = searchParams.get('session_id');

  // Add this CSS to prevent right-click and other download methods
  const videoProtectionStyles = `
  .protected-video {
    pointer-events: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  
  .protected-video iframe {
    pointer-events: auto;
  }
  
  /* Disable right-click context menu */
  .no-context-menu {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  
  /* Disable text selection */
  .no-select {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  
  /* Hide video controls for non-enrolled users */
  .restricted-video iframe {
    filter: blur(5px);
    opacity: 0.5;
  }
`;

  // Check if user just enrolled (from payment success)
  useEffect(() => {
    const enrolled = searchParams.get('enrolled');
    if (enrolled === 'true') {
      toast.success('Welcome! You have successfully enrolled in this course.');
      setIsEnrolled(true);
    }
  }, [searchParams]);

  // Handle payment success
  useEffect(() => {
    if (paymentSuccess && sessionId && courseId) {
      handlePaymentSuccess();
    }
  }, [paymentSuccess, sessionId, courseId]);

  const handlePaymentSuccess = async () => {
    try {
      setIsProcessingPayment(true);
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          courseId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsEnrolled(true);
        toast.success(
          '🎉 Payment successful! You are now enrolled in this course!'
        );

        // Clean up URL parameters
        window.history.replaceState({}, '', `/courses/${courseId}`);
      } else {
        toast.error('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Payment verification failed. Please contact support.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Extract and validate the ID from params
  useEffect(() => {
    console.log('Raw params:', params);

    let rawId: string | string[] | undefined;

    if (params && typeof params === 'object') {
      rawId = params.id;
    }

    console.log('Raw ID from params:', rawId);

    let processedId: string | null = null;

    if (rawId) {
      if (Array.isArray(rawId)) {
        processedId = rawId[0];
      } else {
        processedId = rawId;
      }

      if (processedId === 'undefined' || !processedId) {
        console.error('Invalid course ID detected:', processedId);
        setError('Invalid course ID. Please check the URL and try again.');
        setIsLoading(false);
        return;
      }

      console.log('Processed ID:', processedId);
      setCourseId(processedId);
    } else {
      console.error('No course ID provided in params');
      setError('No course ID provided');
      setIsLoading(false);
    }
  }, [params]);

  // Check if mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const getSectionId = (section: Section, index: number): string => {
    return (
      section._id ||
      section.id ||
      `section-${index}-${section.title.replace(/\s+/g, '-').toLowerCase()}`
    );
  };

  const processSections = (rawSections: Section[]): Section[] => {
    if (!Array.isArray(rawSections)) {
      console.warn('Sections data is not an array:', rawSections);
      return [];
    }

    return rawSections.map((section, index) => {
      if (!section._id && !section.id) {
        console.warn(
          `Section at index ${index} missing ID, generating fallback:`,
          section
        );
        section.id = `section-${index}-${Date.now()}`;
      }

      if (!section.lectures) {
        section.lectures = [];
      }

      section.lectures = section.lectures.filter((lecture, lectureIndex) => {
        if (!lecture._id) {
          console.warn(
            `Lecture at index ${lectureIndex} in section "${section.title}" missing ID:`,
            lecture
          );
          lecture._id = `lecture-${lectureIndex}-${Date.now()}`;
        }
        return true;
      });

      return section;
    });
  };

  // Fetch course data when courseId is available and auth is loaded
  useEffect(() => {
    if (!courseId || authLoading) return;

    const fetchCourseData = async () => {
      try {
        console.log('Fetching course with ID:', courseId);

        const courseResponse = await fetch(`/api/courses/${courseId}`);

        if (!courseResponse.ok) {
          console.error('Course API error:', courseResponse.status);

          try {
            const errorData = await courseResponse.json();
            console.error('Course API error details:', errorData);

            if (courseResponse.status === 400) {
              setError(
                'Invalid course ID. Please check the URL and try again.'
              );
            } else if (courseResponse.status === 404) {
              setError('Course not found. It may have been removed.');
            } else {
              setError(
                'Failed to load course details. Please try again later.'
              );
            }
          } catch (e) {
            console.error('Could not parse error response:', e);
            setError('Failed to load course details. Please try again later.');
          }

          setIsLoading(false);
          return;
        }

        const courseData = await courseResponse.json();
        console.log('Course data received:', courseData);

        if (!courseData.course) {
          console.error('Course data is missing or invalid:', courseData);
          setError('Invalid course data received from server');
          setIsLoading(false);
          return;
        }

        setCourse(courseData.course);

        // Fetch instructor details
        if (courseData.course.instructor) {
          const instructorId =
            typeof courseData.course.instructor === 'object'
              ? courseData.course.instructor._id
              : courseData.course.instructor;

          console.log('Fetching instructor with ID:', instructorId);
          try {
            const instructorResponse = await fetch(
              `/api/users/${instructorId}`
            );
            if (instructorResponse.ok) {
              const instructorData = await instructorResponse.json();
              setInstructor(instructorData.user);
              console.log('Instructor data received:', instructorData.user);
            } else {
              console.error(
                'Failed to fetch instructor data:',
                instructorResponse.status
              );
            }
          } catch (error) {
            console.error('Error fetching instructor:', error);
          }
        } else if (courseData.course.instructorName) {
          console.log(
            'Using instructor name from course data:',
            courseData.course.instructorName
          );
        } else {
          console.log('No instructor data available in course');
        }

        // Fetch course sections and lectures
        try {
          console.log('Fetching sections for course:', courseId);
          const sectionsResponse = await fetch(
            `/api/courses/${courseId}/sections`
          );

          if (sectionsResponse.ok) {
            const sectionsData = await sectionsResponse.json();
            console.log('Raw sections data received:', sectionsData);

            const processedSections = processSections(
              sectionsData.sections || []
            );
            console.log('Processed sections:', processedSections);

            setSections(processedSections);

            if (processedSections.length > 0) {
              const firstSectionId = getSectionId(processedSections[0], 0);
              setExpandedSections({ [firstSectionId]: true });

              const firstSection = processedSections[0];
              if (firstSection.lectures && firstSection.lectures.length > 0) {
                const firstPreviewLecture = firstSection.lectures.find(
                  (lecture: { isFreePreview: any }) => lecture.isFreePreview
                );
                if (firstPreviewLecture) {
                  setSelectedVideo(firstPreviewLecture);
                }
              }
            }
          } else {
            console.error('Failed to fetch sections:', sectionsResponse.status);
            const errorText = await sectionsResponse.text();
            console.error('Sections API error details:', errorText);

            setSections([]);
            toast.error(
              'Failed to load course sections. Some content may not be available.'
            );
          }
        } catch (error) {
          console.error('Error fetching sections:', error);
          setSections([]);
          toast.error(
            'Failed to load course sections. Some content may not be available.'
          );
        }

        // Check if user is enrolled
        if (user) {
          try {
            const enrollmentResponse = await fetch(
              `/api/enrollments/check?courseId=${courseId}`
            );
            if (enrollmentResponse.ok) {
              const enrollmentData = await enrollmentResponse.json();
              setIsEnrolled(enrollmentData.isEnrolled);
            }
          } catch (error) {
            console.error('Error checking enrollment:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        setError('Failed to load course details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, user, authLoading]);

  useEffect(() => {
    if (selectedVideo && isMobile && videoContainerRef.current) {
      videoContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedVideo, isMobile]);

  const handleEnroll = async () => {
    if (!user) {
      toast.error('Please login to enroll in this course');
      router.push(`/login?redirect=/courses/${courseId}`);
      return;
    }

    if (!course) {
      toast.error('Course information not available');
      return;
    }

    try {
      setIsProcessingPayment(true);

      // Create Stripe checkout session
      const response = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          amount: course.price,
          courseName: course.title,
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
      setIsProcessingPayment(false);
    }
  };

  const toggleSection = (section: Section, index: number) => {
    const sectionId = getSectionId(section, index);
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleLectureClick = (lecture: Lecture) => {
    if (lecture.isFreePreview || isEnrolled) {
      setSelectedVideo(lecture);
      if (isMobile) {
        setShowSidebar(false);
      }
    } else {
      toast.error('Please enroll in this course to access this lecture');
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = course?.title || 'Check out this course';

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          url
        )}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(
          title
        )}&body=${encodeURIComponent(`Check out this course: ${url}`)}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank');
  };

  const calculateTotalDuration = () => {
    let totalMinutes = 0;
    sections.forEach((section) => {
      section.lectures?.forEach((lecture) => {
        if (lecture.duration) {
          const parts = lecture.duration.split(':');
          if (parts.length === 2) {
            totalMinutes += Number.parseInt(parts[0]);
          } else if (parts.length === 3) {
            totalMinutes +=
              Number.parseInt(parts[0]) * 60 + Number.parseInt(parts[1]);
          }
        }
      });
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const countTotalLectures = () => {
    let total = 0;
    sections.forEach((section) => {
      total += section.lectures?.length || 0;
    });
    return total;
  };

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen pt-20 pb-10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg mb-8"></div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-2/3">
                <div className="h-10 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded w-full mb-6"></div>
              </div>
              <div className="md:w-1/3">
                <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen pt-20 pb-10 px-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Course Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error ||
              "The course you're looking for doesn't exist or has been removed."}
            {courseId === 'undefined' && (
              <span className="block mt-2 text-red-500">
                Invalid course ID. Please check the URL and try again.
              </span>
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/explore"
              className="bg-[#FF6B38] text-white px-6 py-3 rounded-full font-medium hover:bg-opacity-90 transition-all"
            >
              Browse Courses
            </Link>
            <Link
              href="/"
              className="border border-gray-300 text-gray-700 px-6 py-3 rounded-full font-medium hover:bg-gray-50 transition-all"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-10">
      {/* Payment Success Notification */}
      {paymentSuccess && course && (
        <PaymentSuccessNotification
          courseName={course.title}
          onClose={() =>
            window.history.replaceState({}, '', `/courses/${courseId}`)
          }
        />
      )}

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar - Course Content */}
        <div
          className={`lg:w-1/4 bg-white border-r border-gray-200 h-screen lg:sticky top-16 overflow-y-auto transition-all duration-300 ${
            showSidebar
              ? 'translate-x-0'
              : '-translate-x-full lg:translate-x-0 hidden lg:block'
          }`}
        >
          <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10 flex justify-between items-center">
            <h2 className="font-bold text-lg">Course Content</h2>
            {isMobile && (
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{sections.length} sections</span>
              <span>{countTotalLectures()} lectures</span>
              <span>{calculateTotalDuration()} total</span>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {sections.length > 0 ? (
              sections.map((section, index) => {
                const sectionId = getSectionId(section, index);
                return (
                  <div key={sectionId} className="border-b border-gray-200">
                    <button
                      className="flex items-center justify-between w-full p-4 hover:bg-gray-50 transition-colors"
                      onClick={() => toggleSection(section, index)}
                    >
                      <div className="flex items-center">
                        <BookOpen className="h-5 w-5 mr-2 text-[#FF6B38]" />
                        <span className="font-medium text-left">
                          {section.title}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 mr-2">
                          {section.lectures?.length || 0} lectures
                        </span>
                        {expandedSections[sectionId] ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </button>
                    {expandedSections[sectionId] && section.lectures && (
                      <div className="bg-gray-50">
                        {section.lectures?.map((lecture, lectureIndex) => (
                          <button
                            key={lecture._id || `lecture-${lectureIndex}`}
                            className={`flex items-center justify-between w-full p-4 border-t border-gray-100 hover:bg-gray-100 transition-colors ${
                              selectedVideo?._id === lecture._id
                                ? 'bg-gray-100 border-l-4 border-l-[#FF6B38]'
                                : ''
                            }`}
                            onClick={() => handleLectureClick(lecture)}
                          >
                            <div className="flex items-center">
                              {lecture.isFreePreview || isEnrolled ? (
                                <Play className="h-4 w-4 mr-2 text-[#FF6B38]" />
                              ) : (
                                <Lock className="h-4 w-4 mr-2 text-gray-400" />
                              )}
                              <span className="text-sm text-left">
                                {lecture.title}
                              </span>
                            </div>
                            <div className="flex items-center">
                              {lecture.isFreePreview && !isEnrolled && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                                  Preview
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {lecture.duration || '10:00'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No course content available yet.</p>
                <p className="text-sm">Check back later for updates!</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4 bg-white">
          {/* Mobile Toggle Button */}
          {isMobile && !showSidebar && (
            <button
              onClick={() => setShowSidebar(true)}
              className="fixed top-20 left-4 z-50 bg-white p-2 rounded-full shadow-lg border border-gray-200 lg:hidden"
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </button>
          )}

          {/* Video Player Section */}
          <div
            ref={videoContainerRef}
            className="bg-black w-full relative aspect-video protected-video no-context-menu"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
          >
            <style jsx>{videoProtectionStyles}</style>
            {selectedVideo?.videoUrl ? (
              <div
                className={`w-full h-full ${
                  !isEnrolled && !selectedVideo.isFreePreview
                    ? 'restricted-video'
                    : ''
                }`}
              >
                {!isEnrolled && !selectedVideo.isFreePreview ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800 relative">
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                      <div className="text-center text-white">
                        <Lock className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-xl mb-2">
                          This content is protected
                        </p>
                        <p className="text-sm opacity-75">
                          Enroll in the course to access this lecture
                        </p>
                        <button
                          onClick={handleEnroll}
                          disabled={isProcessingPayment}
                          className="mt-4 bg-[#FF6B38] text-white px-6 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                        >
                          {isProcessingPayment ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Enroll Now
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <iframe
                      src={selectedVideo.videoUrl}
                      className="w-full h-full blur-sm opacity-30"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={selectedVideo.title}
                      style={{ pointerEvents: 'none' }}
                    ></iframe>
                  </div>
                ) : (
                  <iframe
                    src={selectedVideo.videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={selectedVideo.title}
                    onContextMenu={(e) => e.preventDefault()}
                  ></iframe>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <div className="text-center text-white">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl">Select a lecture to start learning</p>
                  {sections.length === 0 && (
                    <p className="text-sm opacity-75 mt-2">
                      Course content is being prepared
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Video Title and Navigation */}
          {selectedVideo && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold">{selectedVideo.title}</h2>
              {selectedVideo.description && (
                <p className="text-gray-600 mt-2">
                  {selectedVideo.description}
                </p>
              )}
            </div>
          )}

          {/* Course Details */}
          <div className="p-6">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex space-x-8">
                <button
                  className={`pb-4 font-medium ${
                    activeTab === 'content'
                      ? 'border-b-2 border-[#FF6B38] text-[#FF6B38]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('content')}
                >
                  Overview
                </button>
                <button
                  className={`pb-4 font-medium ${
                    activeTab === 'reviews'
                      ? 'border-b-2 border-[#FF6B38] text-[#FF6B38]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('reviews')}
                >
                  Reviews
                </button>
              </div>
            </div>

            {activeTab === 'content' ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {course.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <span className="bg-[#FF6B38]/10 text-[#FF6B38] px-3 py-1 rounded-full text-sm font-medium">
                      {course.category}
                    </span>
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="ml-1 font-medium">
                        {course.rating || '4.5'}
                      </span>
                      <span className="text-gray-500 ml-1">
                        ({course.reviews || 0} reviews)
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="h-5 w-5 mr-1" />
                      <span>{course.enrolledStudents || 0} students</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-5 w-5 mr-1" />
                      <span>{calculateTotalDuration()}</span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">
                      Course Description
                    </h2>
                    <div className="prose max-w-none text-gray-700">
                      <p className="whitespace-pre-line">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  {/* Instructor */}
                  {instructor ? (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold mb-4">Instructor</h2>
                      <div className="flex items-start">
                        <div className="mr-4">
                          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-[#FF6B38] font-bold text-xl">
                            {instructor.name?.charAt(0) || 'I'}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">
                            {instructor.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            {instructor.title || 'Course Instructor'}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 mb-3">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm ml-1">
                                {instructor.rating || '4.8'} Instructor Rating
                              </span>
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 text-gray-500" />
                              <span className="text-sm ml-1">
                                {instructor.students || 0} Students
                              </span>
                            </div>
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 text-gray-500" />
                              <span className="text-sm ml-1">
                                {instructor.courses || 0} Courses
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700">
                            {instructor.bio || 'No instructor bio available.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : course.instructorName ? (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold mb-4">Instructor</h2>
                      <div className="flex items-start">
                        <div className="mr-4">
                          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-[#FF6B38] font-bold text-xl">
                            {course.instructorName?.charAt(0) || 'I'}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">
                            {course.instructorName}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">
                            Course Instructor
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                {/* Reviews Tab */}
                <div>
                  <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4">Student Reviews</h2>
                    <div className="text-center py-8">
                      <p className="text-gray-600">Reviews coming soon!</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar - Course Info (Only visible when not watching a lecture) */}
        {!selectedVideo && (
          <div className="lg:w-1/4 p-6 border-l border-gray-200 h-screen sticky top-16 overflow-y-auto hidden lg:block">
            <div className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden">
              <div className="relative">
                <Image
                  src={
                    course.thumbnail || '/placeholder.svg?height=200&width=400'
                  }
                  width={400}
                  height={200}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                {course.featured && (
                  <div className="absolute top-4 left-4 bg-[#FF6B38] text-white px-2 py-1 rounded-md text-xs font-medium">
                    BESTSELLER
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-3xl font-bold text-gray-900">
                    PKR {course.price?.toLocaleString() || '49,999'}
                  </span>
                  {course.originalPrice && (
                    <span className="text-lg text-gray-500 line-through">
                      PKR {course.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>

                {isEnrolled ? (
                  <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-6 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span>You are enrolled in this course</span>
                  </div>
                ) : (
                  <motion.button
                    onClick={handleEnroll}
                    disabled={isProcessingPayment}
                    className="w-full bg-[#FF6B38] text-white py-3 rounded-lg font-medium mb-4 hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    whileHover={{ scale: isProcessingPayment ? 1 : 1.02 }}
                    whileTap={{ scale: isProcessingPayment ? 1 : 0.98 }}
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Enroll Now
                      </>
                    )}
                  </motion.button>
                )}

                <div className="mb-6">
                  <h3 className="font-bold mb-3">This course includes:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Globe className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0 mt-0.5" />
                      <span>Full lifetime access</span>
                    </li>
                    <li className="flex items-start">
                      <Clock className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0 mt-0.5" />
                      <span>{calculateTotalDuration()} of on-demand video</span>
                    </li>
                    <li className="flex items-start">
                      <Download className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0 mt-0.5" />
                      <span>Downloadable resources</span>
                    </li>
                    <li className="flex items-start">
                      <Award className="h-5 w-5 mr-2 text-gray-600 flex-shrink-0 mt-0.5" />
                      <span>Certificate of completion</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h3 className="font-bold mb-3">Share this course:</h3>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleShare('facebook')}
                      className="p-2 rounded-full bg-gray-100 hover:bg-[#FF6B38]/10 text-gray-600 hover:text-[#FF6B38] transition-colors"
                      aria-label="Share on Facebook"
                    >
                      <Facebook className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="p-2 rounded-full bg-gray-100 hover:bg-[#FF6B38]/10 text-gray-600 hover:text-[#FF6B38] transition-colors"
                      aria-label="Share on Twitter"
                    >
                      <Twitter className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleShare('linkedin')}
                      className="p-2 rounded-full bg-gray-100 hover:bg-[#FF6B38]/10 text-gray-600 hover:text-[#FF6B38] transition-colors"
                      aria-label="Share on LinkedIn"
                    >
                      <Linkedin className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleShare('email')}
                      className="p-2 rounded-full bg-gray-100 hover:bg-[#FF6B38]/10 text-gray-600 hover:text-gray-600 transition-colors"
                      aria-label="Share via Email"
                    >
                      <Mail className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

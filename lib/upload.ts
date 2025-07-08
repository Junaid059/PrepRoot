import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload an image to Cloudinary
export async function uploadImage(
  file: any,
  options?: { folder?: string; transformation?: any[] }
): Promise<string> {
  try {
    // Convert file to base64
    const fileBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString('base64');
    const dataURI = `data:${file.type};base64,${base64File}`;

    // Upload to Cloudinary with optional transformations
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: options?.folder || 'lms/images',
      resource_type: 'image',
      transformation: options?.transformation || [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
}

// Function to upload a video to Cloudinary
export async function uploadVideo(file: any): Promise<string> {
  try {
    // Convert file to base64
    const fileBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString('base64');
    const dataURI = `data:${file.type};base64,${base64File}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'lms/videos',
      resource_type: 'video',
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading video to Cloudinary:', error);
    throw new Error('Failed to upload video');
  }
}

// Function to delete an image/video from Cloudinary
export async function deleteFromCloudinary(imageUrl: string): Promise<void> {
  try {
    // Extract public_id from Cloudinary URL
    const urlParts = imageUrl.split('/');
    const fileWithExtension = urlParts[urlParts.length - 1];
    const publicId = fileWithExtension.split('.')[0];

    // Include folder path if present
    const uploadIndex = urlParts.findIndex((part) => part === 'upload');
    if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
      const folderPath = urlParts.slice(uploadIndex + 2, -1).join('/');
      const fullPublicId = folderPath ? `${folderPath}/${publicId}` : publicId;

      await cloudinary.uploader.destroy(fullPublicId);
      console.log(`Deleted from Cloudinary: ${fullPublicId}`);
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    // Don't throw error, just log it
  }
}

// Function to validate image file
export function validateImageFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB for Cloudinary

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Maximum size is 10MB.',
    };
  }

  return { isValid: true };
}

// Function to validate video file
export function validateVideoFile(file: File): {
  isValid: boolean;
  error?: string;
} {
  const allowedTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
  ];
  const maxSize = 100 * 1024 * 1024; // 100MB for videos

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error:
        'Invalid file type. Only MP4, WebM, OGG, AVI, and MOV videos are allowed.',
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size too large. Maximum size is 100MB.',
    };
  }

  return { isValid: true };
}

// Helper function specifically for teacher avatars
export async function uploadTeacherAvatar(file: any): Promise<string> {
  return uploadImage(file, {
    folder: 'lms/teachers',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
}

// Helper function for course thumbnails
export async function uploadCourseThumbnail(file: any): Promise<string> {
  return uploadImage(file, {
    folder: 'lms/courses',
    transformation: [
      { width: 800, height: 450, crop: 'fill' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });
}

// Generic file upload function that can be used for different file types
export async function uploadFile(file: any, customFolder?: string): Promise<string> {
  // Determine resource type based on MIME type
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const isPDF = file.type === 'application/pdf';
  
  try {
    // Convert file to base64
    const fileBuffer = await file.arrayBuffer();
    const base64File = Buffer.from(fileBuffer).toString('base64');
    const dataURI = `data:${file.type};base64,${base64File}`;
    
    // Set default folder based on file type
    let folder = customFolder || 'lms/files';
    
    // Set resource type based on file type
    let resourceType = 'auto';
    if (isImage) resourceType = 'image';
    if (isVideo) resourceType = 'video';
    
    // Upload to Cloudinary with appropriate settings
    const result = await cloudinary.uploader.upload(dataURI, {
      folder,
      resource_type: resourceType,
      ...(isImage && {
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      }),
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw new Error('Failed to upload file');
  }
}

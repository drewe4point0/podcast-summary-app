import { z } from 'zod';
import { extractYouTubeId } from './utils';

/**
 * Schema for creating a new job
 */
export const createJobSchema = z.object({
  youtubeUrl: z
    .string()
    .min(1, 'YouTube URL is required')
    .refine((url) => extractYouTubeId(url) !== null, {
      message: 'Invalid YouTube URL. Please enter a valid YouTube video URL.',
    }),
  notificationEmail: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

/**
 * Schema for job ID parameter
 */
export const jobIdSchema = z.object({
  id: z.string().min(1, 'Job ID is required'),
});

/**
 * Schema for email export request
 */
export const emailExportSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  email: z.string().email('Invalid email address'),
});

export type EmailExportInput = z.infer<typeof emailExportSchema>;


export interface AdminUser {
  id: string;
  name: string;
  role: 'admin' | 'moderator';
  lastActive: Date;
}

export interface ModerationComment {
  id: string;
  lessonId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'hidden' | 'flagged';
  reportCount: number;
  upvotes: number;
  replies: ModerationComment[];
  moderationHistory: ModerationAction[];
}

export interface ModerationAction {
  id: string;
  commentId: string;
  moderatorId: string;
  action: 'approve' | 'hide' | 'flag' | 'restore';
  reason?: string;
  timestamp: Date;
}

export interface AdminModule {
  id: string;
  title: string;
  description: string;
  order: number;
  status: 'draft' | 'active' | 'archived';
  thumbnailUrl?: string;
  chapters: AdminChapter[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface AdminChapter {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  order: number;
  status: 'draft' | 'active' | 'archived';
  visibility_mode?: string;
  cohort_id?: string | null;
  lessons: AdminLesson[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface AdminLesson {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  order: number;
  status: 'draft' | 'active' | 'archived';
  visibility_mode?: string;
  cohort_id?: string | null;
  video?: LessonVideo;
  embeds: LessonEmbed[];
  attachments: LessonAttachment[];
  links: Array<{ label: string; url: string; }>;
  richText?: string;
  durationSec?: number;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface LessonVideo {
  provider: 'youtube' | 'vimeo' | 'file';
  url: string;
  videoId?: string;
  startTime?: number;
  thumbnail?: string;
}

export interface LessonEmbed {
  id: string;
  type: 'link' | 'iframe';
  title?: string;
  url: string;
  description?: string;
}

export interface LessonAttachment {
  id: string;
  lessonId: string;
  name: string;
  url: string;
  mime: string;
  size: number;
  kind: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'zip' | 'image' | 'other';
  uploadedAt: Date;
}

export interface PublishEvent {
  id: string;
  entityType: 'module' | 'chapter' | 'lesson';
  entityId: string;
  action: 'publish' | 'unpublish';
  scheduledAt?: Date;
  executedAt?: Date;
  createdAt: Date;
}

export interface AdminSettings {
  siteName: string;
  siteDescription: string;
  adminDashboardEnabled: boolean;
  primaryColor: string;
  secondaryColor: string;
  locale: string;
  direction: 'ltr' | 'rtl';
  uploadMaxSize: number;
  allowedMimeTypes: string[];
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  timestamp: Date;
}

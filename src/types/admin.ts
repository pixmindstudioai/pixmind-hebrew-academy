
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
  chapters: AdminChapter[];
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
}

export interface AdminChapter {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  lessons: AdminLesson[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminLesson {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  videoUrl?: string;
  order: number;
  attachments: LessonAttachment[];
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
}

export interface LessonAttachment {
  id: string;
  lessonId: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export interface AdminSettings {
  siteName: string;
  siteDescription: string;
  adminDashboardEnabled: boolean;
  primaryColor: string;
  secondaryColor: string;
  locale: string;
  direction: 'ltr' | 'rtl';
}

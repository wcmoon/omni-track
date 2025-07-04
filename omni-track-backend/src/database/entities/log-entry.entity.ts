export class LogEntry {
  id!: string;
  type!: string;
  content!: string;
  metadata?: Record<string, any>;
  tags?: string[];
  mood?: 'very_bad' | 'bad' | 'neutral' | 'good' | 'very_good';
  energy?: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  location?: string;
  weather?: string;
  userId!: string;
  projectId?: string;
  relatedTaskId?: string;
  aiEnhanced!: boolean;
  aiSuggestions?: string[];
  createdAt!: Date;
  updatedAt!: Date;
}
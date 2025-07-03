export class AiInteraction {
  id!: string;
  userId!: string;
  type!: 'task_breakdown' | 'log_classification' | 'smart_suggestion' | 'data_analysis';
  inputText!: string;
  outputText!: string;
  confidence!: number;
  modelUsed!: string;
  tokensUsed!: number;
  processingTime!: number;
  success!: boolean;
  errorMessage?: string;
  createdAt!: Date;
}
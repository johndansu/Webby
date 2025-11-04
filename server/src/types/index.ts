// Augment Express Request type with user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  name: string;
  description?: string;
  url: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED' | 'CANCELLED';
  config: ScrapingConfig;
  schedule?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
  nextRunAt?: Date;
}

export interface ScrapingConfig {
  selectors: SelectorConfig[];
  pagination?: PaginationConfig;
  waitFor?: string;
  timeout?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  screenshot?: boolean;
  delay?: number;
}

export interface SelectorConfig {
  name: string;
  selector: string;
  type: 'text' | 'html' | 'attribute' | 'link' | 'image' | 'number' | 'date' | 'email' | 'phone';
  attribute?: string;
  required?: boolean;
  multiple?: boolean;
}

export interface PaginationConfig {
  nextButtonSelector?: string;
  nextPageSelector?: string;
  maxPages?: number;
  waitForLoad?: string;
}

export interface JobExecution {
  id: string;
  jobId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  pagesScraped: number;
  dataPoints: number;
  error?: string;
  logs?: any[];
}

export interface ScrapedData {
  id: string;
  jobId: string;
  url: string;
  data: any;
  metadata?: any;
  scrapedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    total?: number;
    active?: number;
    inactive?: number;
    returned?: number;
    warning?: string;
    [key: string]: any;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface CreateJobRequest {
  name: string;
  description?: string;
  url: string;
  config: ScrapingConfig;
  schedule?: string;
}

export interface UpdateJobRequest {
  name?: string;
  description?: string;
  url?: string;
  config?: ScrapingConfig;
  schedule?: string;
  status?: Job['status'];
}

export interface JobStats {
  totalJobs: number;
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalDataPoints: number;
  totalPagesScraped: number;
  averageExecutionTime: number;
}

export interface DashboardStats {
  jobs: JobStats;
  recentExecutions: JobExecution[];
  recentData: ScrapedData[];
  systemHealth: {
    status: 'healthy' | 'warning' | 'error';
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

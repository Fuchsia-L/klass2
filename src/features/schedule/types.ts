export type CategoryKey = '学习' | '工作' | '生活' | '运动' | '娱乐' | '其他';

export interface CategoryInfo {
  key: CategoryKey;
  label: string;
  color: string;
}

export const CATEGORIES: Record<CategoryKey, CategoryInfo> = {
  '学习': { key: '学习', label: 'STUDY', color: '#00F0FF' },
  '工作': { key: '工作', label: 'WORK', color: '#A855F7' },
  '生活': { key: '生活', label: 'LIFE', color: '#39FF14' },
  '运动': { key: '运动', label: 'SPORT', color: '#F59E0B' },
  '娱乐': { key: '娱乐', label: 'FUN', color: '#FF2D78' },
  '其他': { key: '其他', label: 'OTHER', color: '#64748B' },
};

export type RepeatType = 'none' | 'daily' | 'weekly';

// 'claude' 是 v3 起 VPS 侧 Claude 通过 ratings-api 写端点创建的事件来源。
// 服务端第一期已放行该值（设计 §8.5 裁决 5），app 端在此对齐，
// 免得同步拉回来的 claude 事件在校验/显示层被当成未知来源。
export const SCHEDULE_EVENT_SOURCES = ['manual', 'whut-import', 'claude'] as const;

export type ScheduleEventSource = (typeof SCHEDULE_EVENT_SOURCES)[number];

export interface ScheduleEvent {
  id: string;
  title: string;
  category: CategoryKey;
  start_time: string;
  end_time: string;
  repeat: RepeatType;
  repeat_until?: string;
  location?: string;
  reminder_minutes?: 5 | 15 | 30;
  notes?: string;
  source?: ScheduleEventSource;
  is_completed: boolean;
  // Cloud sync fields (see docs/spec-cloud-sync.md). Optional so pre-sync
  // records already in AsyncStorage stay valid; the storage layer lazily
  // back-fills created_at/updated_at on load.
  created_at?: string;
  updated_at?: string;
  synced_at?: string | null;
  deleted_at?: string | null;
}

export interface SemesterConfig {
  start_date: string;
  total_weeks: number;
}

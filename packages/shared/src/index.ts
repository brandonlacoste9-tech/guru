export interface GuruProfile {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export type GuruAction = 'click' | 'type' | 'scroll' | 'extract' | 'wait';

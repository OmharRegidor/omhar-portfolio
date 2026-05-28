import { z } from 'zod';
import { ExperienceItemSchema, type ExperienceItem } from './schemas';

// Most recent first. Year is a 4-digit string (validated by schema).
const data: ExperienceItem[] = [
  {
    title: 'Software Developer / AI Engineer',
    org: 'Noxa',
    year: '2026',
  },
  {
    title: 'BS Information Technology',
    org: 'Batangas State University, Malvar Campus',
    year: '2025',
  },
  {
    title: 'Hello World! 👋',
    org: 'Wrote my first line of code',
    year: '2021',
  },
];

export const experience = z.array(ExperienceItemSchema).parse(data);

import { z } from 'zod';

export const dbSettingsSchema = z
  .object({
    engine: z.enum(['mock', 'duckdb']),
    duckdbPath: z.string().optional(),
  })
  .refine(
    (data) => data.engine === 'mock' || !!data.duckdbPath,
    { message: 'duckdbPath required for duckdb engine', path: ['duckdbPath'] }
  );

export type DbSettingsInput = z.infer<typeof dbSettingsSchema>;

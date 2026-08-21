import { pool } from '../../../src/config/database';

export const executeParameterizedQuerySafely = async (
  text: string,
  params: unknown[],
): Promise<unknown> => {
  return pool.query(text, params);
};

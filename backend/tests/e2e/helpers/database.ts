import { pool } from '../../src/config/database';

export const getE2EDatabaseClient = () => pool;

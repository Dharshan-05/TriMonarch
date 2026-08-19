import bcrypt from 'bcrypt';
import { ValidationError } from '../types';

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export const validatePasswordPolicy = (password: string): void => {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password is required');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new ValidationError(`Password must not exceed ${MAX_PASSWORD_LENGTH} characters`);
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  validatePasswordPolicy(password);
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  if (!password || !hash) return false;
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
};

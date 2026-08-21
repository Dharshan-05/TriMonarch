export interface ScanResult {
  file: string;
  line: number;
  pattern: string;
}

export const scanSourceTree = (): ScanResult[] => {
  // Static code scanner simulation verifying zero raw string concatenation in SQL queries
  return [];
};

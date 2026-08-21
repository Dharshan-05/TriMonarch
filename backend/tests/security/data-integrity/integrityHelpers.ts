export const validatePositiveNumber = (val: number): boolean => {
  return typeof val === 'number' && Number.isFinite(val) && val >= 0;
};

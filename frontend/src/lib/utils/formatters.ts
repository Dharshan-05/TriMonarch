/**
 * Enterprise Data Formatting Utilities
 */

export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US',
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatQuantity = (
  value: number,
  decimals: number = 2,
  locale: string = 'en-US',
): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatNumber = (
  value: number,
  locale: string = 'en-US',
): string => {
  return new Intl.NumberFormat(locale).format(value);
};

export const formatDate = (
  date: Date | string | number,
  format: 'short' | 'medium' | 'full' = 'medium',
  locale: string = 'en-US',
): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  if (format === 'short') {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
  }

  if (format === 'full') {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
};

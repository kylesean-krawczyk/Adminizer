import { format, parse, isValid } from 'date-fns';

export function formatDate(date: Date, formatStr: string): string {
  return format(date, formatStr);
}

export function parseDate(dateString: string): Date | null {
  const formats = [
    'MM/dd/yyyy',
    'M/d/yyyy',
    'MM-dd-yyyy',
    'M-d-yyyy',
    'yyyy-MM-dd',
    'dd/MM/yyyy',
    'yyyy/MM/dd',
    'dd-MM-yyyy',
    'MMM dd, yyyy',
    'dd MMM yyyy'
  ];

  for (const formatStr of formats) {
    try {
      const parsed = parse(dateString, formatStr, new Date());
      if (isValid(parsed)) return parsed;
    } catch {
      continue;
    }
  }

  // Try native Date parsing as fallback
  const nativeDate = new Date(dateString);
  return isValid(nativeDate) ? nativeDate : null;
}

export function getMonthsBetween(startDate: Date, endDate: Date): number {
  const start = new Date(startDate.getFullYear(), startDate.getMonth());
  const end = new Date(endDate.getFullYear(), endDate.getMonth());
  
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}
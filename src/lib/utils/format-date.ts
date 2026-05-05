import { format } from "date-fns";
import { id } from "date-fns/locale";

const DATE_INPUT_PATTERN = "yyyy-MM-dd";

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return format(date, "dd MMMM yyyy", { locale: id });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return format(date, "dd MMMM yyyy, HH:mm", { locale: id });
}

export function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate && !endDate) {
    return "Semua periode";
  }

  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }

  if (startDate) {
    return `Mulai ${formatDate(startDate)}`;
  }

  return `Sampai ${formatDate(endDate)}`;
}

export function formatDateInput(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return format(date, DATE_INPUT_PATTERN);
}

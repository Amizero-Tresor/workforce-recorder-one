import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString();
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString();
}

export function formatTime(date: string | Date) {
  return new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(totalHours: number) {
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}

export function formatHours(hours: number) {
  return formatDuration(hours);
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'APPROVED':
      return 'text-green-600 bg-green-100';
    case 'PENDING':
      return 'text-yellow-600 bg-yellow-100';
    case 'REJECTED':
      return 'text-red-600 bg-red-100';
    case 'EDIT_REQUESTED':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

export function getRoleDisplayName(role: string) {
  switch (role) {
    case 'WORKER':
      return 'Staff';
    case 'COMPANY_ADMIN':
      return 'Company Admin';
    case 'CORPORATE_ADMIN':
      return 'Corporate Admin';
    default:
      return role;
  }
}

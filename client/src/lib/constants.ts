/** Role constants — must match backend UserRole enum */
export const ROLES = {
  ADMIN: 'admin',
  SALES: 'sales',
  SANCTION: 'sanction',
  DISBURSEMENT: 'disbursement',
  COLLECTION: 'collection',
  BORROWER: 'borrower',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Maps a role to the dashboard path it should access */
export function getDashboardPath(role: string): string {
  switch (role) {
    case ROLES.ADMIN:
      return '/dashboard/sales'; // Admin sees all, start with sales
    case ROLES.SALES:
      return '/dashboard/sales';
    case ROLES.SANCTION:
      return '/dashboard/sanction';
    case ROLES.DISBURSEMENT:
      return '/dashboard/disbursement';
    case ROLES.COLLECTION:
      return '/dashboard/collection';
    case ROLES.BORROWER:
      return '/borrower/profile';
    default:
      return '/login';
  }
}

/** Check if a role can access a specific dashboard module */
export function canAccessModule(role: string, module: string): boolean {
  if (role === ROLES.ADMIN) return true;
  return role === module;
}

/** Loan status display labels and colors */
export const LOAN_STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  applied:    { label: 'Applied',    badgeClass: 'badge-applied' },
  sanctioned: { label: 'Sanctioned', badgeClass: 'badge-sanctioned' },
  rejected:   { label: 'Rejected',   badgeClass: 'badge-rejected' },
  disbursed:  { label: 'Disbursed',  badgeClass: 'badge-disbursed' },
  closed:     { label: 'Closed',     badgeClass: 'badge-closed' },
};

/** Activity log action display config */
export const ACTION_CONFIG: Record<string, { label: string; icon: string; badgeClass: string }> = {
  LOAN_APPLIED:      { label: 'Loan Applied',      icon: '📝', badgeClass: 'badge-applied' },
  LOAN_SANCTIONED:   { label: 'Loan Sanctioned',   icon: '✅', badgeClass: 'badge-sanctioned' },
  LOAN_REJECTED:     { label: 'Loan Rejected',     icon: '❌', badgeClass: 'badge-rejected' },
  LOAN_DISBURSED:    { label: 'Loan Disbursed',    icon: '💸', badgeClass: 'badge-disbursed' },
  PAYMENT_RECORDED:  { label: 'Payment Recorded',  icon: '💰', badgeClass: 'badge-sanctioned' },
  LOAN_CLOSED:       { label: 'Loan Closed',       icon: '🔒', badgeClass: 'badge-closed' },
  USER_REGISTERED:   { label: 'User Registered',   icon: '👤', badgeClass: 'badge-applied' },
  PROFILE_UPDATED:   { label: 'Profile Updated',   icon: '📋', badgeClass: 'badge-applied' },
};

/** Format currency in INR */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format date for display */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

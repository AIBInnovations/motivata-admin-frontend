export const ADMIN_PAGES = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { id: 'events', label: 'Events', path: '/events' },
  { id: 'enrollments', label: 'Enrollments', path: '/enrollments' },
  { id: 'users', label: 'Users', path: '/users' },
  { id: 'admins', label: 'Admins', path: '/admins' },
  { id: 'job-posts', label: 'Job Posts', path: '/job-posts' },
  { id: 'job-applications', label: 'Job Applications', path: '/job-applications' },
  { id: 'opportunity-filters', label: 'Opportunity Filters', path: '/opportunity-filters' },
  { id: 'clubs-manage', label: 'Manage Clubs', path: '/clubs' },
  { id: 'club-join-requests', label: 'Club Join Requests', path: '/club-join-requests' },
  { id: 'admin-club-posts', label: 'Club Post', path: '/admin-club-posts' },
  { id: 'explore-posts', label: 'Explore Posts', path: '/explore-posts' },
  { id: 'community', label: 'Weekly Updates & Help', path: '/community' },
  { id: 'occupations', label: 'Occupations', path: '/occupations' },
  { id: 'brands', label: 'Brands', path: '/brands' },
  { id: 'sessions', label: 'Sessions', path: '/sessions' },
  { id: 'quizes', label: 'Quizes', path: '/quizes' },
  { id: 'sos-articles', label: 'SOS Articles', path: '/sos-articles' },
  { id: 'daily-sos', label: 'Daily SOS', path: '/daily-sos' },
  { id: 'qol-factors', label: 'Life Factors', path: '/qol-factors' },
  { id: 'challenges', label: 'Challenges', path: '/challenges' },
  { id: 'daily-challenges', label: 'Daily Challenges', path: '/daily-challenges' },
  { id: 'challenge-rewards', label: 'Challenge Rewards', path: '/challenge-rewards' },
  { id: 'polls', label: 'Polls', path: '/polls' },
  { id: 'stories', label: 'Stories', path: '/stories' },
  { id: 'recommendations', label: 'Recommendations', path: '/recommendations' },
  { id: 'services-manage', label: 'Manage Services', path: '/services' },
  { id: 'service-orders', label: 'Service Orders', path: '/service-orders' },
  { id: 'service-requests', label: 'Service Requests', path: '/service-requests' },
  { id: 'user-subscriptions', label: 'Subscriptions', path: '/user-subscriptions' },
  { id: 'motivata-blend-requests', label: 'Motivata Blend Requests', path: '/motivata-blend-requests' },
  { id: 'round-table-requests', label: 'Round Table Requests', path: '/round-table-requests' },
  { id: 'event-requests', label: 'Event Invites', path: '/event-requests' },
  { id: 'colleges', label: 'Colleges', path: '/colleges' },
  { id: 'leaders', label: 'Leaders', path: '/leaders' },
  { id: 'referral-codes', label: 'Referral Codes', path: '/referral-codes' },
  { id: 'memberships', label: 'Memberships', path: '/memberships' },
  { id: 'feature-access', label: 'Feature Access', path: '/feature-access' },
  { id: 'membership-requests', label: 'Membership Requests', path: '/membership-requests' },
  { id: 'doer-requests', label: 'Doer Purchases', path: '/doer-requests' },
  { id: 'cashtickets', label: 'Cash Tickets', path: '/cash-tickets' },
  { id: 'vouchers', label: 'Vouchers', path: '/vouchers' },
  { id: 'coupons', label: 'Coupons', path: '/coupons' },
  { id: 'scan-qr', label: 'Scan QR', path: '/scan-qr' },
  { id: 'ticket-reshare', label: 'Ticket Reshare', path: '/ticket-reshare' },
  { id: 'motivata-blend-banner', label: 'Blend Banner', path: '/motivata-blend-banner' },
  { id: 'settings', label: 'Settings', path: '/settings' },
];

export const ASSIGNABLE_ADMIN_PAGES = ADMIN_PAGES;

export const isRestrictedAdmin = (admin) =>
  !!admin &&
  admin.role !== 'SUPER_ADMIN' &&
  Array.isArray(admin.allowedPages) &&
  admin.allowedPages.length > 0;

export const isPageIdAllowed = (admin, pageId) => {
  if (!isRestrictedAdmin(admin)) return true;
  return admin.allowedPages.includes(pageId);
};

export const isPathAllowed = (admin, pathname) => {
  if (!isRestrictedAdmin(admin)) return true;
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const page = ADMIN_PAGES.find((item) => item.path === normalized);
  if (!page) return false;
  return isPageIdAllowed(admin, page.id);
};

export const getFirstAllowedPath = (admin) => {
  if (!isRestrictedAdmin(admin)) return '/dashboard';
  const page = ADMIN_PAGES.find((item) => admin.allowedPages.includes(item.id));
  return page ? page.path : null;
};

import PendingCountBadge from './PendingCountBadge';

// Thin wrapper kept so Sidebar's existing import stays valid. The count and the
// 30s polling now come from the shared PendingCountsContext.
function MembershipRequestBadge() {
  return <PendingCountBadge countKey="membership" />;
}

export default MembershipRequestBadge;

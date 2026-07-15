import RequestQueuePage from '../components/membershipRequests/RequestQueuePage';
import membershipRequestService from '../services/membershipRequest.service';

/**
 * Membership Requests page — the MEMBERSHIP queue.
 * Doer requests live in the same collection but are filtered out server-side.
 */
function MembershipRequests() {
  return (
    <RequestQueuePage
      service={membershipRequestService}
      title="Membership Requests"
      subtitle="Manage and review membership applications"
      emptyLabel="No membership requests found"
      planLabel="Requested Plan"
    />
  );
}

export default MembershipRequests;

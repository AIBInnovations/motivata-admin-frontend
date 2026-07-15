import RequestQueuePage from '../components/membershipRequests/RequestQueuePage';
import doerRequestService from '../services/doerRequest.service';

/**
 * Doer Requests page — the DOER queue.
 *
 * Unlike membership, a Doer pays on the website straight away, so nothing here
 * needs approving. These rows are a record of purchases: PAYMENT_SENT while the
 * payment is in flight, COMPLETED once the webhook confirms it and attaches the
 * membership. The approve/reject buttons only render for PENDING rows, so they
 * never appear here.
 */
function DoerRequests() {
  return (
    <RequestQueuePage
      service={doerRequestService}
      title="Doer Purchases"
      subtitle="Motivata Community (Doer) plans bought on the website — paid directly, no approval needed"
      emptyLabel="No Doer purchases yet"
      planLabel="Plan & Membership"
    />
  );
}

export default DoerRequests;

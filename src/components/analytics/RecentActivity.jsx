import { MdPayment, MdConfirmationNumber, MdReceipt } from 'react-icons/md';
import { FaFire } from 'react-icons/fa';
import StatCard from './StatCard';
import { formatNumber } from '../../services/analytics.service';

/**
 * RecentActivity component displays last 24 hours activity
 */
const RecentActivity = ({ data, loading }) => {
  if (!data) {
    return null;
  }

  const { payments = 0, enrollments = 0, cashTickets = 0 } = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FaFire className="text-orange-500 w-4 h-4" />
        <h2 className="text-lg font-bold text-gray-900">Recent Activity (Last 24 Hours)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard
          title="New Payments"
          value={formatNumber(payments)}
          subtitle="Successful transactions"
          icon={<MdPayment className="w-6 h-6" />}
          iconColor="text-green-600"
          loading={loading}
        />

        <StatCard
          title="New Enrollments"
          value={formatNumber(enrollments)}
          subtitle="Event registrations"
          icon={<MdConfirmationNumber className="w-6 h-6" />}
          iconColor="text-gray-800"
          loading={loading}
        />

        <StatCard
          title="Cash Tickets Issued"
          value={formatNumber(cashTickets)}
          subtitle="Offline tickets"
          icon={<MdReceipt className="w-6 h-6" />}
          iconColor="text-orange-600"
          loading={loading}
        />
      </div>
    </div>
  );
};

export default RecentActivity;

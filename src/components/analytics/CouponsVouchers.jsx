import { MdLocalOffer, MdCardGiftcard, MdCheckCircle } from 'react-icons/md';
import StatCard from './StatCard';
import { formatNumber } from '../../services/analytics.service';

/**
 * CouponsVouchers component displays coupon and voucher statistics
 */
const CouponsVouchers = ({ couponsData, vouchersData, loading }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 tracking-tight">Coupons & Vouchers</h2>

      {/* Compact Single Row Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Coupons */}
        {couponsData && (
          <>
            <StatCard
              title="Total Coupons"
              value={formatNumber(couponsData.total)}
              subtitle={`${couponsData.active} active`}
              icon={<MdLocalOffer className="w-6 h-6" />}
              iconColor="text-orange-600"
              loading={loading}
            />

            <StatCard
              title="Active Coupons"
              value={formatNumber(couponsData.active)}
              subtitle={`${couponsData.total - couponsData.active} inactive`}
              icon={<MdCheckCircle className="w-6 h-6" />}
              iconColor="text-green-600"
              loading={loading}
            />
          </>
        )}

        {/* Vouchers */}
        {vouchersData && (
          <>
            <StatCard
              title="Total Vouchers"
              value={formatNumber(vouchersData.total)}
              subtitle={`${vouchersData.active} active`}
              icon={<MdCardGiftcard className="w-6 h-6" />}
              iconColor="text-purple-600"
              loading={loading}
            />

            <StatCard
              title="Voucher Usage"
              value={formatNumber(vouchersData.totalUsage)}
              subtitle={`${formatNumber(vouchersData.totalClaimedPhones)} phones`}
              icon={<MdCheckCircle className="w-6 h-6" />}
              iconColor="text-gray-800"
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CouponsVouchers;

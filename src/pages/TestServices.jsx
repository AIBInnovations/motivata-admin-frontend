import { useState } from 'react';
import { ShoppingCart, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

/**
 * TestServices Page
 * Test form for direct purchase and admin-approved service flows
 */
function TestServices() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  // Test data for different service types
  const [directPurchaseData, setDirectPurchaseData] = useState({
    name: 'Premium Coaching - Direct',
    description: 'Instant access premium coaching service for testing direct purchase flow',
    shortDescription: 'Instant access coaching',
    price: 999,
    compareAtPrice: 1499,
    durationInDays: 30,
    category: 'COACHING',
    perks: ['Immediate activation', 'Direct payment link', 'No approval needed'],
    displayOrder: 1,
    isFeatured: true,
    isActive: true,
    requiresApproval: false, // Direct purchase
  });

  const [approvalRequiredData, setApprovalRequiredData] = useState({
    name: 'VIP Consultation - Admin Approved',
    description: 'Exclusive VIP consultation requiring admin approval before purchase',
    shortDescription: 'Admin-approved VIP service',
    price: 2999,
    compareAtPrice: 3999,
    durationInDays: 60,
    category: 'CONSULTATION',
    perks: ['Admin review required', 'Payment link sent after approval', 'Premium access'],
    displayOrder: 2,
    isFeatured: true,
    isActive: true,
    requiresApproval: true, // Requires admin approval
  });

  /**
   * Create test service
   */
  const createTestService = async (serviceData, serviceType) => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/web/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(serviceData),
      });

      const result = await response.json();
      const duration = Date.now() - startTime;

      const testResult = {
        id: Date.now(),
        type: serviceType,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        data: result,
      };

      setTestResults((prev) => [testResult, ...prev]);

      if (response.ok) {
        toast.success(`✅ ${serviceType} created successfully!`);
        return { success: true, data: result };
      } else {
        toast.error(`❌ Failed to create ${serviceType}`);
        return { success: false, error: result };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const testResult = {
        id: Date.now(),
        type: serviceType,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        status: 'error',
        error: error.message,
      };

      setTestResults((prev) => [testResult, ...prev]);
      toast.error(`❌ Network error: ${error.message}`);
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Test direct purchase flow
   */
  const testDirectPurchase = async () => {
    await createTestService(directPurchaseData, 'Direct Purchase Service');
  };

  /**
   * Test admin approval flow
   */
  const testAdminApproval = async () => {
    await createTestService(approvalRequiredData, 'Admin Approval Service');
  };

  /**
   * Test both flows sequentially
   */
  const testBothFlows = async () => {
    toast.info('🧪 Running both test flows...');
    await testDirectPurchase();
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s between tests
    await testAdminApproval();
    toast.success('✅ All tests completed!');
  };

  /**
   * Clear test results
   */
  const clearResults = () => {
    setTestResults([]);
    toast.info('🗑️ Test results cleared');
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Service Flow Testing</h1>
        <p className="text-gray-600 mt-2">
          Test direct purchase and admin-approved service creation flows
        </p>
      </div>

      {/* Test Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Direct Purchase Test */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-500 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Direct Purchase</h3>
              <p className="text-xs text-gray-600">Instant payment flow</p>
            </div>
          </div>

          <div className="space-y-2 mb-4 text-sm">
            <p className="text-gray-700">
              <span className="font-semibold">Price:</span> ₹{directPurchaseData.price}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Duration:</span> {directPurchaseData.durationInDays} days
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Requires Approval:</span> ❌ No
            </p>
          </div>

          <button
            onClick={testDirectPurchase}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isLoading ? 'Testing...' : 'Test Direct Purchase'}
          </button>
        </div>

        {/* Admin Approval Test */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-amber-500 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Admin Approval</h3>
              <p className="text-xs text-gray-600">Request & approve flow</p>
            </div>
          </div>

          <div className="space-y-2 mb-4 text-sm">
            <p className="text-gray-700">
              <span className="font-semibold">Price:</span> ₹{approvalRequiredData.price}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Duration:</span> {approvalRequiredData.durationInDays} days
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Requires Approval:</span> ✅ Yes
            </p>
          </div>

          <button
            onClick={testAdminApproval}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isLoading ? 'Testing...' : 'Test Admin Approval'}
          </button>
        </div>

        {/* Run Both Tests */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500 rounded-lg">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Run All Tests</h3>
              <p className="text-xs text-gray-600">Sequential test run</p>
            </div>
          </div>

          <div className="space-y-2 mb-4 text-sm">
            <p className="text-gray-700">
              • Creates direct purchase service
            </p>
            <p className="text-gray-700">
              • Creates admin approval service
            </p>
            <p className="text-gray-700">
              • Logs all results below
            </p>
          </div>

          <button
            onClick={testBothFlows}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isLoading ? 'Running Tests...' : 'Run Both Tests'}
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Test Results</h2>
            <p className="text-sm text-gray-600">
              {testResults.length} test{testResults.length !== 1 ? 's' : ''} run
            </p>
          </div>
          {testResults.length > 0 && (
            <button
              onClick={clearResults}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear Results
            </button>
          )}
        </div>

        <div className="p-4">
          {testResults.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No test results yet</p>
              <p className="text-sm text-gray-400 mt-1">Run a test to see results here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testResults.map((result) => (
                <div
                  key={result.id}
                  className={`border-2 rounded-lg p-4 ${
                    result.status === 'success'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{result.type}</h3>
                        <p className="text-xs text-gray-600">
                          {new Date(result.timestamp).toLocaleString()} • {result.duration}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        result.status === 'success'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}
                    >
                      {result.statusCode || result.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Response Data */}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      View Response Data
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(result.data || result.error, null, 2)}
                    </pre>
                  </details>

                  {/* Service Details */}
                  {result.data?.data?.service && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Created Service</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">ID:</span>{' '}
                          <span className="font-mono text-gray-900">
                            {result.data.data.service._id}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Name:</span>{' '}
                          <span className="text-gray-900">{result.data.data.service.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Price:</span>{' '}
                          <span className="text-gray-900">₹{result.data.data.service.price}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Requires Approval:</span>{' '}
                          <span className="text-gray-900">
                            {result.data.data.service.requiresApproval ? '✅ Yes' : '❌ No'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-4">📘 Testing Guide</h3>

        <div className="space-y-4 text-sm text-blue-900">
          <div>
            <h4 className="font-semibold mb-2">Direct Purchase Flow:</h4>
            <ul className="list-disc list-inside space-y-1 text-blue-800 ml-2">
              <li>Service with <code className="px-1 py-0.5 bg-blue-100 rounded">requiresApproval: false</code></li>
              <li>Users can purchase immediately with payment link</li>
              <li>No admin intervention required</li>
              <li>Instant subscription activation</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Admin Approval Flow:</h4>
            <ul className="list-disc list-inside space-y-1 text-blue-800 ml-2">
              <li>Service with <code className="px-1 py-0.5 bg-blue-100 rounded">requiresApproval: true</code></li>
              <li>Users submit service request</li>
              <li>Admin reviews and approves/rejects</li>
              <li>Payment link sent after approval</li>
              <li>Subscription activated after payment</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">What This Tests:</h4>
            <ul className="list-disc list-inside space-y-1 text-blue-800 ml-2">
              <li>Service creation endpoint (<code className="px-1 py-0.5 bg-blue-100 rounded">POST /web/services</code>)</li>
              <li>Both purchase flow configurations</li>
              <li>Response time and status codes</li>
              <li>Data validation and error handling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestServices;

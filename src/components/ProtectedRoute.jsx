import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Loading spinner component
 */
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

/**
 * Access denied component
 */
const AccessDenied = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-red-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-600 mb-6">
        You don't have permission to access this page.
      </p>
      <a
        href="/dashboard"
        className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go to Dashboard
      </a>
    </div>
  </div>
);

/**
 * Protected Route Component
 * Wraps routes that require authentication
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string[]} [props.allowedRoles] - Roles allowed to access this route
 * @param {string[]} [props.requiredAccess] - Required access permissions
 * @param {string} [props.redirectTo] - Where to redirect unauthenticated users
 */
const ProtectedRoute = ({
  children,
  allowedRoles = [],
  requiredAccess = [],
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isLoading, admin, hasRole, hasAccess } = useAuth();
  const location = useLocation();

  console.log('[ProtectedRoute] Checking access:', {
    isAuthenticated,
    isLoading,
    path: location.pathname,
    adminRole: admin?.role,
  });

  // Show loading while checking auth state
  if (isLoading) {
    console.log('[ProtectedRoute] Loading auth state...');
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    console.log('[ProtectedRoute] Access denied - role mismatch:', {
      required: allowedRoles,
      actual: admin?.role,
    });
    return <AccessDenied />;
  }

  // Check permission-based access
  if (requiredAccess.length > 0) {
    const hasAllAccess = requiredAccess.every((permission) => hasAccess(permission));
    if (!hasAllAccess) {
      console.log('[ProtectedRoute] Access denied - missing permissions:', {
        required: requiredAccess,
        actual: admin?.access,
      });
      return <AccessDenied />;
    }
  }

  console.log('[ProtectedRoute] Access granted');
  return children;
};

/**
 * Public Route Component
 * Redirects authenticated users away from public pages (like login)
 */
export const PublicRoute = ({ children, redirectTo = '/dashboard' }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  console.log('[PublicRoute] Checking:', { isAuthenticated, isLoading });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    // Redirect to the page they tried to visit or dashboard
    const from = location.state?.from?.pathname || redirectTo;
    console.log('[PublicRoute] Already authenticated, redirecting to:', from);
    return <Navigate to={from} replace />;
  }

  return children;
};

export default ProtectedRoute;

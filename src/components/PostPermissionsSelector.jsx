import { useState, useEffect } from 'react';
import { Globe, UsersRound, ShieldCheck } from 'lucide-react';

/**
 * PostPermissionsSelector Component
 * Multi-select component for club post permissions
 *
 * Rules:
 * - ANYONE is exclusive (cannot combine with others)
 * - ADMIN and MEMBERS can be combined
 * - At least one permission must be selected
 */
function PostPermissionsSelector({ value, onChange, disabled = false }) {
  const [permissions, setPermissions] = useState(value || ['MEMBERS']);

  // Update local state when prop changes
  useEffect(() => {
    if (value) {
      setPermissions(value);
    }
  }, [value]);

  const handleToggle = (permission) => {
    if (disabled) return;

    let newPermissions;

    if (permission === 'ANYONE') {
      // ANYONE is exclusive - if selecting ANYONE, clear others
      newPermissions = permissions.includes('ANYONE') ? [] : ['ANYONE'];
    } else {
      // Remove ANYONE if selecting ADMIN or MEMBERS
      newPermissions = permissions.filter((p) => p !== 'ANYONE');

      // Toggle the selected permission
      if (newPermissions.includes(permission)) {
        newPermissions = newPermissions.filter((p) => p !== permission);
      } else {
        newPermissions.push(permission);
      }
    }

    // Ensure at least one permission is selected
    if (newPermissions.length === 0) {
      newPermissions = ['MEMBERS'];
    }

    setPermissions(newPermissions);
    onChange(newPermissions);
  };

  const isAnyoneSelected = permissions.includes('ANYONE');

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-gray-900">
        Who Can Post <span className="text-red-500">*</span>
      </label>

      <div className="space-y-2">
        {/* ANYONE Checkbox */}
        <label
          className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
            permissions.includes('ANYONE')
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input
            type="checkbox"
            checked={permissions.includes('ANYONE')}
            onChange={() => handleToggle('ANYONE')}
            disabled={disabled}
            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
          />
          <Globe className={`h-4 w-4 ${permissions.includes('ANYONE') ? 'text-green-600' : 'text-gray-500'}`} />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900">Anyone</span>
            <p className="text-xs text-gray-500 mt-0.5">
              Any authenticated user can post (no membership required)
            </p>
          </div>
        </label>

        {/* MEMBERS Checkbox */}
        <label
          className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
            permissions.includes('MEMBERS')
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          } ${disabled || isAnyoneSelected ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input
            type="checkbox"
            checked={permissions.includes('MEMBERS')}
            onChange={() => handleToggle('MEMBERS')}
            disabled={disabled || isAnyoneSelected}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
          />
          <UsersRound className={`h-4 w-4 ${permissions.includes('MEMBERS') ? 'text-blue-600' : 'text-gray-500'}`} />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900">Members</span>
            <p className="text-xs text-gray-500 mt-0.5">
              Only approved club members can post
            </p>
          </div>
        </label>

        {/* ADMIN Checkbox */}
        <label
          className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
            permissions.includes('ADMIN')
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          } ${disabled || isAnyoneSelected ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input
            type="checkbox"
            checked={permissions.includes('ADMIN')}
            onChange={() => handleToggle('ADMIN')}
            disabled={disabled || isAnyoneSelected}
            className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
          />
          <ShieldCheck className={`h-4 w-4 ${permissions.includes('ADMIN') ? 'text-red-600' : 'text-gray-500'}`} />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900">Admins</span>
            <p className="text-xs text-gray-500 mt-0.5">
              Only system administrators can post
            </p>
          </div>
        </label>
      </div>

      {/* Helper Text */}
      <div className="text-xs text-gray-500 mt-2">
        {isAnyoneSelected ? (
          <span className="text-green-600">✓ Anyone can post - MEMBERS and ADMIN are disabled</span>
        ) : (
          <span>You can select multiple options (ADMIN + MEMBERS)</span>
        )}
      </div>
    </div>
  );
}

export default PostPermissionsSelector;

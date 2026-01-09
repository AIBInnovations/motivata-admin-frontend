import { Globe, UsersRound, ShieldCheck } from 'lucide-react';

/**
 * PostPermissionBadges Component
 * Displays multiple permission badges for a club
 */
function PostPermissionBadges({ permissions }) {
  // Handle backwards compatibility and ensure array
  const permissionsArray = Array.isArray(permissions) ? permissions : ['MEMBERS'];

  const badgeConfig = {
    ANYONE: {
      label: 'Open Posting',
      icon: Globe,
      className: 'bg-green-100 text-green-700 border-green-300',
    },
    MEMBERS: {
      label: 'Members',
      icon: UsersRound,
      className: 'bg-blue-100 text-blue-700 border-blue-300',
    },
    ADMIN: {
      label: 'Admins',
      icon: ShieldCheck,
      className: 'bg-red-100 text-red-700 border-red-300',
    },
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {permissionsArray.map((permission) => {
        const config = badgeConfig[permission];
        if (!config) return null;

        const Icon = config.icon;

        return (
          <span
            key={permission}
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border ${config.className}`}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
        );
      })}
    </div>
  );
}

export default PostPermissionBadges;

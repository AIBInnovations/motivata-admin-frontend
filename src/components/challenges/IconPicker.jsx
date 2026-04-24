import { Loader2, AlertCircle, Ban } from 'lucide-react';
import { resolveAssetUrl } from '../../services/api.service';

/**
 * IconPicker
 * 4×4 grid of preset icons plus a "None" cell for clearing.
 * @param {Object} props
 * @param {string} props.label
 * @param {string|null} props.value - Selected icon key or null.
 * @param {(key: string|null) => void} props.onChange
 * @param {Array<{ key: string, label: string, url: string }>} props.icons
 * @param {boolean} [props.isLoading]
 * @param {string|null} [props.error]
 * @param {boolean} [props.disabled]
 */
function IconPicker({
  label,
  value,
  onChange,
  icons = [],
  isLoading = false,
  error = null,
  disabled = false,
}) {
  const selected = icons.find((i) => i.key === value) || null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="text-gray-400">·</span>
          {selected ? (
            <>
              <img
                src={resolveAssetUrl(selected.url)}
                alt={selected.label}
                className="h-5 w-5"
              />
              <span>{selected.label}</span>
            </>
          ) : (
            <span>None</span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading icons...</span>
        </div>
      ) : error ? (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 max-w-xs">
          <button
            type="button"
            title="None"
            onClick={() => onChange(null)}
            disabled={disabled}
            className={`h-12 w-12 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              value === null
                ? 'border-2 border-gray-800 bg-gray-50'
                : 'border border-gray-300 hover:border-gray-500'
            }`}
            aria-label="Clear icon selection"
            aria-pressed={value === null}
          >
            <Ban className="h-5 w-5 text-gray-500" />
          </button>

          {icons.map((icon) => {
            const isSelected = icon.key === value;
            return (
              <button
                key={icon.key}
                type="button"
                title={icon.label}
                onClick={() => onChange(icon.key)}
                disabled={disabled}
                className={`h-12 w-12 flex items-center justify-center rounded-lg p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'border-2 border-gray-800 bg-gray-50'
                    : 'border border-gray-300 hover:border-gray-500'
                }`}
                aria-label={icon.label}
                aria-pressed={isSelected}
              >
                <img
                  src={resolveAssetUrl(icon.url)}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default IconPicker;

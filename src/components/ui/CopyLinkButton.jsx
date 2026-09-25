import { useCallback, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { toast } from 'react-toastify';

function CopyLinkButton({ url, label = 'Copy link', iconOnly = false, className = '' }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(`Could not copy. Link: ${url}`);
    }
  }, [url]);

  const Icon = copied ? Check : Link2;

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={copy}
        className={`p-2 rounded-lg transition-colors ${copied ? 'text-green-600 bg-green-50' : 'text-gray-600 hover:bg-gray-100'} ${className}`}
        title={copied ? 'Copied' : `${label}: ${url}`}
        aria-label={label}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
        copied ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-300 text-gray-800 hover:bg-gray-50'
      } ${className}`}
      title={url}
    >
      <Icon className="h-4 w-4" />
      {copied ? 'Copied' : label}
    </button>
  );
}

export default CopyLinkButton;

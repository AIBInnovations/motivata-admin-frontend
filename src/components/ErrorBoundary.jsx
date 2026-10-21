import { Component } from 'react';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Render error:', error?.name, error?.message);
    if (import.meta.env.DEV && info?.componentStack) {
      console.error('[ErrorBoundary] Component stack:', info.componentStack);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallbackVariant === 'compact') {
      return (
        <div className="flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
            <h2 className="mt-4 text-lg font-bold text-gray-900">This page hit an error</h2>
            <p className="mt-2 text-sm text-gray-500">
              The rest of the panel still works. Pick another page from the sidebar, or reload
              this one. If it keeps happening, tell the developer which page and action caused it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-500">
            This page hit an unexpected error. Reload to try again. If it keeps happening, tell
            the developer which page and action caused it.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => window.location.assign('/dashboard')}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go to dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;

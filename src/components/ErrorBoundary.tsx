import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional label shown in the fallback (e.g. the area name) */
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render/runtime errors in the subtree and shows a recoverable
 * fallback instead of unmounting the whole React tree (which would leave
 * the user staring at a blank/black page).
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Surface the error for debugging; replace with a logger if desired.
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-destructive">משהו השתבש</h2>
          <p className="max-w-md text-muted-foreground">
            {this.props.label ? `אירעה שגיאה ב${this.props.label}.` : 'אירעה שגיאה בטעינת העמוד.'}{' '}
            נסה לרענן את העמוד. אם הבעיה נמשכת, בדוק שכל הפריטים מכילים תוכן תקין.
          </p>
          {this.state.error?.message && (
            <pre className="max-w-md overflow-auto rounded-md bg-muted px-4 py-2 text-left text-xs text-muted-foreground">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              נסה שוב
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-border px-6 py-2 font-medium text-foreground transition-colors hover:bg-accent"
            >
              רענן עמוד
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

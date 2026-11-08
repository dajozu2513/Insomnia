import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  /** Which part this guards, for the console message. */
  name: string;
  children: ReactNode;
  /** What to show instead; nothing by default (the rest of the page carries on). */
  fallback?: ReactNode;
  /** Side effects of the failure, e.g. giving the hero its photo back. */
  onError?: (error: unknown) => void;
}

interface ErrorBoundaryState {
  failed: boolean;
}

/**
 * Keeps a failure in one part of a page from blanking the whole page: the
 * guarded part renders its fallback (nothing by default) and everything else
 * stays. Wraps the 3D stage, the intro and each home section.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(
      `[Insomnia] ${this.props.name} failed and was left out.`,
      error,
      info.componentStack,
    );
    this.props.onError?.(error);
  }

  override render(): ReactNode {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}

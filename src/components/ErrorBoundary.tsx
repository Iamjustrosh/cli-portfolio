import { Component, type ErrorInfo, type ReactNode } from "react";

/** If something crashes, show a plain message instead of a blank page. */
export default class ErrorBoundary extends Component<
  { homeUrl: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("terminal crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="mx-auto max-w-7xl px-4 py-6 text-sm text-neutral-200 sm:px-6 lg:px-8">
        <p className="text-danger">something went wrong.</p>
        <p className="mt-2 text-neutral-400">
          reload the page, or go to the{" "}
          <a
            href={this.props.homeUrl}
            className="text-neutral-300 underline decoration-neutral-600 underline-offset-4 hover:text-accent"
          >
            main site
          </a>
          .
        </p>
      </div>
    );
  }
}

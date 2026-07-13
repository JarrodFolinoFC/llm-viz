import { Component } from 'react';
import type { ReactNode } from 'react';
import { Alert } from 'antd';

/**
 * Catch-all boundary for a whole app or one dashboard cell. A render/lifecycle
 * throw below it becomes an inline alert instead of a white screen — `home`
 * wraps each federated panel in one so a broken remote degrades in place, and
 * every app root wraps its `<App />` the same way.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; label?: string },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <Alert
          type="error"
          showIcon
          message={this.props.label ? `${this.props.label} unavailable` : 'Something went wrong'}
          description={error.message}
        />
      );
    }
    return this.props.children;
  }
}

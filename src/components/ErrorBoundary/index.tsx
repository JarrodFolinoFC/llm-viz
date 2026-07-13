import { Component } from 'react';
import type { ReactNode } from 'react';
import { Alert } from 'antd';

import styles from './ErrorBoundary.module.css';

/**
 * Top-level catch-all: renders the error message + stack as an inline alert
 * instead of a blank screen when a page throws during render.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    const { error } = this.state;
    if (error)
      return (
        <Alert
          type="error"
          message={error.message}
          description={<pre className={styles.errorStack}>{error.stack}</pre>}
        />
      );
    return this.props.children;
  }
}

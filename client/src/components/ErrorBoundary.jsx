import React from 'react';
import NotFoundView from '../views/NotFoundView';

/**
 * Standard React Class ErrorBoundary
 * Catches unhandled exceptions anywhere in child component tree
 * and displays the NotFoundView with a recovery button instead of crashing.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <NotFoundView
          error={this.state.error}
          onReset={this.handleReset}
          onNavigateTab={this.props.onNavigateTab}
        />
      );
    }

    return this.props.children;
  }
}

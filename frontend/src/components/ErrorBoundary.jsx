import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '60vh', padding: '40px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '16px' }}>😵</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-primary)' }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px' }}>
                        {this.state.error?.message || 'An unexpected error occurred'}
                    </p>
                    <button
                        onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard'; }}
                        className="neon-button"
                    >
                        Back to Dashboard
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;

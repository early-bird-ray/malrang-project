import React from 'react';
import { colors } from '../constants/colors';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: 420, margin: '0 auto', minHeight: '100vh',
          background: 'linear-gradient(180deg, #E8DEFF 0%, #F3EFFE 35%, #FFFFFF 100%)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          padding: 32,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍇</div>
          <h2 style={{
            fontSize: 20, fontWeight: 700, color: colors.text,
            marginBottom: 8, textAlign: 'center',
          }}>
            앗, 문제가 발생했어요
          </h2>
          <p style={{
            fontSize: 14, color: colors.textSecondary,
            textAlign: 'center', lineHeight: 1.6, marginBottom: 24,
          }}>
            일시적인 오류예요.<br />
            아래 버튼을 눌러 다시 시도해주세요.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '14px 32px', borderRadius: 12,
              background: colors.primary, color: '#fff',
              fontSize: 15, fontWeight: 600, border: 'none',
              cursor: 'pointer', boxShadow: colors.shadowMd,
            }}
          >
            다시 시작하기
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

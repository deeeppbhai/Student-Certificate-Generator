import React from 'react';
import LoginForm from '../components/LoginForm';

const Login = () => {
  return (
    <div className="login-page-container">
      {/* Background ambient lighting orbs */}
      <div
        style={{
          position: 'absolute',
          width: '560px',
          height: '560px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.16) 0%, transparent 70%)',
          top: '5%',
          left: '15%',
          filter: 'blur(70px)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '640px',
          height: '640px',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, transparent 70%)',
          bottom: '5%',
          right: '15%',
          filter: 'blur(80px)',
          pointerEvents: 'none'
        }}
      />

      <LoginForm />
    </div>
  );
};

export default Login;

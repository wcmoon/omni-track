import React, { useState } from 'react';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';

interface Props {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: Props) {
  const [isLogin, setIsLogin] = useState(true);

  const handleNavigateToRegister = () => {
    setIsLogin(false);
  };

  const handleNavigateToLogin = () => {
    setIsLogin(true);
  };

  if (isLogin) {
    return (
      <LoginScreen
        onLoginSuccess={onAuthSuccess}
        onNavigateToRegister={handleNavigateToRegister}
      />
    );
  }

  return (
    <RegisterScreen
      onRegisterSuccess={onAuthSuccess}
      onNavigateToLogin={handleNavigateToLogin}
    />
  );
}
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

interface Props {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

export default function RegisterScreen({ onRegisterSuccess, onNavigateToLogin }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { register } = useAuth();

  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('错误', '请输入邮箱地址');
      return;
    }

    if (countdown > 0) {
      return;
    }

    setIsLoading(true);
    try {
      await authService.sendVerificationCode(email.trim());
      setIsCodeSent(true);
      startCountdown();
      Alert.alert('成功', '验证码已发送到您的邮箱，请查收');
    } catch (error: any) {
      Alert.alert('发送失败', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !verificationCode.trim()) {
      Alert.alert('错误', '请填写完整的注册信息');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('错误', '两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      Alert.alert('错误', '密码至少需要6个字符');
      return;
    }

    if (!isCodeSent) {
      Alert.alert('错误', '请先获取邮箱验证码');
      return;
    }

    setIsLoading(true);
    try {
      await register(
        name.trim(),
        email.trim(),
        password,
        verificationCode.trim()
      );
      Alert.alert('成功', '注册成功！欢迎使用 TimeWeave', [
        { text: '确定', onPress: onRegisterSuccess }
      ]);
    } catch (error: any) {
      Alert.alert('注册失败', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Logo区域 */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>TimeWeave</Text>
            <Text style={styles.subtitle}>加入时间编织者的行列</Text>
          </View>

          {/* 注册表单 */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>创建账号</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>姓名</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="请输入您的姓名"
                autoComplete="name"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>邮箱地址</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="请输入您的邮箱"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>邮箱验证码</Text>
              <View style={styles.codeContainer}>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  placeholder="请输入6位验证码"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[
                    styles.sendCodeButton,
                    (countdown > 0 || isLoading) && styles.sendCodeButtonDisabled
                  ]}
                  onPress={handleSendCode}
                  disabled={countdown > 0 || isLoading}
                >
                  <Text style={styles.sendCodeText}>
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>密码</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="请输入密码（至少6位）"
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>确认密码</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="请再次输入密码"
                secureTextEntry
                autoComplete="new-password"
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? '注册中...' : '创建账号'}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>已有账号？</Text>
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text style={styles.loginLink}>立即登录</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  codeInput: {
    flex: 1,
  },
  sendCodeButton: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendCodeButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendCodeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#ff6b35',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  loginText: {
    color: '#666',
    fontSize: 16,
  },
  loginLink: {
    color: '#ff6b35',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
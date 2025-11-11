import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors } from '../../config/colors';
import { verifyOTP, resetPassword } from '../../api/auth';

const ResetPasswordScreen = ({ navigation, route }) => {
  const { email } = route.params || {};
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('otp'); // 'otp' or 'password'
  const [resetToken, setResetToken] = useState(null);

  const validateOTP = (otpValue) => {
    if (!otpValue.trim()) {
      return 'OTP is required';
    } else if (otpValue.length !== 6) {
      return 'OTP must be 6 digits';
    } else if (!/^\d{6}$/.test(otpValue)) {
      return 'OTP must contain only numbers';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) {
      return 'Password is required';
    } else if (password.length < 8) {
      return 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain uppercase, lowercase, and number';
    }
    return '';
  };

  const validateConfirmPassword = (confirmPass) => {
    if (!confirmPass) {
      return 'Please confirm your password';
    } else if (confirmPass !== newPassword) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleOTPSubmit = async () => {
    const otpError = validateOTP(otp);
    if (otpError) {
      setErrors({ otp: otpError });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await verifyOTP(email, otp);
      if (!response.success || !response.isPasswordReset || !response.passwordResetToken) {
        setErrors({ otp: 'Unexpected response from server. Please request a new code.' });
        return;
      }
      setResetToken(response.passwordResetToken);
      setStep('password');
    } catch (error) {
      setErrors({ otp: error.message || 'Invalid OTP' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    const passwordError = validatePassword(newPassword);
    const confirmError = validateConfirmPassword(confirmPassword);

    if (passwordError || confirmError) {
      setErrors({ 
        password: passwordError, 
        confirmPassword: confirmError 
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      if (!resetToken) {
        setErrors({ general: 'Reset token missing. Please restart the reset process.' });
        return;
      }

      const response = await resetPassword({ email, newPassword, resetToken });
      Alert.alert(
        'Success',
        'Your password has been reset successfully!',
        [{
          text: 'OK',
          onPress: () => {
            if (response?.user) {
              navigation.navigate('Login');
            } else {
              navigation.navigate('Login');
            }
          }
        }]
      );
    } catch (error) {
      setErrors({ general: error.message || 'Failed to reset password' });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    if (field === 'otp') setOtp(value);
    else if (field === 'newPassword') setNewPassword(value);
    else if (field === 'confirmPassword') setConfirmPassword(value);

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {step === 'otp' ? 'Verify OTP' : 'Set New Password'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'otp' 
              ? `Enter the 6-digit code sent to ${email}`
              : 'Create a strong new password'
            }
          </Text>
        </View>

        <View style={styles.form}>
          {step === 'otp' ? (
            <>
              <Input
                label="Enter OTP"
                placeholder="000000"
                value={otp}
                onChangeText={(value) => handleFieldChange('otp', value)}
                error={errors.otp}
                keyboardType="numeric"
                maxLength={6}
                autoFocus
                style={styles.otpInput}
              />

              <Button
                title="Verify OTP"
                onPress={handleOTPSubmit}
                loading={loading}
                style={styles.submitButton}
              />
            </>
          ) : (
            <>
              <Input
                label="New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={(value) => handleFieldChange('newPassword', value)}
                error={errors.password}
                secureTextEntry
                showPasswordToggle
                maxLength={20}
              />

              <Input
                label="Confirm Password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={(value) => handleFieldChange('confirmPassword', value)}
                error={errors.confirmPassword}
                secureTextEntry
                showPasswordToggle
                maxLength={20}
              />

              {errors.general && (
                <Text style={styles.generalError}>{errors.general}</Text>
              )}

              <Button
                title="Reset Password"
                onPress={handlePasswordSubmit}
                loading={loading}
                style={styles.submitButton}
              />
            </>
          )}

          <Button
            title="Back to Login"
            onPress={() => navigation.navigate('Login')}
            variant="ghost"
            style={styles.backLink}
          />
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 4,
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 16,
  },
  backLink: {
    marginTop: 8,
  },
  generalError: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default ResetPasswordScreen;

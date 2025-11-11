
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { colors } from '../../config/colors';

const RegisterScreen = ({ navigation }) => {
  const { register } = useContext(AuthContext);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    professional: '',
    role: 'child',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const roleOptions = [
    { value: 'child', label: 'Player', description: 'Standard account for everyday use' },
    { value: 'parent', label: 'Parent/Guardian', description: 'Monitor linked child accounts' },
    { value: 'doctor', label: 'Doctor', description: 'Review patient progress reports' },
  ];

  const handleChange = (key, value) => {
    setForm({ ...form, [key]: value });

    // Clear error when user starts typing
    if (errors[key]) {
      setErrors({ ...errors, [key]: '' });
    }
  };

  const handleRoleSelect = (value) => {
    setForm(prev => ({ ...prev, role: value }));
    setTouched(prev => ({ ...prev, role: true }));
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: '' }));
    }
  };

  const handleBlur = (key) => {
    setTouched({ ...touched, [key]: true });
    validateField(key);
  };

  const validateField = (key) => {
    const value = form[key];
    let error = '';

    switch (key) {
      case 'fullName':
        if (!value.trim()) {
          error = 'Full name is required';
        } else if (value.trim().length < 2) {
          error = 'Full name must be at least 2 characters';
        } else if (value.trim().length > 50) {
          error = 'Full name must be less than 50 characters';
        }
        break;

      case 'phone':
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
        if (!value.trim()) {
          error = 'Phone number is required';
        } else if (!phoneRegex.test(value.trim())) {
          error = 'Please enter a valid phone number';
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!emailRegex.test(value.trim())) {
          error = 'Please enter a valid email address';
        }
        break;

      case 'professional':
        if (!value.trim()) {
          error = 'Professional field is required';
        } else if (value.trim().length < 2) {
          error = 'Professional field must be at least 2 characters';
        } else if (value.trim().length > 100) {
          error = 'Professional field must be less than 100 characters';
        }
        break;

      case 'role':
        if (!value) {
          error = 'Please select an account role';
        } else if (!roleOptions.find(option => option.value === value)) {
          error = 'Invalid account role selection';
        }
        break;

      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 8) {
          error = 'Password must be at least 8 characters';
        } else if (value.length > 20) {
          error = 'Password must be less than 20 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          error = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
        break;

      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm your password';
        } else if (value !== form.password) {
          error = 'Passwords do not match';
        }
        break;

      default:
        break;
    }

    setErrors({ ...errors, [key]: error });
    return !error;
  };

  const validateForm = () => {
    const fields = ['fullName', 'phone', 'email', 'password', 'confirmPassword', 'professional', 'role'];
    let isValid = true;

    fields.forEach(field => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form before submitting.');
      return;
    }

    setLoading(true);
    try {
      console.log('📝 RegisterScreen: Starting registration process');
      const { confirmPassword, ...registerData } = form;
      console.log('📝 RegisterScreen: Calling register with data:', { ...registerData, password: '***' });
      const result = await register(registerData);

      console.log('📝 RegisterScreen: Register result:', result);

      if (result.success && result.requiresOTP) {
        console.log('✅ RegisterScreen: Registration successful, navigating to OTP screen');
        console.log('🧭 RegisterScreen: Navigation object:', navigation);
        console.log('🧭 RegisterScreen: Navigating to OTP with params:', { email: registerData.email, isRegistration: true });
        // Navigate to OTP screen for email verification
        navigation.push('OTP', { email: registerData.email, isRegistration: true });
        console.log('🧭 RegisterScreen: Navigation call completed');
      } else if (!result.success) {
        console.log('❌ RegisterScreen: Registration failed:', result.error);
        Alert.alert('Registration Failed', result.error || 'An error occurred during registration.');
      }
    } catch (error) {
      console.log('❌ RegisterScreen: Registration error:', error);
      Alert.alert('Registration Failed', error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
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
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>Join us and start building better habits today!</Text>
          </View>

          <View style={styles.form}>
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={form.fullName}
          onChangeText={(value) => handleChange('fullName', value)}
          onBlur={() => handleBlur('fullName')}
          error={touched.fullName ? errors.fullName : ''}
          maxLength={50}
          autoCapitalize="words"
        />

        <Input
          label="Phone Number"
          placeholder="Enter your phone number"
          value={form.phone}
          onChangeText={(value) => handleChange('phone', value)}
          onBlur={() => handleBlur('phone')}
          error={touched.phone ? errors.phone : ''}
          keyboardType="phone-pad"
          maxLength={15}
        />

        <Input
          label="Email Address"
          placeholder="Enter your email address"
          value={form.email}
          onChangeText={(value) => handleChange('email', value)}
          onBlur={() => handleBlur('email')}
          error={touched.email ? errors.email : ''}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Input
          label="Professional Field"
          placeholder="e.g., Software Engineer, Doctor, Teacher"
          value={form.professional}
          onChangeText={(value) => handleChange('professional', value)}
          onBlur={() => handleBlur('professional')}
          error={touched.professional ? errors.professional : ''}
          maxLength={100}
          autoCapitalize="words"
        />

        <View style={styles.roleSection}>
          <Text style={styles.roleLabel}>Account Role</Text>
          <View style={styles.roleOptions}>
            {roleOptions.map(option => {
              const isSelected = form.role === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.roleOption,
                    isSelected && styles.roleOptionSelected
                  ]}
                  onPress={() => handleRoleSelect(option.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.roleOptionTitle,
                    isSelected && styles.roleOptionTitleSelected
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.roleOptionDescription,
                    isSelected && styles.roleOptionDescriptionSelected
                  ]}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {touched.role && errors.role ? (
            <Text style={styles.roleError}>{errors.role}</Text>
          ) : null}
        </View>

        <Input
          label="Password"
          placeholder="Create a strong password"
          value={form.password}
          onChangeText={(value) => handleChange('password', value)}
          onBlur={() => handleBlur('password')}
          error={touched.password ? errors.password : ''}
          secureTextEntry
          showPasswordToggle
          maxLength={20}
        />

        <Input
          label="Confirm Password"
          placeholder="Confirm your password"
          value={form.confirmPassword}
          onChangeText={(value) => handleChange('confirmPassword', value)}
          onBlur={() => handleBlur('confirmPassword')}
          error={touched.confirmPassword ? errors.confirmPassword : ''}
          secureTextEntry
          showPasswordToggle
          maxLength={20}
        />

        <Button
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          style={styles.registerButton}
        />

        <Button
          title="Already have an account? Sign In"
          onPress={() => navigation.navigate('Login')}
          variant="ghost"
          style={styles.loginLink}
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  roleSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  roleOptions: {
    gap: 12,
  },
  roleOption: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background.secondary,
  },
  roleOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  roleOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  roleOptionTitleSelected: {
    color: colors.primary,
  },
  roleOptionDescription: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  roleOptionDescriptionSelected: {
    color: colors.text.primary,
  },
  roleError: {
    marginTop: 6,
    fontSize: 12,
    color: colors.error,
  },
  registerButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  loginLink: {
    marginTop: 16,
  },
});

export default RegisterScreen;

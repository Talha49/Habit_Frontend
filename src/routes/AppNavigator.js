import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import TabNavigator from '../navigation/TabNavigator';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import { colors } from '../config/colors';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useContext(AuthContext);

  console.log('🧭 AppNavigator: user =', user ? user.email : 'null', 'loading =', loading);

  return (
    <>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName="Login"
      >
        {user ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          // User is not authenticated - show auth flow starting with Login
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="OTP" component={OTPScreen} />
          </>
        )}
      </Stack.Navigator>
      
      {/* Show loading overlay when needed */}
      {loading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background.primary,
          zIndex: 9999
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </>
  );
};

export default AppNavigator;

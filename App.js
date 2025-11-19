import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import AppNavigator from './src/routes/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { CategoryProvider } from './src/context/CategoryContext';
import { TerritoryProvider } from './src/context/TerritoryContext';
import config from './src/config';

export default function App() {
  const publishableKey = config.CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    console.warn('⚠️ Clerk publishable key is not set. Google sign-in will be disabled.');
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AuthProvider>
        <LocationProvider>
          <CategoryProvider>
            <TerritoryProvider>
              <NavigationContainer>
                <AppNavigator />
                <StatusBar style="auto" />
              </NavigationContainer>
            </TerritoryProvider>
          </CategoryProvider>
        </LocationProvider>
      </AuthProvider>
    </ClerkProvider>
  );
}

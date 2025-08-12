import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatScreen } from '../screens/ChatScreen';
// import { LoginScreen } from '../screens/LoginScreen';
// import { useAuthStore } from '../store/useAuthStore';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  // const { user } = useAuthStore(); // 추후 인증 기능 구현 시 사용

  return (
    <Stack.Navigator>
      {/* {user ? ( */}
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '황연걸' }} />
      {/* ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )} */}
    </Stack.Navigator>
  );
};

export default AppNavigator;
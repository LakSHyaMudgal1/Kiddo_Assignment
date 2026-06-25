import { Tabs } from 'expo-router';

/**
 * Tab navigator layout — screens go here.
 * UI implementation deferred to subsequent tasks.
 */
export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="cart" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

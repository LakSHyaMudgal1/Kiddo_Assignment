import { Redirect } from 'expo-router';

/**
 * Root redirect — navigates to the main tab layout on launch.
 */
export default function RootIndex() {
  return <Redirect href="/(tabs)/home" />;
}

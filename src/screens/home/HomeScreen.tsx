/**
 * HomeScreen.tsx
 *
 * Connects the mock homepage payload to the SDUIPageRenderer.
 * In production this would call useSDUIPage('home') instead.
 *
 * This screen has zero component-specific logic — it just feeds
 * nodes into the renderer and lets the registry handle the rest.
 */
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SDUIPageRenderer } from '@renderer/SDUIRenderer';
import { homepagePayload } from '@/mock/homepagePayload';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate network refetch — replace with real query invalidation
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SDUIPageRenderer
        nodes={homepagePayload.nodes}
        estimatedItemSize={260}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
});

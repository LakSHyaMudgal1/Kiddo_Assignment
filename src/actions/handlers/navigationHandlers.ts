import { router } from 'expo-router';
import { Linking } from 'react-native';
import type {
  NavigatePayload,
  OpenExternalUrlPayload,
  OpenBottomSheetPayload,
} from '../types';
import { useStore } from '@store/rootStore';

export const handleNavigate = (payload: NavigatePayload): void => {
  if (payload.replace) {
    router.replace(payload.route as never);
  } else {
    router.push({
      pathname: payload.route as never,
      ...(payload.params ? { params: payload.params as any } : {}),
    });
  }
};

export const handleNavigateBack = (): void => {
  if (router.canGoBack()) {
    router.back();
  }
};

export const handleOpenExternalUrl = async (
  payload: OpenExternalUrlPayload,
): Promise<void> => {
  const canOpen = await Linking.canOpenURL(payload.url);
  if (canOpen) {
    await Linking.openURL(payload.url);
  } else if (__DEV__) {
    console.warn(`[ActionDispatcher] Cannot open URL: ${payload.url}`);
  }
};

export const handleOpenBottomSheet = (
  payload: OpenBottomSheetPayload,
): void => {
  useStore.getState().openBottomSheet({
    id: `bs_${Date.now()}`,
    componentKey: payload.componentKey,
    snapPoints: payload.snapPoints ?? ['50%', '90%'],
    ...(payload.props ? { props: payload.props } : {}),
  });
};

export const handleCloseBottomSheet = (): void => {
  useStore.getState().closeBottomSheet();
};

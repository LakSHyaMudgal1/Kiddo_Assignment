import { Clipboard, Share } from 'react-native';
import { useStore } from '@store/rootStore';
import type { ShowToastPayload, SharePayload } from '../types';

export const handleShowToast = (payload: ShowToastPayload): void => {
  useStore.getState().showToast(payload);
};

export const handleCopyToClipboard = (payload: { text: string }): void => {
  Clipboard.setString(payload.text);
  useStore.getState().showToast({
    message: 'Copied to clipboard',
    variant: 'success',
    duration: 2000,
  });
};

export const handleShare = async (payload: SharePayload): Promise<void> => {
  try {
    await Share.share({
      title: payload.title,
      message: payload.message,
      url: payload.url,
    });
  } catch (error) {
    if (__DEV__) {
      console.error('[ActionDispatcher] Share failed', error);
    }
  }
};

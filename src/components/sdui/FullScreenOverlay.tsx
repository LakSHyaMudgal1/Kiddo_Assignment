/**
 * FullScreenOverlay.tsx
 *
 * Production SDUI full-screen overlay / interstitial.
 * Driven 100% by server payload — zero hardcoded campaign colors.
 *
 * ─── Session store ────────────────────────────────────────────────────────────
 *
 * showOncePerSession uses a module-level in-memory Set<string>.
 * The Set is cleared on app restart (JS bundle reload).
 * AsyncStorage is only used for showOncePerInstall.
 *
 * ─── Animation model ─────────────────────────────────────────────────────────
 *
 * overlayTheme.enterAnimation / exitAnimation:
 *   'fade'       → opacity 0→1 / 1→0
 *   'slide_up'   → translateY 60→0 + fade
 *   'slide_down' → translateY -60→0 + fade
 *   'zoom'       → scale 0.85→1 + fade
 *   'none'       → instant show/hide
 *
 * ─── pointerEvents strategy ──────────────────────────────────────────────────
 *
 * The Lottie decoration layers (confetti, background ambient) use
 * pointerEvents="none" so all touch events pass through to interactive
 * children (CTAs, close button).
 *
 * ─── Re-render model ─────────────────────────────────────────────────────────
 *
 * FullScreenOverlay subscribes to NO Zustand store slices.
 * It owns only local state: visible (boolean) and animation values.
 * Cart mutations, wishlist changes, theme changes — none cause a re-render.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';

import type { SDUIComponentProps } from '@registry/componentRegistry';
import type {
  FullScreenOverlayData,
  OverlayCTA,
  OverlayContent,
  OverlayHeaderMedia,
  OverlayPromotionalContent,
  OverlayMysteryGiftContent,
  OverlayFlashSaleContent,
  OverlayOnboardingContent,
  OverlayAppUpdateContent,
} from '@/types/components/FullScreenOverlay';
import type { SDUITimerTheme } from '@/types/sdui-theme';
import type { SDUICountdown } from '@/types/sdui-campaign';
import type { SDUITextStyle } from '@/types/sdui-primitives';
import type { AppAction } from '@actions/types';

import { useTheme } from '@context/ThemeContext';
import { useActionDispatch } from '@context/ActionContext';
import { resolveColor, resolveBackground } from '@hooks/useNodeTheme';

type Props = SDUIComponentProps<FullScreenOverlayData>;

// ─────────────────────────────────────────────────────────────────────────────
// Session store — in-memory, cleared on app restart
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Module-level Set: lives in JS memory, reset every time the bundle loads.
 * showOncePerSession: true → overlay only fires once per app launch cycle.
 * On the next app restart this Set is empty again → overlay fires once more.
 */
const SESSION_SEEN = new Set<string>();

const INSTALL_KEY_PREFIX = 'kiddo::overlay::install::';

// ─────────────────────────────────────────────────────────────────────────────
// Font-weight map (mirrors BannerHero)
// ─────────────────────────────────────────────────────────────────────────────

const FONT_WEIGHT_MAP: Record<
  NonNullable<SDUITextStyle['weight']>,
  '400' | '500' | '600' | '700' | '800'
> = {
  regular:   '400',
  medium:    '500',
  semiBold:  '600',
  bold:      '700',
  extraBold: '800',
};

// ─────────────────────────────────────────────────────────────────────────────
// resolveTextStyle — pure function, no hooks
// ─────────────────────────────────────────────────────────────────────────────

function resolveTextStyle(
  style: SDUITextStyle | undefined,
  theme: ReturnType<typeof useTheme>['theme'],
  fallbackColor: string,
): {
  color?: string | undefined;
  fontSize?: number | undefined;
  fontWeight?: '400' | '500' | '600' | '700' | '800' | undefined;
  textAlign?: 'left' | 'center' | 'right' | undefined;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize' | undefined;
} {
  if (!style) return { color: fallbackColor };
  return {
    color: style.color ? (resolveColor(style.color, theme) ?? fallbackColor) : fallbackColor,
    fontSize:    style.size,
    fontWeight:  style.weight ? FONT_WEIGHT_MAP[style.weight] : undefined,
    textAlign:   style.align,
    textTransform: style.transform ?? undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useCountdown — 1-second tick, auto-stops at zero
// ─────────────────────────────────────────────────────────────────────────────

interface CountdownTick { h: string; m: string; s: string; expired: boolean; totalSec: number }
function pad(n: number) { return String(Math.max(0, n)).padStart(2, '0'); }

function useCountdown(endsAt: string): CountdownTick {
  const calc = useCallback((): CountdownTick => {
    const diff = Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000);
    if (diff <= 0) return { h: '00', m: '00', s: '00', expired: true, totalSec: 0 };
    return { h: pad(Math.floor(diff / 3600)), m: pad(Math.floor((diff % 3600) / 60)), s: pad(diff % 60), expired: false, totalSec: diff };
  }, [endsAt]);

  const [tick, setTick] = useState<CountdownTick>(calc);

  useEffect(() => {
    if (tick.expired) return;
    const t = setInterval(() => {
      const next = calc();
      setTick(next);
      if (next.expired) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [calc, tick.expired]);

  return tick;
}

// ─────────────────────────────────────────────────────────────────────────────
// CountdownBlock — live countdown display
// ─────────────────────────────────────────────────────────────────────────────

interface CountdownBlockProps {
  countdown: SDUICountdown;
  timerTheme?: SDUITimerTheme | undefined;
  theme: ReturnType<typeof useTheme>['theme'];
}

const CountdownBlock: React.FC<CountdownBlockProps> = React.memo(
  ({ countdown, timerTheme, theme }) => {
    const tick = useCountdown(countdown.endsAt);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const isUrgent = tick.totalSec > 0 && tick.totalSec < 3600;

    useEffect(() => {
      if (!isUrgent || !(timerTheme?.pulseOnUrgency ?? true)) return;
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]));
      loop.start();
      return () => loop.stop();
    }, [isUrgent, timerTheme?.pulseOnUrgency, pulseAnim]);

    if (tick.expired) {
      if (countdown.hideOnExpiry) return null;
      return (
        <Text style={[overlayStyles.countdownExpired, {
          color: timerTheme?.digitColor ? resolveColor(timerTheme.digitColor, theme) ?? '#FFFFFF' : '#FFFFFF',
        }]}>
          {countdown.expiredLabel ?? 'Sale ended'}
        </Text>
      );
    }

    const digitBg  = timerTheme?.background   ? resolveColor(timerTheme.background, theme)   ?? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.3)';
    const digitCol = timerTheme?.digitColor    ? resolveColor(timerTheme.digitColor, theme)   ?? '#FFFFFF'          : '#FFFFFF';
    const labelCol = timerTheme?.labelColor    ? resolveColor(timerTheme.labelColor, theme)   ?? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.7)';
    const sepCol   = timerTheme?.separatorColor ? resolveColor(timerTheme.separatorColor, theme) ?? digitCol : digitCol;
    const radius   = timerTheme?.borderRadius ?? 6;

    return (
      <Animated.View style={[overlayStyles.countdownRow, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={[overlayStyles.countdownPrefix, { color: labelCol }]}>
          {countdown.prefixLabel ?? 'Ends in'}
        </Text>
        {[tick.h, tick.m, tick.s].map((val, i) => (
          <React.Fragment key={i}>
            <View style={[overlayStyles.digitBox, { backgroundColor: digitBg, borderRadius: radius }]}>
              <Text style={[overlayStyles.digitText, { color: digitCol, fontVariant: ['tabular-nums'] }]}>{val}</Text>
            </View>
            {i < 2 ? <Text style={[overlayStyles.digitSep, { color: sepCol }]}>:</Text> : null}
          </React.Fragment>
        ))}
      </Animated.View>
    );
  },
);
CountdownBlock.displayName = 'OverlayCountdown';

// ─────────────────────────────────────────────────────────────────────────────
// HeaderMediaView — image or lottie at the top of the card
//
// Lottie animations serve dual purpose:
//  - Decorative background (confetti, sparkle) → pointerEvents="none"
//  - Illustrative media (gift box opening)     → interactive area
// ─────────────────────────────────────────────────────────────────────────────

interface HeaderMediaViewProps {
  media: OverlayHeaderMedia;
  theme: ReturnType<typeof useTheme>['theme'];
}

const HeaderMediaView: React.FC<HeaderMediaViewProps> = React.memo(({ media, theme }) => {
  const height = media.height ?? 220;
  const bg = media.background ? resolveBackground(media.background, theme) : undefined;

  return (
    <View style={[overlayStyles.headerMedia, { height, backgroundColor: bg ?? 'transparent' }]}>
      {media.kind === 'image' && media.image ? (
        <Image
          source={{ uri: media.image.uri }}
          style={StyleSheet.absoluteFill}
          resizeMode={media.image.resizeMode ?? 'cover'}
          accessibilityLabel={media.image.alt}
        />
      ) : null}

      {media.kind === 'lottie' && media.lottie ? (
        // pointerEvents="none" — decorative; touches pass through to card content
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <LottieView
            source={
              typeof media.lottie.source === 'string'
                ? { uri: media.lottie.source }
                : media.lottie.source as any
            }
            autoPlay={media.lottie.autoPlay ?? true}
            loop={media.lottie.loop ?? false}
            speed={media.lottie.speed ?? 1}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        </View>
      ) : null}
    </View>
  );
});
HeaderMediaView.displayName = 'OverlayHeaderMedia';

// ─────────────────────────────────────────────────────────────────────────────
// OverlayCTAButton — theme-aware, dispatches action
// ─────────────────────────────────────────────────────────────────────────────

interface CTAButtonProps {
  cta: OverlayCTA;
  dispatch: (action: AppAction) => Promise<void>;
  onPress: () => void;
  theme: ReturnType<typeof useTheme>['theme'];
  fullWidth?: boolean;
}

const CTAButton: React.FC<CTAButtonProps> = React.memo(
  ({ cta, onPress, theme, fullWidth = false }) => {
    const t = cta.theme;
    const bg = t?.background ? resolveColor(t.background, theme) ?? theme.colors.interactivePrimary : theme.colors.interactivePrimary;
    const tc = t?.textColor  ? resolveColor(t.textColor, theme)  ?? theme.colors.textOnBrand : theme.colors.textOnBrand;
    const bc = t?.borderColor ? resolveColor(t.borderColor, theme) : undefined;
    const radius = t?.borderRadius ?? 10;

    const isGhost = t?.variant === 'ghost';
    const isLink  = t?.variant === 'link';

    return (
      <TouchableOpacity
        onPress={onPress}
        style={[
          overlayStyles.ctaBase,
          fullWidth && overlayStyles.ctaFull,
          isLink  ? overlayStyles.ctaLink  :
          isGhost ? [overlayStyles.ctaGhost, { borderColor: bc ?? tc }] :
                    [overlayStyles.ctaPrimary, { backgroundColor: bg, borderRadius: radius, borderColor: bc, borderWidth: bc ? 1.5 : 0 }],
        ]}
        activeOpacity={0.82}
        accessibilityLabel={cta.accessibilityLabel ?? cta.label}
        accessibilityRole="button"
      >
        <Text style={[overlayStyles.ctaText, { color: tc }]} numberOfLines={1}>
          {cta.label}
        </Text>
      </TouchableOpacity>
    );
  },
);
CTAButton.displayName = 'OverlayCTAButton';

// ─────────────────────────────────────────────────────────────────────────────
// Content renderers — factory object, no switch
//
// Each renderer receives the fully typed content variant.
// All receive theme and dispatch so they can resolve colors and fire CTAs.
// ─────────────────────────────────────────────────────────────────────────────

interface ContentRenderProps<T extends OverlayContent> {
  content: T;
  theme: ReturnType<typeof useTheme>['theme'];
  dispatch: (action: AppAction) => Promise<void>;
  onDismiss: () => void;
}

// ── promotional ──────────────────────────────────────────────────────────────

const PromotionalRenderer: React.FC<ContentRenderProps<OverlayPromotionalContent>> =
  React.memo(({ content, theme, dispatch, onDismiss }) => {
    const defaultHeadlineColor = theme.colors.textPrimary;
    const defaultBodyColor = theme.colors.textSecondary;

    const handlePrimary = useCallback(() => {
      void dispatch(content.primaryCTA.action as AppAction);
      onDismiss();
    }, [content.primaryCTA.action, dispatch, onDismiss]);

    const handleSecondary = useCallback(() => {
      if (content.secondaryCTA) void dispatch(content.secondaryCTA.action as AppAction);
      onDismiss();
    }, [content.secondaryCTA, dispatch, onDismiss]);

    return (
      <>
        {content.headerMedia ? <HeaderMediaView media={content.headerMedia} theme={theme} /> : null}
        <View style={overlayStyles.contentPad}>
          {content.promotion?.badge ? (
            <View style={[overlayStyles.promoBadge, {
              backgroundColor: content.promotion.badge.color
                ? resolveColor(content.promotion.badge.color, theme) ?? '#1565C0'
                : '#1565C0',
            }]}>
              <Text style={[overlayStyles.promoBadgeText, {
                color: content.promotion.badge.textColor
                  ? resolveColor(content.promotion.badge.textColor, theme) ?? '#FFF'
                  : '#FFF',
              }]}>
                {content.promotion.badge.label}
              </Text>
            </View>
          ) : null}
          <Text style={[overlayStyles.headline, resolveTextStyle(content.headlineStyle, theme, defaultHeadlineColor)]}>
            {content.headline}
          </Text>
          {content.body ? (
            <Text style={[overlayStyles.body, resolveTextStyle(content.bodyStyle, theme, defaultBodyColor)]}>
              {content.body}
            </Text>
          ) : null}
          <CTAButton cta={content.primaryCTA} dispatch={dispatch} onPress={handlePrimary} theme={theme} fullWidth />
          {content.secondaryCTA ? (
            <CTAButton cta={content.secondaryCTA} dispatch={dispatch} onPress={handleSecondary} theme={theme} />
          ) : null}
          {content.footerText ? (
            <Text style={[overlayStyles.footerText, resolveTextStyle(content.footerTextStyle, theme, theme.colors.textTertiary)]}>
              {content.footerText}
            </Text>
          ) : null}
        </View>
      </>
    );
  });
PromotionalRenderer.displayName = 'PromotionalContent';

// ── mystery_gift ─────────────────────────────────────────────────────────────

const MysteryGiftRenderer: React.FC<ContentRenderProps<OverlayMysteryGiftContent>> =
  React.memo(({ content, theme, dispatch, onDismiss }) => {
    const [phase, setPhase] = useState<'idle' | 'applying' | 'revealed'>('idle');

    const handlePrimary = useCallback(async () => {
      setPhase('applying');
      await dispatch(content.primaryCTA.action as AppAction);
      // Give dispatch time to settle (toast, store update), then show reveal
      setTimeout(() => {
        setPhase('revealed');
        // Auto-dismiss after 2.5s once revealed
        setTimeout(onDismiss, 2500);
      }, 800);
    }, [content.primaryCTA.action, dispatch, onDismiss]);

    const handleSecondary = useCallback(() => {
      if (content.secondaryCTA) void dispatch(content.secondaryCTA.action as AppAction);
      onDismiss();
    }, [content.secondaryCTA, dispatch, onDismiss]);

    const defaultColor = theme.colors.textInverse;

    return (
      <>
        {/* Header media */}
        {content.headerMedia ? <HeaderMediaView media={content.headerMedia} theme={theme} /> : null}

        {/* Reveal Lottie — plays full-screen over the card after reveal */}
        {phase === 'revealed' && content.revealLottie ? (
          // pointerEvents="none" — decorative confetti burst, don't block touches
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <LottieView
              source={
                typeof content.revealLottie.source === 'string'
                  ? { uri: content.revealLottie.source }
                  : content.revealLottie.source as any
              }
              autoPlay
              loop={content.revealLottie.loop ?? false}
              speed={content.revealLottie.speed ?? 1}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          </View>
        ) : null}

        <View style={[overlayStyles.contentPad, overlayStyles.centered]}>
          {/* Applying phase — loader lottie */}
          {phase === 'applying' && content.applyingLottie ? (
            <LottieView
              source={
                typeof content.applyingLottie.source === 'string'
                  ? { uri: content.applyingLottie.source }
                  : content.applyingLottie.source as any
              }
              autoPlay
              loop={content.applyingLottie.loop ?? true}
              speed={content.applyingLottie.speed ?? 1}
              style={overlayStyles.loaderLottie}
            />
          ) : null}

          <Text style={[overlayStyles.headline, resolveTextStyle(content.headlineStyle, theme, defaultColor)]}>
            {content.headline}
          </Text>
          {content.body ? (
            <Text style={[overlayStyles.body, resolveTextStyle(content.bodyStyle, theme, theme.colors.textSecondary)]}>
              {content.body}
            </Text>
          ) : null}
          <Text style={[overlayStyles.mysteryHint, { color: theme.colors.textTertiary }]}>
            {content.mysteryGift.teaserText}
          </Text>

          {phase === 'idle' ? (
            <>
              <CTAButton cta={content.primaryCTA} dispatch={dispatch} onPress={handlePrimary} theme={theme} fullWidth />
              {content.secondaryCTA ? (
                <CTAButton cta={content.secondaryCTA} dispatch={dispatch} onPress={handleSecondary} theme={theme} />
              ) : null}
            </>
          ) : null}

          {content.footerText ? (
            <Text style={[overlayStyles.footerText, resolveTextStyle(content.footerTextStyle, theme, theme.colors.textTertiary)]}>
              {content.footerText}
            </Text>
          ) : null}
        </View>
      </>
    );
  });
MysteryGiftRenderer.displayName = 'MysteryGiftContent';

// ── flash_sale ───────────────────────────────────────────────────────────────

const FlashSaleRenderer: React.FC<ContentRenderProps<OverlayFlashSaleContent>> =
  React.memo(({ content, theme, dispatch, onDismiss }) => {
    const handlePrimary = useCallback(() => {
      void dispatch(content.primaryCTA.action as AppAction);
      onDismiss();
    }, [content.primaryCTA.action, dispatch, onDismiss]);

    const handleSecondary = useCallback(() => {
      if (content.secondaryCTA) void dispatch(content.secondaryCTA.action as AppAction);
      onDismiss();
    }, [content.secondaryCTA, dispatch, onDismiss]);

    const defaultColor = theme.colors.textInverse;

    return (
      <>
        {content.headerMedia ? <HeaderMediaView media={content.headerMedia} theme={theme} /> : null}
        <View style={[overlayStyles.contentPad, overlayStyles.centered]}>
          <Text style={overlayStyles.flashLabel}>⚡ FLASH SALE</Text>
          <Text style={[overlayStyles.headline, resolveTextStyle(content.headlineStyle, theme, defaultColor)]}>
            {content.headline}
          </Text>
          {content.body ? (
            <Text style={[overlayStyles.body, resolveTextStyle(content.bodyStyle, theme, theme.colors.textSecondary)]}>
              {content.body}
            </Text>
          ) : null}
          {/* Live countdown — not a static string */}
          <CountdownBlock
            countdown={content.countdown}
            timerTheme={content.countdownTheme}
            theme={theme}
          />
          {content.promotion?.badge ? (
            <View style={[overlayStyles.promoBadge, {
              backgroundColor: content.promotion.badge.color
                ? resolveColor(content.promotion.badge.color, theme) ?? '#E53935' : '#E53935',
            }]}>
              <Text style={[overlayStyles.promoBadgeText, {
                color: content.promotion.badge.textColor
                  ? resolveColor(content.promotion.badge.textColor, theme) ?? '#FFF' : '#FFF',
              }]}>
                {content.promotion.badge.label}
              </Text>
            </View>
          ) : null}
          <CTAButton cta={content.primaryCTA} dispatch={dispatch} onPress={handlePrimary} theme={theme} fullWidth />
          {content.secondaryCTA ? (
            <CTAButton cta={content.secondaryCTA} dispatch={dispatch} onPress={handleSecondary} theme={theme} />
          ) : null}
          {content.footerText ? (
            <Text style={[overlayStyles.footerText, resolveTextStyle(content.footerTextStyle, theme, theme.colors.textTertiary)]}>
              {content.footerText}
            </Text>
          ) : null}
        </View>
      </>
    );
  });
FlashSaleRenderer.displayName = 'FlashSaleContent';

// ── onboarding ───────────────────────────────────────────────────────────────

const OnboardingRenderer: React.FC<ContentRenderProps<OverlayOnboardingContent>> =
  React.memo(({ content, theme, dispatch, onDismiss }) => {
    const handlePrimary = useCallback(() => {
      void dispatch(content.primaryCTA.action as AppAction);
      onDismiss();
    }, [content.primaryCTA.action, dispatch, onDismiss]);

    const handleSecondary = useCallback(() => {
      if (content.secondaryCTA) void dispatch(content.secondaryCTA.action as AppAction);
      onDismiss();
    }, [content.secondaryCTA, dispatch, onDismiss]);

    const defaultColor = theme.colors.textPrimary;

    return (
      <>
        {content.headerMedia ? <HeaderMediaView media={content.headerMedia} theme={theme} /> : null}
        <View style={overlayStyles.contentPad}>
          {content.steps != null && content.currentStep != null ? (
            <Text style={[overlayStyles.stepIndicator, { color: theme.colors.textTertiary }]}>
              {content.currentStep} / {content.steps}
            </Text>
          ) : null}
          <Text style={[overlayStyles.headline, resolveTextStyle(content.headlineStyle, theme, defaultColor)]}>
            {content.headline}
          </Text>
          {content.body ? (
            <Text style={[overlayStyles.body, resolveTextStyle(content.bodyStyle, theme, theme.colors.textSecondary)]}>
              {content.body}
            </Text>
          ) : null}
          <CTAButton cta={content.primaryCTA} dispatch={dispatch} onPress={handlePrimary} theme={theme} fullWidth />
          {content.secondaryCTA ? (
            <CTAButton cta={content.secondaryCTA} dispatch={dispatch} onPress={handleSecondary} theme={theme} />
          ) : null}
          {content.footerText ? (
            <Text style={[overlayStyles.footerText, resolveTextStyle(content.footerTextStyle, theme, theme.colors.textTertiary)]}>
              {content.footerText}
            </Text>
          ) : null}
        </View>
      </>
    );
  });
OnboardingRenderer.displayName = 'OnboardingContent';

// ── app_update ───────────────────────────────────────────────────────────────

const AppUpdateRenderer: React.FC<ContentRenderProps<OverlayAppUpdateContent>> =
  React.memo(({ content, theme, dispatch, onDismiss }) => {
    const handleUpdate = useCallback(() => {
      void dispatch(content.updateCTA.action as AppAction);
    }, [content.updateCTA.action, dispatch]);

    const handleSkip = useCallback(() => {
      if (content.skipCTA) void dispatch(content.skipCTA.action as AppAction);
      if (!content.isMandatory) onDismiss();
    }, [content.skipCTA, content.isMandatory, dispatch, onDismiss]);

    const defaultColor = theme.colors.textPrimary;

    return (
      <>
        {content.headerMedia ? <HeaderMediaView media={content.headerMedia} theme={theme} /> : null}
        <View style={overlayStyles.contentPad}>
          <Text style={[overlayStyles.headline, resolveTextStyle(content.headlineStyle, theme, defaultColor)]}>
            {content.headline}
          </Text>
          {content.body ? (
            <Text style={[overlayStyles.body, resolveTextStyle(content.bodyStyle, theme, theme.colors.textSecondary)]}>
              {content.body}
            </Text>
          ) : null}
          {content.isMandatory ? (
            <Text style={[overlayStyles.mandatoryBadge, { color: theme.colors.errorDefault }]}>
              ⚠️ This update is required
            </Text>
          ) : null}
          <CTAButton cta={content.updateCTA} dispatch={dispatch} onPress={handleUpdate} theme={theme} fullWidth />
          {!content.isMandatory && content.skipCTA ? (
            <CTAButton cta={content.skipCTA} dispatch={dispatch} onPress={handleSkip} theme={theme} />
          ) : null}
        </View>
      </>
    );
  });
AppUpdateRenderer.displayName = 'AppUpdateContent';

// ─────────────────────────────────────────────────────────────────────────────
// Content renderer registry — factory object, no switch
// ─────────────────────────────────────────────────────────────────────────────

type AnyContentProps = ContentRenderProps<OverlayContent>;

const CONTENT_RENDERER_MAP: {
  [K in OverlayContent['kind']]: React.FC<ContentRenderProps<Extract<OverlayContent, { kind: K }>>>;
} = {
  promotional:  PromotionalRenderer,
  mystery_gift: MysteryGiftRenderer,
  flash_sale:   FlashSaleRenderer,
  onboarding:   OnboardingRenderer,
  app_update:   AppUpdateRenderer,
};

// ─────────────────────────────────────────────────────────────────────────────
// Animation engine
//
// Maps overlayTheme.enterAnimation / exitAnimation strings to Animated values.
//
// Every animation combines:
//   - opacity   (all enter/exit variants)
//   - translateY (slide_up / slide_down)
//   - scale     (zoom)
//
// We initialise ALL animated values unconditionally so hook call count is
// stable across renders regardless of which animation variant is active.
// ─────────────────────────────────────────────────────────────────────────────

type AnimationKind =
  | 'fade'
  | 'slide_up'
  | 'slide_down'
  | 'zoom'
  | 'none';

interface OverlayAnimValues {
  opacity: Animated.Value;
  translateY: Animated.Value;
  scale: Animated.Value;
}

function buildEnterAnimation(
  values: OverlayAnimValues,
  kind: AnimationKind,
  durationMs: number,
): Animated.CompositeAnimation {
  const { opacity, translateY, scale } = values;
  const dur = kind === 'none' ? 0 : durationMs;
  const ease = Easing.out(Easing.cubic);

  // Reset to entry start values before animating
  opacity.setValue(0);
  if (kind === 'slide_up')   translateY.setValue(64);
  if (kind === 'slide_down') translateY.setValue(-64);
  if (kind === 'zoom')       scale.setValue(0.82);

  const animations: Animated.CompositeAnimation[] = [
    Animated.timing(opacity, { toValue: 1, duration: dur, easing: ease, useNativeDriver: true }),
  ];
  if (kind === 'slide_up' || kind === 'slide_down') {
    animations.push(
      Animated.timing(translateY, { toValue: 0, duration: dur, easing: ease, useNativeDriver: true }),
    );
  }
  if (kind === 'zoom') {
    animations.push(
      Animated.timing(scale, { toValue: 1, duration: dur, easing: ease, useNativeDriver: true }),
    );
  }
  return Animated.parallel(animations);
}

function buildExitAnimation(
  values: OverlayAnimValues,
  kind: AnimationKind,
  durationMs: number,
): Animated.CompositeAnimation {
  const { opacity, translateY, scale } = values;
  const dur = kind === 'none' ? 0 : durationMs;
  const ease = Easing.in(Easing.cubic);

  const animations: Animated.CompositeAnimation[] = [
    Animated.timing(opacity, { toValue: 0, duration: dur, easing: ease, useNativeDriver: true }),
  ];
  if (kind === 'slide_down') {
    animations.push(
      Animated.timing(translateY, { toValue: 64, duration: dur, easing: ease, useNativeDriver: true }),
    );
  }
  if (kind === 'slide_up') {
    animations.push(
      Animated.timing(translateY, { toValue: -64, duration: dur, easing: ease, useNativeDriver: true }),
    );
  }
  if (kind === 'zoom') {
    animations.push(
      Animated.timing(scale, { toValue: 0.82, duration: dur, easing: ease, useNativeDriver: true }),
    );
  }
  return Animated.parallel(animations);
}

// ─────────────────────────────────────────────────────────────────────────────
// FullScreenOverlay — root component
//
// ┌────────────────────────────────────────────────────────────────────────┐
// │  LAYER HIERARCHY (bottom → top, z-index ascending)                    │
// │                                                                        │
// │  Layer 0 — Modal backdrop (RN Modal, pointerEvents handled by Modal)  │
// │  Layer 1 — Scrim (Animated.View, flex:1, scrim colour)                │
// │              TouchableWithoutFeedback wraps scrim for dismiss-on-tap  │
// │  Layer 2 — Card (View, white/themed box, centered)                    │
// │              TouchableWithoutFeedback stops tap propagation to scrim  │
// │  Layer 3 — HeaderMedia (inside card, image or lottie)                 │
// │              Lottie here: pointerEvents="none" (decorative)           │
// │  Layer 4 — Content body (inside card, text + CTAs)                   │
// │              Fully interactive — inherits default touch handling      │
// │  Layer 5 — Reveal Lottie (absoluteFill, pointerEvents="none")         │
// │              Confetti/burst plays OVER content but passes touches     │
// │              through so user can still tap buttons underneath         │
// │  Layer 6 — Close button (absolutePosition, top-right/left)            │
// │              Highest z-index — always tappable                        │
// │                                                                        │
// │  KEY RULES:                                                            │
// │  - Decorative animations (confetti, ambient lottie, splash):          │
// │      pointerEvents="none" → touch falls through to card content       │
// │  - Scrim: receives tap ONLY when dismissConfig allows scrim_tap       │
// │  - CTAs, close button: always interactive (no pointer blocking above) │
// └────────────────────────────────────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────────────────────

export const FullScreenOverlay: React.FC<Props> = React.memo(({ id, data, testID }) => {
  const {
    content,
    trigger,
    dismissConfig,
    overlayTheme,
    showOncePerSession,
    showOncePerInstall,
    analytics,
  } = data;

  const { theme } = useTheme();
  const dispatch = useActionDispatch();

  // ── Visibility state ───────────────────────────────────────────────────
  const [visible, setVisible] = useState(false);
  const isShowingRef = useRef(false);

  // ── Animation values — initialised once, never recreated ───────────────
  const animValues = useRef<OverlayAnimValues>({
    opacity:    new Animated.Value(0),
    translateY: new Animated.Value(0),
    scale:      new Animated.Value(1),
  }).current;

  // ── Scrim opacity — separate from card animation for independent control
  const scrimOpacity = useRef(new Animated.Value(0)).current;

  // ── Resolved animation settings ───────────────────────────────────────
  const enterKind   = (overlayTheme?.enterAnimation ?? 'fade') as AnimationKind;
  const exitKind    = (overlayTheme?.exitAnimation  ?? 'fade') as AnimationKind;
  const durationMs  = overlayTheme?.animationDuration ?? 300;
  const scrimColor  = overlayTheme?.scrimColor
    ? resolveColor(overlayTheme.scrimColor, theme) ?? 'rgba(0,0,0,0.65)'
    : 'rgba(0,0,0,0.65)';
  const scrimAlpha  = overlayTheme?.scrimOpacity ?? 0.65;
  const cardRadius  = overlayTheme?.borderRadius ?? 20;
  const cardBg      = overlayTheme?.contentBackground
    ? resolveBackground(overlayTheme.contentBackground, theme) ?? theme.colors.surfaceDefault
    : theme.colors.surfaceDefault;

  // ── Frequency capping ──────────────────────────────────────────────────
  const checkAndShow = useCallback(async () => {
    if (isShowingRef.current) return; // already visible

    // Install-level cap — AsyncStorage (persists across restarts)
    if (showOncePerInstall) {
      const key = `${INSTALL_KEY_PREFIX}${id}`;
      const seen = await AsyncStorage.getItem(key);
      if (seen === 'true') return;
      await AsyncStorage.setItem(key, 'true');
    }

    // Session-level cap — in-memory Set (cleared on bundle reload / restart)
    if (showOncePerSession) {
      if (SESSION_SEEN.has(id)) return;
      SESSION_SEEN.add(id);
    }

    isShowingRef.current = true;
    setVisible(true);

    // Animate scrim and card in independently
    Animated.timing(scrimOpacity, {
      toValue: scrimAlpha,
      duration: durationMs,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    buildEnterAnimation(animValues, enterKind, durationMs).start();
  }, [
    id,
    showOncePerSession,
    showOncePerInstall,
    scrimOpacity,
    scrimAlpha,
    animValues,
    enterKind,
    durationMs,
  ]);

  // ── Trigger ────────────────────────────────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (trigger.on === 'page_load') {
      void checkAndShow();
    } else if (trigger.on === 'delay') {
      timer = setTimeout(() => void checkAndShow(), trigger.delayMs);
    }
    // scroll_depth / exit_intent / add_to_cart / manual:
    // triggered externally — no setup needed here

    return () => { if (timer) clearTimeout(timer); };
  }, [trigger, checkAndShow]);

  // ── Auto-dismiss ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible || dismissConfig.mode !== 'auto') return;
    const delay = dismissConfig.autoDismissDelay ?? 3000;
    const timer = setTimeout(handleDismiss, delay);
    return () => clearTimeout(timer);
  });

  // ── Dismiss ────────────────────────────────────────────────────────────
  const handleDismiss = useCallback(() => {
    // Animate scrim and card out
    Animated.parallel([
      Animated.timing(scrimOpacity, {
        toValue: 0,
        duration: durationMs,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      buildExitAnimation(animValues, exitKind, durationMs),
    ]).start(() => {
      isShowingRef.current = false;
      setVisible(false);
      if (dismissConfig.onDismissAction) {
        void dispatch(dismissConfig.onDismissAction as AppAction);
      }
    });
  }, [scrimOpacity, animValues, exitKind, durationMs, dismissConfig, dispatch]);

  // ── Dismiss permission ─────────────────────────────────────────────────
  const canDismissViaScrim  = dismissConfig.mode === 'scrim_tap' || dismissConfig.mode === 'both';
  const canDismissViaButton = dismissConfig.mode === 'close_button' || dismissConfig.mode === 'both';
  const closePos = dismissConfig.closeButtonPosition ?? 'top_right';

  // ── Card animated transform — derived from animation values ───────────
  const cardTransform = useMemo(() => {
    const t: object[] = [];
    if (enterKind === 'slide_up' || enterKind === 'slide_down') {
      t.push({ translateY: animValues.translateY });
    }
    if (enterKind === 'zoom') {
      t.push({ scale: animValues.scale });
    }
    return t;
  }, [enterKind, animValues]);

  // ── Content renderer factory dispatch — O(1), no switch ───────────────
  const ContentRenderer = CONTENT_RENDERER_MAP[content.kind] as React.FC<
    ContentRenderProps<typeof content>
  >;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"           // We handle animation ourselves
      statusBarTranslucent           // Overlay covers status bar
      testID={testID ?? `overlay-${id}`}
      accessibilityViewIsModal
      onRequestClose={canDismissViaButton ? handleDismiss : undefined}
    >
      {/* ── LAYER 1: Scrim ─────────────────────────────────────────────
          Animated opacity drives the scrim fade.
          TouchableWithoutFeedback only fires dismiss when allowed.
          pointerEvents="auto" — scrim IS the tap target for dismiss.
      ──────────────────────────────────────────────────────────────── */}
      <TouchableWithoutFeedback
        onPress={canDismissViaScrim ? handleDismiss : undefined}
        accessible={false}
      >
        <Animated.View
          style={[
            overlayStyles.scrim,
            { backgroundColor: scrimColor, opacity: scrimOpacity },
          ]}
        >
          {/* ── LAYER 2: Card — stops scrim tap from propagating ─────
              TouchableWithoutFeedback with no onPress acts as a tap
              absorber so taps on the card don't reach the scrim.
          ──────────────────────────────────────────────────────────── */}
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                overlayStyles.card,
                {
                  backgroundColor: cardBg,
                  borderRadius: cardRadius,
                  opacity: animValues.opacity,
                  ...(cardTransform.length > 0 ? { transform: cardTransform as any } : {}),
                },
              ]}
            >
              {/* ── LAYER 6: Close button (highest z, always tappable) ── */}
              {canDismissViaButton ? (
                <TouchableOpacity
                  onPress={handleDismiss}
                  style={[
                    overlayStyles.closeBtn,
                    closePos === 'top_left' ? overlayStyles.closeBtnLeft : overlayStyles.closeBtnRight,
                  ]}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  accessibilityLabel="Close"
                  accessibilityRole="button"
                >
                  <View style={[overlayStyles.closeBtnCircle, { backgroundColor: 'rgba(0,0,0,0.25)' }]}>
                    <Text style={overlayStyles.closeBtnText}>✕</Text>
                  </View>
                </TouchableOpacity>
              ) : null}

              {/* ── DEV badge ─────────────────────────────────────────── */}
              {__DEV__ ? (
                // pointerEvents="none" — dev badge is purely informational
                <View style={overlayStyles.devBadge} pointerEvents="none">
                  <Text style={overlayStyles.devBadgeText}>
                    {content.kind} · {analytics?.impressionEvent ?? id}
                  </Text>
                </View>
              ) : null}

              {/* ── LAYERS 3-5: Content (headerMedia + body + reveal lottie)
                  Rendered inside a ScrollView so tall content is accessible
                  on small screens.
              ──────────────────────────────────────────────────────────── */}
              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={overlayStyles.scrollContent}
              >
                <ContentRenderer
                  content={content as never}
                  theme={theme}
                  dispatch={dispatch}
                  onDismiss={handleDismiss}
                />
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
});

FullScreenOverlay.displayName = 'FullScreenOverlay';

// ─────────────────────────────────────────────────────────────────────────────
// StyleSheet
// Colors are injected at render time — nothing hardcoded here.
// ─────────────────────────────────────────────────────────────────────────────

const overlayStyles = StyleSheet.create({
  // ── Modal layers ──────────────────────────────────────────────────────────
  scrim: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '88%',
    maxWidth: 420,
    overflow: 'hidden',
    // Shadow handled by elevation from overlayTheme if provided
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── Header media ───────────────────────────────────────────────────────────
  headerMedia: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },

  // ── Close button ──────────────────────────────────────────────────────────
  closeBtn: {
    position: 'absolute',
    top: 10,
    zIndex: 20,              // Always above content and decorative layers
  },
  closeBtnRight: { right: 10 },
  closeBtnLeft:  { left: 10 },
  closeBtnCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600', lineHeight: 16 },

  // ── Dev badge ─────────────────────────────────────────────────────────────
  devBadge: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(21,101,192,0.9)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 15,
  },
  devBadgeText: { fontSize: 10, color: '#FFFFFF', fontWeight: '600' },

  // ── Content padding ───────────────────────────────────────────────────────
  contentPad: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 22,
  },
  centered: {
    alignItems: 'center',
  },

  // ── Typography ────────────────────────────────────────────────────────────
  headline: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 28,
  },
  body: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 15,
  },
  mysteryHint: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },

  // ── Promo badge ───────────────────────────────────────────────────────────
  promoBadge: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 6,
    marginVertical: 10,
  },
  promoBadgeText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },

  // ── Flash sale ────────────────────────────────────────────────────────────
  flashLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#E53935',
    marginBottom: 6,
    textAlign: 'center',
  },

  // ── Countdown ─────────────────────────────────────────────────────────────
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 12,
  },
  countdownPrefix: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 6,
  },
  digitBox: {
    minWidth: 36,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  digitSep: {
    fontSize: 18,
    fontWeight: '800',
  },
  countdownExpired: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 8,
  },

  // ── Mystery gift ──────────────────────────────────────────────────────────
  loaderLottie: {
    width: 80,
    height: 80,
    marginVertical: 12,
  },

  // ── Onboarding ────────────────────────────────────────────────────────────
  stepIndicator: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 6,
    fontWeight: '500',
  },

  // ── App update ────────────────────────────────────────────────────────────
  mandatoryBadge: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 8,
  },

  // ── CTAs ──────────────────────────────────────────────────────────────────
  ctaBase: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaFull: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    borderRadius: 10,
  },
  ctaPrimary: {
    paddingHorizontal: 24,
    paddingVertical: 13,
  },
  ctaGhost: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  ctaLink: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});

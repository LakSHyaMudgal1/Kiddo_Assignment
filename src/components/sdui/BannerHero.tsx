/**
 * BannerHero.tsx
 *
 * Production SDUI hero banner component.
 *
 * ─── Supported layouts ───────────────────────────────────────────────────────
 *
 *  overlay_bottom_left   ← BTS hero, editorial banners (most common)
 *  overlay_center        ← MGC hero (centered text over full-bleed image)
 *  overlay_bottom_right  ← right-aligned variant
 *  split_left            ← text left / image right (BTS essentials strip)
 *  split_right           ← image left / text right (art corner)
 *  media_top_text_bottom ← MGC "how it works" explainer
 *  media_bottom_text_top ← seasonal variants
 *
 * ─── Media rendering ─────────────────────────────────────────────────────────
 *
 *  kind: 'image'            → React Native Image with progressive loading
 *  kind: 'lottie'           → lottie-react-native LottieView
 *  kind: 'video_thumbnail'  → poster Image (video playback is future work)
 *
 * ─── OTA theme injection ─────────────────────────────────────────────────────
 *
 *  Every visual property resolves through useNodeTheme(data.theme).
 *  The server can change the entire banner appearance — background color,
 *  border radius, padding, opacity — without an app update.
 *  SDUITextStyle on content fields overrides font size, weight, color, align.
 *  SDUIButtonTheme on CTAs overrides button background, text color, radius.
 *
 * ─── Campaign engine ─────────────────────────────────────────────────────────
 *
 *  Back To School:     layout=overlay_bottom_left, theme.background=#0D47A1
 *  Summer Playhouse:   layout=overlay_bottom_left, colorTint=rgba(255,112,0,0.08)
 *  Mystery Gift:       layout=overlay_center, media.kind=lottie, countdown
 *
 *  Switching campaigns = changing the payload. Zero component code changes.
 *
 * ─── Re-render isolation ─────────────────────────────────────────────────────
 *
 *  BannerHero has NO Zustand subscriptions.
 *  It is wrapped in React.memo with a stable `data` prop (server payload ref).
 *  ADD_TO_CART, wishlist mutations, toast show — none trigger a re-render here.
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
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import LottieView from 'lottie-react-native';

import type { SDUIComponentProps } from '@registry/componentRegistry';
import type {
  BannerHeroData,
  BannerHeroLayout,
  BannerHeroMedia,
  BannerHeroCTA,
  BannerHeroTextContent,
} from '@/types/components/BannerHero';
import type { SDUIButtonTheme, SDUITimerTheme } from '@/types/sdui-theme';
import type { SDUITextStyle } from '@/types/sdui-primitives';
import type { SDUICountdown, Promotion } from '@/types/sdui-campaign';
import type { AppAction } from '@actions/types';

import { useTheme } from '@context/ThemeContext';
import { useActionDispatch } from '@context/ActionContext';
import { useNodeTheme, resolveColor, resolveBackground } from '@hooks/useNodeTheme';

// ─────────────────────────────────────────────────────────────────────────────
// Font-weight mapper
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
// useCountdown — memoised tick, auto-stops at zero
// ─────────────────────────────────────────────────────────────────────────────

interface CountdownTick {
  hours: string;
  minutes: string;
  seconds: string;
  isExpired: boolean;
  totalSeconds: number;
}

function formatPad(n: number): string {
  return String(Math.max(0, n)).padStart(2, '0');
}

function useCountdown(endsAt: string | undefined): CountdownTick {
  const getRemaining = useCallback((): CountdownTick => {
    if (!endsAt) return { hours: '00', minutes: '00', seconds: '00', isExpired: true, totalSeconds: 0 };
    const diff = Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000);
    if (diff <= 0) return { hours: '00', minutes: '00', seconds: '00', isExpired: true, totalSeconds: 0 };
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    return { hours: formatPad(h), minutes: formatPad(m), seconds: formatPad(s), isExpired: false, totalSeconds: diff };
  }, [endsAt]);

  const [tick, setTick] = useState<CountdownTick>(getRemaining);

  useEffect(() => {
    if (!endsAt || tick.isExpired) return;
    const interval = setInterval(() => {
      const next = getRemaining();
      setTick(next);
      if (next.isExpired) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt, tick.isExpired, getRemaining]);

  return tick;
}

// ─────────────────────────────────────────────────────────────────────────────
// SDUITextStyle → RN style resolver (pure function, no hooks)
// ─────────────────────────────────────────────────────────────────────────────

interface TextStyleResult {
  color?: string | undefined;
  fontSize?: number | undefined;
  fontWeight?: '400' | '500' | '600' | '700' | '800' | undefined;
  textAlign?: 'left' | 'center' | 'right' | undefined;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize' | undefined;
  letterSpacing?: number | undefined;
}

function resolveTextStyle(
  style: SDUITextStyle | undefined,
  theme: ReturnType<typeof useTheme>['theme'],
  fallbackColor?: string,
): TextStyleResult {
  if (!style) return { color: fallbackColor };
  return {
    color: style.color ? (resolveColor(style.color, theme) ?? fallbackColor) : fallbackColor,
    fontSize: style.size,
    fontWeight: style.weight ? FONT_WEIGHT_MAP[style.weight] : undefined,
    textAlign: style.align,
    textTransform: style.transform ?? undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MediaLayer — renders image / lottie / video_thumbnail
// ─────────────────────────────────────────────────────────────────────────────

interface MediaLayerProps {
  media: BannerHeroMedia;
  style?: object;
}

const MediaLayer: React.FC<MediaLayerProps> = React.memo(({ media, style }) => {
  if (media.kind === 'lottie' && media.lottieSource) {
    return (
      <LottieView
        source={
          typeof media.lottieSource === 'string'
            ? { uri: media.lottieSource }
            : media.lottieSource as any
        }
        autoPlay
        loop
        style={[StyleSheet.absoluteFill, style]}
        resizeMode="cover"
      />
    );
  }

  // video_thumbnail — render poster image as fallback (no video playback yet)
  const imageSource =
    media.kind === 'video_thumbnail'
      ? media.videoPoster
      : media.image;

  if (!imageSource) return null;

  return (
    <Image
      source={{ uri: imageSource.uri }}
      style={[StyleSheet.absoluteFill, style]}
      resizeMode={imageSource.resizeMode ?? 'cover'}
      accessibilityLabel={imageSource.alt}
    />
  );
});
MediaLayer.displayName = 'BannerHeroMedia';

// ─────────────────────────────────────────────────────────────────────────────
// ScrimLayer — gradient/solid overlay for text legibility
// ─────────────────────────────────────────────────────────────────────────────

interface ScrimLayerProps {
  scrim: BannerHeroData['scrim'];
  theme: ReturnType<typeof useTheme>['theme'];
}

const ScrimLayer: React.FC<ScrimLayerProps> = React.memo(({ scrim, theme }) => {
  if (!scrim) return null;

  // Solid scrim
  if (scrim.kind === 'solid') {
    const bg = resolveColor(scrim.color, theme);
    if (!bg) return null;
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: bg }]} pointerEvents="none" />;
  }

  // Gradient scrim — use a tall View with opacity fallback
  // Replace with expo-linear-gradient when available
  if (scrim.kind === 'gradient') {
    const firstStop = scrim.gradient.stops[0];
    const lastStop = scrim.gradient.stops[scrim.gradient.stops.length - 1];
    const topColor = resolveColor(firstStop?.color, theme) ?? 'transparent';
    const bottomColor = resolveColor(lastStop?.color, theme) ?? 'rgba(0,0,0,0.7)';

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top half — top color */}
        <View style={[heroStyles.scrimHalf, { backgroundColor: topColor, opacity: firstStop?.position ?? 0 }]} />
        {/* Bottom half — bottom color */}
        <View style={[heroStyles.scrimHalf, { backgroundColor: bottomColor }]} />
      </View>
    );
  }

  return null;
});
ScrimLayer.displayName = 'BannerHeroScrim';

// ─────────────────────────────────────────────────────────────────────────────
// CountdownTimer — live tick with urgency pulse
// ─────────────────────────────────────────────────────────────────────────────

interface CountdownTimerProps {
  countdown: SDUICountdown;
  timerTheme?: SDUITimerTheme | undefined;
  theme: ReturnType<typeof useTheme>['theme'];
}

const CountdownTimer: React.FC<CountdownTimerProps> = React.memo(
  ({ countdown, timerTheme, theme }) => {
    const tick = useCountdown(countdown.endsAt);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Urgency pulse when < 1 hour remains
    const isUrgent = tick.totalSeconds > 0 && tick.totalSeconds < 3600;

    useEffect(() => {
      if (!isUrgent || !(timerTheme?.pulseOnUrgency ?? true)) return;
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0,  duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }, [isUrgent, timerTheme?.pulseOnUrgency, pulseAnim]);

    if (tick.isExpired) {
      if (countdown.hideOnExpiry) return null;
      const expiredLabel = countdown.expiredLabel ?? 'Sale ended';
      return <Text style={[heroStyles.countdownExpired, { color: timerTheme?.digitColor ? resolveColor(timerTheme.digitColor, theme) : '#FFFFFF' }]}>{expiredLabel}</Text>;
    }

    const bg = timerTheme?.background ? resolveColor(timerTheme.background, theme) ?? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.4)';
    const digitColor = timerTheme?.digitColor ? resolveColor(timerTheme.digitColor, theme) ?? '#FFFFFF' : '#FFFFFF';
    const labelColor = timerTheme?.labelColor ? resolveColor(timerTheme.labelColor, theme) ?? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.7)';
    const sepColor = timerTheme?.separatorColor ? resolveColor(timerTheme.separatorColor, theme) ?? digitColor : digitColor;
    const radius = timerTheme?.borderRadius ?? 6;

    const prefix = countdown.prefixLabel ?? 'Ends in';

    return (
      <Animated.View style={[heroStyles.countdownRow, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={[heroStyles.countdownPrefix, { color: labelColor }]}>{prefix}</Text>
        {[tick.hours, tick.minutes, tick.seconds].map((val, i) => (
          <React.Fragment key={i}>
            <View style={[heroStyles.digitBox, { backgroundColor: bg, borderRadius: radius }]}>
              <Text style={[heroStyles.digitText, { color: digitColor }]}>{val}</Text>
            </View>
            {i < 2 ? <Text style={[heroStyles.digitSep, { color: sepColor }]}>:</Text> : null}
          </React.Fragment>
        ))}
      </Animated.View>
    );
  },
);
CountdownTimer.displayName = 'BannerHeroCountdown';

// ─────────────────────────────────────────────────────────────────────────────
// PromotionBadge
// ─────────────────────────────────────────────────────────────────────────────

interface PromotionBadgeProps {
  promotion: Promotion;
  theme: ReturnType<typeof useTheme>['theme'];
}

const PromotionBadge: React.FC<PromotionBadgeProps> = React.memo(({ promotion, theme }) => {
  if (!promotion.badge) return null;
  const { badge } = promotion;
  const bg = badge.color ? resolveColor(badge.color, theme) ?? '#E53935' : '#E53935';
  const tc = badge.textColor ? resolveColor(badge.textColor, theme) ?? '#FFFFFF' : '#FFFFFF';

  return (
    <View style={[heroStyles.promoBadge, { backgroundColor: bg }]}>
      <Text style={[heroStyles.promoBadgeLabel, { color: tc }]}>{badge.label}</Text>
      {badge.subLabel ? (
        <Text style={[heroStyles.promoBadgeSub, { color: tc }]}>{badge.subLabel}</Text>
      ) : null}
    </View>
  );
});
PromotionBadge.displayName = 'BannerHeroPromoBadge';

// ─────────────────────────────────────────────────────────────────────────────
// CTAButton — no business logic, forwards action to dispatcher
// ─────────────────────────────────────────────────────────────────────────────

interface CTAButtonProps {
  cta: BannerHeroCTA;
  ctaTheme?: SDUIButtonTheme;
  dispatch: (action: AppAction) => Promise<void>;
  theme: ReturnType<typeof useTheme>['theme'];
  fullWidth?: boolean;
}

const CTAButton: React.FC<CTAButtonProps> = React.memo(
  ({ cta, ctaTheme, dispatch, theme, fullWidth = false }) => {
    const merged = cta.theme ?? ctaTheme;

    const bg = merged?.background
      ? resolveColor(merged.background, theme) ?? theme.colors.interactivePrimary
      : theme.colors.interactivePrimary;
    const tc = merged?.textColor
      ? resolveColor(merged.textColor, theme) ?? theme.colors.textOnBrand
      : theme.colors.textOnBrand;
    const bc = merged?.borderColor ? resolveColor(merged.borderColor, theme) : undefined;
    const radius = merged?.borderRadius ?? 8;

    const isGhost = merged?.variant === 'ghost';
    const isLink = merged?.variant === 'link';
    const isSecondary = merged?.variant === 'secondary';

    const buttonStyle = useMemo(() => {
      if (isLink) return heroStyles.ctaLink;
      if (isGhost) return [heroStyles.ctaGhost, { borderColor: bc ?? tc }];
      if (isSecondary) return [heroStyles.ctaSecondary, { backgroundColor: isSecondary ? 'rgba(255,255,255,0.15)' : bg }];
      return [heroStyles.ctaPrimary, { backgroundColor: bg, borderRadius: radius, borderColor: bc, borderWidth: bc ? 1.5 : 0 }];
    }, [bg, bc, tc, radius, isGhost, isLink, isSecondary]);

    const sizeStyle = useMemo(() => {
      const size = merged?.size ?? 'md';
      return {
        xs: heroStyles.ctaSizeXs,
        sm: heroStyles.ctaSizeSm,
        md: heroStyles.ctaSizeMd,
        lg: heroStyles.ctaSizeLg,
        full: heroStyles.ctaSizeFull,
      }[size] ?? heroStyles.ctaSizeMd;
    }, [merged?.size]);

    const handlePress = useCallback(() => {
      void dispatch(cta.action as AppAction);
    }, [dispatch, cta.action]);

    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[
          heroStyles.ctaBase,
          buttonStyle,
          sizeStyle,
          fullWidth ? heroStyles.ctaSizeFull : null,
          isLink ? null : { borderRadius: radius },
        ]}
        activeOpacity={0.82}
        accessibilityLabel={cta.accessibilityLabel ?? cta.label}
        accessibilityRole="button"
      >
        <Text style={[heroStyles.ctaText, { color: tc }]} numberOfLines={1}>
          {cta.label}
        </Text>
      </TouchableOpacity>
    );
  },
);
CTAButton.displayName = 'BannerHeroCTA';

// ─────────────────────────────────────────────────────────────────────────────
// ContentBlock — eyebrow / headline / subheadline
// ─────────────────────────────────────────────────────────────────────────────

interface ContentBlockProps {
  content: BannerHeroTextContent;
  theme: ReturnType<typeof useTheme>['theme'];
  align?: 'left' | 'center' | 'right';
}

const ContentBlock: React.FC<ContentBlockProps> = React.memo(({ content, theme, align = 'left' }) => {
  const defaultTextColor = theme.colors.textInverse;

  return (
    <View>
      {content.eyebrowText ? (
        <Text
          style={[
            heroStyles.eyebrow,
            { color: defaultTextColor, textAlign: align },
            resolveTextStyle(content.eyebrowStyle, theme, defaultTextColor),
          ]}
          numberOfLines={1}
        >
          {content.eyebrowText}
        </Text>
      ) : null}

      <Text
        style={[
          heroStyles.headline,
          { color: defaultTextColor, textAlign: align },
          resolveTextStyle(content.headlineStyle, theme, defaultTextColor),
        ]}
        numberOfLines={3}
      >
        {content.headline}
      </Text>

      {content.subheadline ? (
        <Text
          style={[
            heroStyles.subheadline,
            { color: 'rgba(255,255,255,0.85)', textAlign: align },
            resolveTextStyle(content.subheadlineStyle, theme, 'rgba(255,255,255,0.85)'),
          ]}
          numberOfLines={2}
        >
          {content.subheadline}
        </Text>
      ) : null}
    </View>
  );
});
ContentBlock.displayName = 'BannerHeroContent';

// ─────────────────────────────────────────────────────────────────────────────
// Layout contract
//
// Every layout component receives the same LayoutProps bag.
// The layout registry maps BannerHeroLayout strings → layout components.
//
// ADDING A NEW LAYOUT:
//   1. Create:  const MyNewLayout: React.FC<LayoutProps> = React.memo(...)
//   2. Add:     MY_NEW_LAYOUT: MyNewLayout  in LAYOUT_REGISTRY
//   3. Done.    BannerHero.tsx body is untouched.
//
// This is the same factory pattern used by the SDUI component registry —
// a plain object lookup replaces every if/else and switch statement.
// ─────────────────────────────────────────────────────────────────────────────

interface LayoutProps {
  data: BannerHeroData;
  theme: ReturnType<typeof useTheme>['theme'];
  dispatch: (action: AppAction) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared overlay content panel
// Used by all three overlay layouts — positioned differently by each.
// ─────────────────────────────────────────────────────────────────────────────

interface OverlayContentPanelProps {
  data: BannerHeroData;
  theme: ReturnType<typeof useTheme>['theme'];
  dispatch: (action: AppAction) => Promise<void>;
  align?: 'left' | 'center' | 'right';
}

const OverlayContentPanel: React.FC<OverlayContentPanelProps> = React.memo(
  ({ data, theme, dispatch, align = 'left' }) => (
    <View style={heroStyles.overlayPanel}>
      <ContentBlock content={data.content} theme={theme} align={align} />

      {/* Countdown */}
      {data.countdown ? (
        <CountdownTimer
          countdown={data.countdown}
          timerTheme={data.countdownTheme}
          theme={theme}
        />
      ) : null}

      {/* CTA row */}
      <View style={[heroStyles.ctaRow, align === 'center' ? heroStyles.ctaRowCenter : null]}>
        <CTAButton
          cta={data.primaryCTA}
          dispatch={dispatch}
          theme={theme}
        />
        {data.secondaryCTA ? (
          <CTAButton
            cta={data.secondaryCTA}
            dispatch={dispatch}
            theme={theme}
          />
        ) : null}
      </View>
    </View>
  ),
);
OverlayContentPanel.displayName = 'OverlayContentPanel';

// ─────────────────────────────────────────────────────────────────────────────
// Layout 1: overlay_bottom_left  (BTS hero, Summer hero, editorial banners)
//
//  ┌────────────────────────────────┐
//  │  [media full-bleed]            │
//  │  [promo badge top-right]       │
//  │                                │
//  │  eyebrow                       │
//  │  headline                      │
//  │  subheadline                   │
//  │  [CTA row]   [countdown]       │
//  └────────────────────────────────┘
// ─────────────────────────────────────────────────────────────────────────────

const OverlayBottomLeftLayout: React.FC<LayoutProps> = React.memo(
  ({ data, theme, dispatch }) => (
    <>
      <MediaLayer media={data.media} />
      <ScrimLayer scrim={data.scrim} theme={theme} />
      {data.promotion ? (
        <View style={heroStyles.promoBadgeTopRight}>
          <PromotionBadge promotion={data.promotion} theme={theme} />
        </View>
      ) : null}
      <OverlayContentPanel data={data} theme={theme} dispatch={dispatch} align="left" />
    </>
  ),
);
OverlayBottomLeftLayout.displayName = 'Layout_overlay_bottom_left';

// ─────────────────────────────────────────────────────────────────────────────
// Layout 2: overlay_center  (MGC hero — centered text over full-bleed)
//
//  ┌────────────────────────────────┐
//  │  [media full-bleed]            │
//  │                                │
//  │       eyebrow (center)         │
//  │       headline (center)        │
//  │       subheadline (center)     │
//  │       [countdown center]       │
//  │       [CTA row center]         │
//  │                                │
//  └────────────────────────────────┘
// ─────────────────────────────────────────────────────────────────────────────

const OverlayCenterLayout: React.FC<LayoutProps> = React.memo(
  ({ data, theme, dispatch }) => (
    <>
      <MediaLayer media={data.media} />
      <ScrimLayer scrim={data.scrim} theme={theme} />
      {data.promotion ? (
        <View style={heroStyles.promoBadgeTopRight}>
          <PromotionBadge promotion={data.promotion} theme={theme} />
        </View>
      ) : null}
      <View style={heroStyles.overlayCenterWrapper}>
        <OverlayContentPanel data={data} theme={theme} dispatch={dispatch} align="center" />
      </View>
    </>
  ),
);
OverlayCenterLayout.displayName = 'Layout_overlay_center';

// ─────────────────────────────────────────────────────────────────────────────
// Layout 3: overlay_bottom_right  (right-aligned variant)
// ─────────────────────────────────────────────────────────────────────────────

const OverlayBottomRightLayout: React.FC<LayoutProps> = React.memo(
  ({ data, theme, dispatch }) => (
    <>
      <MediaLayer media={data.media} />
      <ScrimLayer scrim={data.scrim} theme={theme} />
      {data.promotion ? (
        <View style={heroStyles.promoBadgeTopLeft}>
          <PromotionBadge promotion={data.promotion} theme={theme} />
        </View>
      ) : null}
      <View style={heroStyles.overlayBottomRight}>
        <OverlayContentPanel data={data} theme={theme} dispatch={dispatch} align="right" />
      </View>
    </>
  ),
);
OverlayBottomRightLayout.displayName = 'Layout_overlay_bottom_right';

// ─────────────────────────────────────────────────────────────────────────────
// Layout 4: split_right  (image LEFT, text RIGHT — art corner banner)
//
//  ┌──────────────┬─────────────────┐
//  │  [image]     │  eyebrow        │
//  │              │  headline       │
//  │              │  subheadline    │
//  │              │  [CTA]          │
//  └──────────────┴─────────────────┘
// ─────────────────────────────────────────────────────────────────────────────

const SplitRightLayout: React.FC<LayoutProps> = React.memo(
  ({ data, theme, dispatch }) => (
    <View style={heroStyles.splitRow}>
      {/* Left: media */}
      <View style={heroStyles.splitMediaHalf}>
        <MediaLayer media={data.media} />
      </View>
      {/* Right: content */}
      <View style={heroStyles.splitContentHalf}>
        {data.promotion ? <PromotionBadge promotion={data.promotion} theme={theme} /> : null}
        <ContentBlock content={data.content} theme={theme} align="left" />
        {data.countdown ? (
          <CountdownTimer countdown={data.countdown} timerTheme={data.countdownTheme} theme={theme} />
        ) : null}
        <View style={heroStyles.ctaRow}>
          <CTAButton cta={data.primaryCTA} dispatch={dispatch} theme={theme} />
          {data.secondaryCTA ? (
            <CTAButton cta={data.secondaryCTA} dispatch={dispatch} theme={theme} />
          ) : null}
        </View>
      </View>
    </View>
  ),
);
SplitRightLayout.displayName = 'Layout_split_right';

// ─────────────────────────────────────────────────────────────────────────────
// Layout 5: split_left  (text LEFT, image RIGHT — BTS essentials strip)
//
//  ┌─────────────────┬──────────────┐
//  │  eyebrow        │  [image]     │
//  │  headline       │              │
//  │  subheadline    │              │
//  │  [CTA]          │              │
//  └─────────────────┴──────────────┘
// ─────────────────────────────────────────────────────────────────────────────

const SplitLeftLayout: React.FC<LayoutProps> = React.memo(
  ({ data, theme, dispatch }) => (
    <View style={heroStyles.splitRow}>
      {/* Left: content */}
      <View style={heroStyles.splitContentHalf}>
        {data.promotion ? <PromotionBadge promotion={data.promotion} theme={theme} /> : null}
        <ContentBlock content={data.content} theme={theme} align="left" />
        {data.countdown ? (
          <CountdownTimer countdown={data.countdown} timerTheme={data.countdownTheme} theme={theme} />
        ) : null}
        <View style={heroStyles.ctaRow}>
          <CTAButton cta={data.primaryCTA} dispatch={dispatch} theme={theme} />
          {data.secondaryCTA ? (
            <CTAButton cta={data.secondaryCTA} dispatch={dispatch} theme={theme} />
          ) : null}
        </View>
      </View>
      {/* Right: media */}
      <View style={heroStyles.splitMediaHalf}>
        <MediaLayer media={data.media} />
      </View>
    </View>
  ),
);
SplitLeftLayout.displayName = 'Layout_split_left';

// ─────────────────────────────────────────────────────────────────────────────
// Layout 6: media_top_text_bottom  (MGC "how it works" — stacked)
//
//  ┌────────────────────────────────┐
//  │  [media — fixed height]        │
//  ├────────────────────────────────┤
//  │  eyebrow                       │
//  │  headline                      │
//  │  subheadline                   │
//  │  [CTA]                         │
//  └────────────────────────────────┘
// ─────────────────────────────────────────────────────────────────────────────

const MediaTopTextBottomLayout: React.FC<LayoutProps> = React.memo(
  ({ data, theme, dispatch }) => (
    <View style={heroStyles.stackedCol}>
      {/* Top: media — takes 55% of height */}
      <View style={heroStyles.stackedMediaTop}>
        <MediaLayer media={data.media} />
        {data.promotion ? (
          <View style={heroStyles.promoBadgeTopRight}>
            <PromotionBadge promotion={data.promotion} theme={theme} />
          </View>
        ) : null}
      </View>
      {/* Bottom: content */}
      <View style={heroStyles.stackedContentBottom}>
        <ContentBlock content={data.content} theme={theme} align="left" />
        {data.countdown ? (
          <CountdownTimer countdown={data.countdown} timerTheme={data.countdownTheme} theme={theme} />
        ) : null}
        <View style={heroStyles.ctaRow}>
          <CTAButton cta={data.primaryCTA} dispatch={dispatch} theme={theme} />
          {data.secondaryCTA ? (
            <CTAButton cta={data.secondaryCTA} dispatch={dispatch} theme={theme} />
          ) : null}
        </View>
      </View>
    </View>
  ),
);
MediaTopTextBottomLayout.displayName = 'Layout_media_top_text_bottom';

// ─────────────────────────────────────────────────────────────────────────────
// Layout 7: media_bottom_text_top  (seasonal variants — inverse of above)
// ─────────────────────────────────────────────────────────────────────────────

const MediaBottomTextTopLayout: React.FC<LayoutProps> = React.memo(
  ({ data, theme, dispatch }) => (
    <View style={heroStyles.stackedCol}>
      {/* Top: content */}
      <View style={heroStyles.stackedContentBottom}>
        <ContentBlock content={data.content} theme={theme} align="left" />
        {data.countdown ? (
          <CountdownTimer countdown={data.countdown} timerTheme={data.countdownTheme} theme={theme} />
        ) : null}
        <View style={heroStyles.ctaRow}>
          <CTAButton cta={data.primaryCTA} dispatch={dispatch} theme={theme} />
          {data.secondaryCTA ? (
            <CTAButton cta={data.secondaryCTA} dispatch={dispatch} theme={theme} />
          ) : null}
        </View>
      </View>
      {/* Bottom: media */}
      <View style={heroStyles.stackedMediaTop}>
        <MediaLayer media={data.media} />
        {data.promotion ? (
          <View style={heroStyles.promoBadgeTopRight}>
            <PromotionBadge promotion={data.promotion} theme={theme} />
          </View>
        ) : null}
      </View>
    </View>
  ),
);
MediaBottomTextTopLayout.displayName = 'Layout_media_bottom_text_top';

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT_REGISTRY
//
// The single source of truth for layout → component mapping.
// Lives OUTSIDE the BannerHero render function — never recreated.
//
// HOW TO ADD A NEW LAYOUT:
//   1. Build: const MyLayout: React.FC<LayoutProps> = React.memo(...)
//   2. Add:   my_layout_key: MyLayout
//   3. Add the key to BannerHeroLayout union in types/components/BannerHero.ts
//   4. Done. BannerHero component body is untouched.
//
// Same pattern as the SDUI component registry:
//   resolveEntryUnknown(LAYOUT_REGISTRY, data.layout)
//   → O(1) object lookup, no switch, no if-else
// ─────────────────────────────────────────────────────────────────────────────

const LAYOUT_REGISTRY: Readonly<Record<BannerHeroLayout, React.FC<LayoutProps>>> =
  Object.freeze({
    overlay_bottom_left:   OverlayBottomLeftLayout,
    overlay_center:        OverlayCenterLayout,
    overlay_bottom_right:  OverlayBottomRightLayout,
    split_right:           SplitRightLayout,
    split_left:            SplitLeftLayout,
    media_top_text_bottom: MediaTopTextBottomLayout,
    media_bottom_text_top: MediaBottomTextTopLayout,
  });

// ─────────────────────────────────────────────────────────────────────────────
// BannerHero — root SDUI component
//
// ZERO Zustand subscriptions — ADD_TO_CART never triggers a re-render here.
// React.memo with default shallow comparator: `data` is a stable server ref.
// ─────────────────────────────────────────────────────────────────────────────

type Props = SDUIComponentProps<BannerHeroData>;

export const BannerHero: React.FC<Props> = React.memo(({ id, data, testID }) => {
  const { theme } = useTheme();
  const dispatch = useActionDispatch();

  // OTA theme — resolves SDUIThemeOverride against the active AppTheme
  const nodeTheme = useNodeTheme(data.theme);

  // Resolve container background:
  // Priority: theme.background override → colorTint → surfaceDefault
  const containerBg = useMemo(() => {
    if (data.theme?.background) {
      return resolveBackground(data.theme.background, theme);
    }
    return theme.colors.bgPrimary;
  }, [data.theme?.background, theme]);

  // colorTint — applied as a semi-transparent overlay layer over the media
  const tintColor = useMemo(
    () => (data.colorTint ? resolveColor(data.colorTint, theme) : undefined),
    [data.colorTint, theme],
  );

  // Layout component — O(1) registry lookup, no switch
  const LayoutComponent = LAYOUT_REGISTRY[data.layout] ?? OverlayBottomLeftLayout;

  const height = data.height ?? 300;
  const borderRadius = nodeTheme.borderRadius ?? 0;
  const opacity = nodeTheme.opacity ?? 1;

  return (
    <View
      testID={testID ?? `banner-hero-${id}`}
      accessibilityLabel={data.accessibilityLabel ?? data.content.headline}
      accessibilityRole="image"
      style={[
        heroStyles.container,
        {
          height,
          backgroundColor: containerBg,
          borderRadius,
          opacity,
          marginHorizontal: borderRadius > 0 ? 12 : 0,
          marginVertical: 6,
          overflow: 'hidden',
        },
        // Server-driven elevation/shadow
        nodeTheme.elevation != null && nodeTheme.elevation > 0
          ? theme.shadows[
              ((['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const)[
                Math.min(nodeTheme.elevation, 5) - 1
              ] ?? 'xs')
            ]
          : null,
      ]}
    >
      {/* Layout renders media + content according to the layout variant */}
      <LayoutComponent data={data} theme={theme} dispatch={dispatch} />

      {/* Color tint overlay — OTA seasonal theming without image swap */}
      {tintColor ? (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: tintColor }]}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
});

BannerHero.displayName = 'BannerHero';

// ─────────────────────────────────────────────────────────────────────────────
// StyleSheet
// All values are dp units. Colors are injected at render time from theme.
// ─────────────────────────────────────────────────────────────────────────────

const heroStyles = StyleSheet.create({
  // ── Root container ──────────────────────────────────────────────────────
  container: {
    position: 'relative',
    overflow: 'hidden',
  },

  // ── Scrim ───────────────────────────────────────────────────────────────
  scrimHalf: {
    flex: 1,
  },

  // ── Overlay layouts ──────────────────────────────────────────────────────
  overlayPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
  },
  overlayCenterWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  overlayBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    alignItems: 'flex-end',
  },

  // ── Promo badge positions ────────────────────────────────────────────────
  promoBadgeTopRight: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  promoBadgeTopLeft: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  promoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  promoBadgeLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  promoBadgeSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },

  // ── Split layouts ────────────────────────────────────────────────────────
  splitRow: {
    flex: 1,
    flexDirection: 'row',
  },
  splitMediaHalf: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  splitContentHalf: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
    justifyContent: 'center',
  },

  // ── Stacked layouts ──────────────────────────────────────────────────────
  stackedCol: {
    flex: 1,
    flexDirection: 'column',
  },
  stackedMediaTop: {
    flex: 55,
    position: 'relative',
    overflow: 'hidden',
  },
  stackedContentBottom: {
    flex: 45,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },

  // ── Content text ─────────────────────────────────────────────────────────
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headline: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 6,
  },
  subheadline: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 12,
  },

  // ── CTA rows ─────────────────────────────────────────────────────────────
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  ctaRowCenter: {
    justifyContent: 'center',
  },

  // ── CTA button base ───────────────────────────────────────────────────────
  ctaBase: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimary: {
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  ctaSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  ctaGhost: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  ctaLink: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── CTA sizes ─────────────────────────────────────────────────────────────
  ctaSizeXs: { paddingHorizontal: 10, paddingVertical: 6 },
  ctaSizeSm: { paddingHorizontal: 14, paddingVertical: 8 },
  ctaSizeMd: { paddingHorizontal: 20, paddingVertical: 11 },
  ctaSizeLg: { paddingHorizontal: 26, paddingVertical: 14 },
  ctaSizeFull: { alignSelf: 'stretch', paddingVertical: 13 },

  // ── Countdown ─────────────────────────────────────────────────────────────
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 10,
    marginTop: 4,
  },
  countdownPrefix: {
    fontSize: 11,
    fontWeight: '500',
    marginRight: 4,
  },
  digitBox: {
    minWidth: 32,
    paddingHorizontal: 6,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  digitSep: {
    fontSize: 15,
    fontWeight: '800',
  },
  countdownExpired: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
});

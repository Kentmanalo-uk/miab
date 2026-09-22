import { Check, Undo2, X } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { AppText, Button } from './ui';

/**
 * A sketch pad, for drawing something to send with a letter.
 *
 * ── How it draws ──
 *
 * Touches are collected into SVG path strings and rendered with react-native-svg
 * — already a dependency, since the icon set is built on it. Finished strokes
 * are frozen into state and only the stroke under the finger re-renders, so a
 * long drawing does not get slower as it fills up.
 *
 * ── How it is saved, and why the size cap exists ──
 *
 * The finished drawing is captured to a data URL and stored in the message's
 * `photo` field, which is what the website already reads — so a sketch sent
 * from the phone shows up on the site with no change there.
 *
 * That field goes straight into the Firestore document, and a Firestore
 * document cannot exceed 1 MiB. A drawing that comes out too large is not a
 * cosmetic problem: the write is rejected outright. So the capture is done at a
 * fixed modest resolution, checked, and re-encoded as JPEG if PNG came out too
 * big — and if it is still too big, you are told, rather than being allowed to
 * press send on something that cannot be written.
 *
 * Worth knowing: every message list that loads this drawing pays for the whole
 * data URL, because it lives inside the document rather than behind a link.
 * If sketches become common, moving them to Firebase Storage and keeping a URL
 * here is the change to make.
 */

/** 4:3, matching the web sketch pad's aspect ratio. */
const CAPTURE_WIDTH = 768;
const CAPTURE_HEIGHT = 576;

/**
 * Ceiling for the encoded data URL.
 *
 * Firestore's hard limit is 1 MiB for the whole document. 700 KB leaves room
 * for the letter, the recipient, ids and timestamps without having to measure
 * them.
 */
const MAX_DATA_URL_BYTES = 700 * 1024;

const STROKE_WIDTH = 4;

interface Stroke {
  d: string;
  color: string;
}

export interface SketchSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Receives a `data:image/...;base64,…` string. */
  onDone: (dataUrl: string) => void;
}

/** Ink colours. Deliberately few — this is a note, not an art program. */
const INK = ['#0A0A0A', '#EF4444', '#2563EB', '#16A34A', '#CA8A04'] as const;

export function SketchSheet({ visible, onClose, onDone }: SketchSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(0)).current;

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [current, setCurrent] = useState<string>('');
  const [color, setColor] = useState<string>(INK[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<View>(null);
  // The live stroke is mirrored into a ref because PanResponder is created once
  // and would otherwise close over the first render's value forever.
  const currentRef = useRef('');
  const colorRef = useRef<string>(INK[0]);
  colorRef.current = color;

  const canvasWidth = screenWidth - spacing[5] * 2;
  const canvasHeight = (canvasWidth * CAPTURE_HEIGHT) / CAPTURE_WIDTH;

  React.useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [visible, anim]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Claim the gesture outright. Without this the sheet's own scrolling
        // and the modal's dismiss can steal a stroke halfway through.
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,

        onPanResponderGrant: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          currentRef.current = `M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
          setCurrent(currentRef.current);
        },
        onPanResponderMove: (e) => {
          const { locationX, locationY } = e.nativeEvent;
          currentRef.current += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
          setCurrent(currentRef.current);
        },
        onPanResponderRelease: () => {
          const d = currentRef.current;
          currentRef.current = '';
          setCurrent('');
          // A tap with no movement produces a move-less path, which renders as
          // nothing. Given a dot so tapping leaves a mark.
          if (!d) return;
          const finished = d.includes(' L') ? d : `${d} L${d.slice(1)}`;
          setStrokes((prev) => [...prev, { d: finished, color: colorRef.current }]);
        },
      }),
    []
  );

  const undo = useCallback(() => {
    setError(null);
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    setError(null);
    setStrokes([]);
  }, []);

  const close = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  /**
   * Captures the canvas, shrinking the encoding until it fits, and refuses
   * rather than handing back something Firestore will reject.
   */
  const save = useCallback(async () => {
    if (strokes.length === 0) return;
    setIsSaving(true);
    setError(null);
    try {
      const attempts = [
        { format: 'png' as const, quality: 1 },
        { format: 'jpg' as const, quality: 0.7 },
        { format: 'jpg' as const, quality: 0.4 },
      ];

      for (const attempt of attempts) {
        const uri = await captureRef(canvasRef, {
          result: 'data-uri',
          format: attempt.format,
          quality: attempt.quality,
          width: CAPTURE_WIDTH,
          height: CAPTURE_HEIGHT,
        });

        // Base64 carries 3 bytes in every 4 characters; the comma-separated
        // header is negligible. Close enough to compare against a cap.
        const approxBytes = Math.ceil((uri.length * 3) / 4);
        if (approxBytes <= MAX_DATA_URL_BYTES) {
          onDone(uri);
          close();
          return;
        }
      }

      setError(
        'That drawing is too detailed to attach. Try clearing some of it.'
      );
    } catch (e) {
      console.error('Sketch capture failed:', e);
      setError("Couldn't save that drawing. Try again.");
    } finally {
      setIsSaving(false);
    }
  }, [strokes.length, onDone, close]);

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      onRequestClose={close}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#000000',
              opacity: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.45],
              }),
            },
          ]}
        >
          <Pressable
            onPress={close}
            style={{ flex: 1 }}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
        </Animated.View>

        <Animated.View
          style={{
            marginTop: 'auto',
            backgroundColor: colors.card,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            paddingTop: spacing[5],
            paddingBottom: insets.bottom + spacing[4],
            paddingHorizontal: spacing[5],
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [900, 0],
                }),
              },
            ],
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <AppText variant="h3">Sketch</AppText>
            <Pressable
              onPress={close}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close sketch pad"
              style={({ pressed }) => [pressed ? { opacity: 0.5 } : null]}
            >
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* The capture target.
              White rather than the theme's card colour: this becomes an image
              that will be looked at on a website in either theme, and a drawing
              on a transparent or dark background would be invisible on one of
              them. */}
          <View
            ref={canvasRef}
            collapsable={false}
            {...panResponder.panHandlers}
            style={{
              width: canvasWidth,
              height: canvasHeight,
              marginTop: spacing[4],
              borderRadius: radius.container,
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
            accessibilityLabel="Drawing area"
          >
            <Svg width={canvasWidth} height={canvasHeight}>
              {strokes.map((stroke, i) => (
                <Path
                  key={i}
                  d={stroke.d}
                  stroke={stroke.color}
                  strokeWidth={STROKE_WIDTH}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}
              {!!current && (
                <Path
                  d={current}
                  stroke={color}
                  strokeWidth={STROKE_WIDTH}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              )}
            </Svg>

            {strokes.length === 0 && !current && (
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  { alignItems: 'center', justifyContent: 'center' },
                ]}
              >
                <AppText variant="muted">Draw here</AppText>
              </View>
            )}
          </View>

          {/* Ink */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[3],
              marginTop: spacing[4],
            }}
          >
            {INK.map((ink) => {
              const selected = ink === color;
              return (
                <Pressable
                  key={ink}
                  onPress={() => setColor(ink)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Ink colour ${ink}`}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: radius.full,
                    backgroundColor: ink,
                    // The selected swatch is ringed in the sheet colour with an
                    // outer border, so it reads as chosen on both themes
                    // without relying on the swatch's own colour.
                    borderWidth: selected ? 3 : 1,
                    borderColor: selected ? colors.foreground : colors.border,
                    transform: selected ? [{ scale: 1.15 }] : undefined,
                  }}
                />
              );
            })}

            <View style={{ flex: 1 }} />

            <Pressable
              onPress={undo}
              disabled={strokes.length === 0}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Undo last stroke"
              style={({ pressed }) => [
                { opacity: strokes.length === 0 ? 0.3 : pressed ? 0.5 : 1 },
              ]}
            >
              <Undo2 size={20} color={colors.foreground} />
            </Pressable>
          </View>

          {error && (
            <AppText
              variant="small"
              color={colors.destructive}
              style={{ textAlign: 'center', marginTop: spacing[3] }}
            >
              {error}
            </AppText>
          )}

          <View
            style={{ flexDirection: 'row', gap: spacing[3], marginTop: spacing[4] }}
          >
            <Button
              title="Clear"
              variant="outline"
              onPress={clear}
              disabled={strokes.length === 0}
              style={{ flex: 1 }}
            />
            <Button
              title="Attach"
              icon={<Check size={16} color={colors.primaryForeground} />}
              onPress={save}
              loading={isSaving}
              disabled={strokes.length === 0}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

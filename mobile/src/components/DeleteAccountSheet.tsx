import { useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import {
  WrongPasswordError,
  deleteAccountAndData,
  type DeletionStep,
} from '../lib/account';
import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../theme/tokens';
import { AppText, Button, Input, Label } from './ui';

/**
 * "Delete my account", the in-app half of Google Play's deletion requirement.
 *
 * Two things this screen refuses to do:
 *
 * 1. Delete on a single tap. The password is asked for here rather than after a
 *    failure, because Firebase will not delete a user whose sign-in is more
 *    than a few minutes old — and because it is the only evidence that the
 *    person holding an unlocked phone owns the account.
 * 2. Overstate what deletion achieves. The copy says plainly that messages
 *    other people already saved or shared are beyond reach. Implying otherwise
 *    would be a comforting lie on the one screen where people most need the
 *    truth.
 */

const STEP_LABEL: Record<DeletionStep, string> = {
  reauthenticating: 'Checking your password…',
  messages: 'Deleting your messages…',
  reviews: 'Deleting your reviews…',
  local: 'Clearing this device…',
  account: 'Closing your account…',
};

export interface DeleteAccountSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function DeleteAccountSheet({
  visible,
  onClose,
}: DeleteAccountSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(0)).current;

  const [password, setPassword] = useState('');
  const [step, setStep] = useState<DeletionStep | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isWorking = step !== null;

  useEffect(() => {
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

  const close = useCallback(() => {
    // Never dismissible mid-delete: documents are being removed one page at a
    // time, and tearing the screen down would abandon the sweep partway.
    if (isWorking) return;
    setPassword('');
    setError(null);
    onClose();
  }, [isWorking, onClose]);

  const confirm = useCallback(async () => {
    if (!user || !password) return;
    setError(null);
    try {
      const summary = await deleteAccountAndData(user, password, setStep);
      setStep(null);
      setPassword('');
      onClose();
      // Auth state flips to signed-out on its own; this just puts them
      // somewhere sensible rather than on a settings screen for an account
      // that no longer exists.
      router.replace('/');
      console.log(
        `Account deleted. Removed ${summary.messagesDeleted} message(s) and ${summary.reviewsDeleted} review(s).`
      );
    } catch (e) {
      setStep(null);
      if (e instanceof WrongPasswordError) {
        setError(e.message);
        return;
      }
      console.error('Account deletion failed:', e);
      setError(
        "Something went wrong and your account was not deleted. Please try again, or email us if it keeps failing."
      );
    }
  }, [user, password, onClose, router]);

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
            paddingBottom: insets.bottom + spacing[5],
            paddingHorizontal: spacing[5],
            maxHeight: '86%',
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [800, 0],
                }),
              },
            ],
          }}
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing[3],
              }}
            >
              <AlertTriangle size={22} color={colors.destructive} />
              <AppText variant="h3">Delete your account</AppText>
            </View>

            <AppText variant="muted" style={{ marginTop: spacing[4] }}>
              This permanently deletes your account and:
            </AppText>

            <View style={{ marginTop: spacing[3], gap: spacing[2] }}>
              {[
                'Every message you have sent',
                'Every review you have written',
                'Everything this app has stored on this phone',
              ].map((line) => (
                <AppText key={line} variant="body">
                  {'•'}  {line}
                </AppText>
              ))}
            </View>

            <AppText variant="small" style={{ marginTop: spacing[4] }}>
              It cannot be undone. Messages that other people have already saved
              or shared as images are outside our reach and will not disappear.
            </AppText>

            <Label style={{ marginTop: spacing[6] }}>
              Confirm your password
            </Label>
            <Input
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              editable={!isWorking}
              accessibilityLabel="Confirm your password"
            />

            {error && (
              <AppText
                variant="small"
                color={colors.destructive}
                style={{ marginTop: spacing[2] }}
              >
                {error}
              </AppText>
            )}

            {step && (
              <AppText
                variant="small"
                style={{ marginTop: spacing[3], textAlign: 'center' }}
              >
                {STEP_LABEL[step]}
              </AppText>
            )}

            <Button
              title="Delete my account"
              variant="destructive"
              onPress={confirm}
              loading={isWorking}
              disabled={!password || isWorking}
              fullWidth
              style={{ marginTop: spacing[5] }}
            />
            <Button
              title="Cancel"
              variant="ghost"
              onPress={close}
              disabled={isWorking}
              fullWidth
              style={{ marginTop: spacing[2] }}
            />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ChannelAvatar } from '@/components/channel-avatar';
import { ThemedText } from '@/components/themed-text';
import { toFriendlyChannelError, type ResolvedChannel } from '@/hooks';
import { Colors, Radii, Spacing } from '@/theme';

type Step = 'input' | 'preview' | 'saving';

type Props = {
  visible: boolean;
  onClose: () => void;
  previewChannel: (input: string) => Promise<ResolvedChannel>;
  confirmChannel: (preview: ResolvedChannel) => Promise<void>;
};

export function AddChannelModal({ visible, onClose, previewChannel, confirmChannel }: Props) {
  const [step, setStep] = useState<Step>('input');
  const [inputValue, setInputValue] = useState('');
  const [preview, setPreview] = useState<ResolvedChannel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const reset = () => {
    setStep('input');
    setInputValue('');
    setPreview(null);
    setError(null);
    setIsResolving(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleResolve = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setError(null);
    setIsResolving(true);
    try {
      const resolved = await previewChannel(trimmed);
      setPreview(resolved);
      setStep('preview');
    } catch (err) {
      setError(toFriendlyChannelError(err));
    } finally {
      setIsResolving(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;

    setError(null);
    setStep('saving');
    try {
      await confirmChannel(preview);
      reset();
      onClose();
    } catch (err) {
      setError(toFriendlyChannelError(err));
      setStep('preview');
    }
  };

  const handleBack = () => {
    setStep('input');
    setError(null);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {step === 'input' ? (
            <>
              <ThemedText type="subtitle">Add YouTube Channel</ThemedText>
              <ThemedText type="caption" color="textSecondary" style={styles.hint}>
                YouTube channel URL or @handle
              </ThemedText>
              <TextInput
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="e.g. @somechannel"
                placeholderTextColor={Colors.textDisabled}
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus
                editable={!isResolving}
                onSubmitEditing={handleResolve}
              />
              {error && (
                <ThemedText color="error" style={styles.errorText}>
                  {error}
                </ThemedText>
              )}
              <View style={styles.actions}>
                <Pressable
                  onPress={handleClose}
                  disabled={isResolving}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  style={styles.secondaryButton}>
                  <ThemedText color="textSecondary">Cancel</ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleResolve}
                  disabled={!inputValue.trim() || isResolving}
                  accessibilityRole="button"
                  accessibilityLabel="Add channel"
                  style={[styles.primaryButton, (!inputValue.trim() || isResolving) && styles.disabled]}>
                  {isResolving ? (
                    <ActivityIndicator color={Colors.text} size="small" />
                  ) : (
                    <ThemedText style={styles.primaryButtonText}>Add Channel</ThemedText>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            preview && (
              <>
                <ThemedText type="subtitle">Confirm channel</ThemedText>
                <View style={styles.previewRow}>
                  <ChannelAvatar uri={preview.thumbnailUrl} size={56} />
                  <View style={styles.previewTextColumn}>
                    <ThemedText numberOfLines={1}>{preview.title}</ThemedText>
                    {preview.handle && (
                      <ThemedText type="caption" color="textSecondary">
                        {preview.handle}
                      </ThemedText>
                    )}
                  </View>
                </View>
                {error && (
                  <ThemedText color="error" style={styles.errorText}>
                    {error}
                  </ThemedText>
                )}
                <View style={styles.actions}>
                  <Pressable
                    onPress={handleBack}
                    disabled={step === 'saving'}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                    style={styles.secondaryButton}>
                    <ThemedText color="textSecondary">Back</ThemedText>
                  </Pressable>
                  <Pressable
                    onPress={handleConfirm}
                    disabled={step === 'saving'}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm"
                    style={[styles.primaryButton, step === 'saving' && styles.disabled]}>
                    {step === 'saving' ? (
                      <ActivityIndicator color={Colors.text} size="small" />
                    ) : (
                      <ThemedText style={styles.primaryButtonText}>Confirm</ThemedText>
                    )}
                  </Pressable>
                </View>
              </>
            )
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.large,
    borderTopRightRadius: Radii.large,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  hint: {
    marginBottom: Spacing.two,
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radii.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    color: Colors.text,
    fontSize: 16,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  previewTextColumn: {
    flex: 1,
    gap: 2,
  },
  errorText: {
    marginTop: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  secondaryButton: {
    minHeight: 44,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.pill,
    minHeight: 44,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 96,
  },
  primaryButtonText: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

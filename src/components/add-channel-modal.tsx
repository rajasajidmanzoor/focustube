import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radii, Spacing } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
};

export function AddChannelModal({ visible, onClose, onSubmit }: Props) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  };

  const handleClose = () => {
    setValue('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ThemedText type="subtitle">Add channel</ThemedText>
          <ThemedText type="caption" color="textSecondary" style={styles.hint}>
            Paste a channel URL, @handle, or name.
          </ThemedText>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="e.g. @somechannel"
            placeholderTextColor={Colors.textDisabled}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            onSubmitEditing={handleSubmit}
          />
          <View style={styles.actions}>
            <Pressable onPress={handleClose} style={styles.secondaryButton}>
              <ThemedText color="textSecondary">Cancel</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={!value.trim()}
              style={[styles.primaryButton, !value.trim() && styles.disabled]}>
              <ThemedText style={styles.primaryButtonText}>Add</ThemedText>
            </Pressable>
          </View>
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  secondaryButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

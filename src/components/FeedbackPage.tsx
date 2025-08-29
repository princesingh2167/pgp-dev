/* eslint-disable linebreak-style */
import React, {useMemo, useState} from 'react';
import {
  Platform,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';

const TOTAL_STARS = 5;

const FeedbackPage: React.FC = () => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');

  const stars = useMemo(
    () => new Array(TOTAL_STARS).fill(0).map((_, i) => i + 1),
    [],
  );

  const effectiveRating =
    Platform.OS === 'web' && hoverRating > 0 ? hoverRating : rating;

  const handleSubmit = () => {
    // TODO: Wire to backend if needed
    // For now just log
    console.log('Meeting feedback:', {rating, comment});
    // Navigate or show thanks as per app flow
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>Rate your meeting</Text>
        <View style={styles.starsRow}>
          {stars.map(star => {
            const active = star <= effectiveRating;
            return (
              <Pressable
                key={star}
                onPress={() => setRating(star)}
                onHoverIn={
                  Platform.OS === 'web' ? () => setHoverRating(star) : undefined
                }
                onHoverOut={
                  Platform.OS === 'web' ? () => setHoverRating(0) : undefined
                }
                style={[
                  styles.starWrap,
                  active || (Platform.OS === 'web' && hoverRating >= star)
                    ? styles.starWrapActive
                    : null,
                ]}>
                <Text style={[styles.star, active ? styles.starActive : null]}>
                  ★
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.label}>Optional feedback</Text>
        <TextInput
          style={styles.input}
          placeholder="Tell us more (optional)"
          placeholderTextColor="#999"
          multiline
          value={comment}
          onChangeText={setComment}
        />
        <Pressable
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={rating === 0}>
          <Text style={styles.submitText}>
            {rating === 0 ? 'Select a rating' : 'Submit feedback'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0b0bcc',
    padding: 16,
  },
  card: {
    width: 480,
    maxWidth: '100%',
    backgroundColor: '#101214',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
    gap: 8,
  },
  starWrap: {
    padding: 8,
    borderRadius: 8,
  },
  starWrapActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  star: {
    fontSize: 32,
    color: '#888',
  },
  starActive: {
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowRadius: 6,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    color: '#ccc',
  },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: '#099dfd',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    opacity: 1,
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default FeedbackPage;

/* eslint-disable linebreak-style */
import React, {useEffect, useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useParams, useHistory} from 'react-router-dom';

type MeetingResponse = {
  meetingId: number;
  status: string;
  isExpired: boolean;
  expiresAt?: string;
  title?: string;
  meetingDate?: string;
  meetingTime?: string;
};

const PreJoinPage: React.FC = () => {
  const {meetingId, chanelId} = useParams<{
    meetingId: string;
    chanelId: string;
  }>();
  const history = useHistory();

  const [loading, setLoading] = useState<boolean>(true);
  const [expired, setExpired] = useState<boolean>(false);
  const [meeting, setMeeting] = useState<MeetingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Persist meetingId
  useEffect(() => {
    if (meetingId) sessionStorage.setItem('meetingId', meetingId);
  }, [meetingId]);

  // Fetch meeting and redirect if not expired
  useEffect(() => {
    if (!meetingId) {
      setError('Missing meeting ID');
      setLoading(false);
      setExpired(true);
      return;
    }

    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);
        setExpired(false);

        const res = await fetch(
          `https://ugkznimh5b.ap-south-1.awsapprunner.com/meetings/${meetingId}/check-expiration`,
          {signal: ac.signal},
        );

        if (!res.ok) {
          throw new Error(`Failed to load meeting (HTTP ${res.status})`);
        }

        const data: MeetingResponse = await res.json();
        setMeeting(data);

        if (!data.isExpired) {
          // Not expired → Join immediately
          if (chanelId) {
            history.replace(`/${chanelId}`);
          } else {
            history.replace(`/join/${meetingId}`);
          }
        } else {
          setExpired(true);
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setError(
            e?.message || 'Something went wrong while fetching the meeting.',
          );
          setExpired(true);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [meetingId, chanelId, history]);

  const handleNavigate = () => {
    if (chanelId) history.push(`/${chanelId}`);
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>Meeting Details</Text>

        {loading ? (
          <Text style={styles.infoText}>Loading meeting...</Text>
        ) : expired ? (
          <>
            <Text style={styles.errorText}>Meeting link expired</Text>
            {error ? <Text style={styles.mutedText}>{error}</Text> : null}
          </>
        ) : (
          <>
            <View style={styles.detailsContainer}>
              <Text style={styles.label}>
                Meeting ID: <Text style={styles.value}>{meetingId}</Text>
              </Text>
              <Text style={styles.label}>
                Channel ID: <Text style={styles.value}>{chanelId}</Text>
              </Text>
              {meeting?.title ? (
                <Text style={styles.label}>
                  Title: <Text style={styles.value}>{meeting.title}</Text>
                </Text>
              ) : null}
              {meeting?.meetingDate || meeting?.meetingTime ? (
                <Text style={styles.label}>
                  When:{' '}
                  <Text style={styles.value}>
                    {meeting?.meetingDate ?? ''} {meeting?.meetingTime ?? ''}
                  </Text>
                </Text>
              ) : null}
            </View>

            {/* Fallback Button */}
            <Pressable style={styles.submitBtn} onPress={handleNavigate}>
              <Text style={styles.submitText}>Go to Channel</Text>
            </Pressable>
          </>
        )}
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
    marginBottom: 20,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 8,
  },
  value: {
    color: '#fff',
    fontWeight: '600',
  },
  infoText: {
    color: '#ccc',
    textAlign: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  mutedText: {
    color: '#aaa',
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 16,
    backgroundColor: '#fc4c02',
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

export default PreJoinPage;

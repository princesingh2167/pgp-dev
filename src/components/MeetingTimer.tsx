/* eslint-disable prettier/prettier */
import React, {useEffect, useMemo, useRef, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import {useVideoMeetingData} from './contexts/VideoMeetingDataContext';

type MeetingTimerProps = {
  remainingSeconds?: number;
  durationInMinutes?: number;
  warningBeforeSeconds?: number;
  onWarning?: (secondsRemaining: number) => void;
  onExpire?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const formatTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${
      seconds < 10 ? '0' : ''
    }${seconds}`;
  }

  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const MeetingTimer: React.FC<MeetingTimerProps> = React.memo(
  ({
    remainingSeconds,
    durationInMinutes = 30,
    warningBeforeSeconds = 60,
    onWarning,
    onExpire,
    containerStyle,
    textStyle,
  }) => {
    const {hostUids} = useVideoMeetingData();
    const apiCalledRef = useRef<boolean>(false);
    const startTimeRef = useRef<number>(Date.now());
    const elapsedTimeRef = useRef<number>(0);

    const initialSeconds = useMemo(() => {
      const fromProp =
        typeof remainingSeconds === 'number' && remainingSeconds >= 0
          ? Math.floor(remainingSeconds)
          : Math.floor(durationInMinutes * 60);
      return Math.max(0, fromProp);
    }, [durationInMinutes, remainingSeconds]);

    const [displayTime, setDisplayTime] = useState(formatTime(initialSeconds));
    const remainingTimeRef = useRef<number>(initialSeconds);
    const warnedRef = useRef<boolean>(false);

    const completeMeeting = useCallback(async () => {
      if (apiCalledRef.current) return; // Prevent multiple API calls

      // ✅ host.length must be >= 1
      if (hostUids.length < 1) return;

      // Only Web supports sessionStorage
      if (Platform.OS !== 'web') return;

      try {
        const meetingId = sessionStorage.getItem('meetingId');
        console.log(meetingId, 'meetingId');
        if (!meetingId) {
          console.warn('MeetingTimer: meetingId not found in sessionStorage');
          return;
        }

        const apiUrl = `https://ugkznimh5b.ap-south-1.awsapprunner.com/meetings/${meetingId}/complete`;

        const response = await fetch(apiUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          console.log('MeetingTimer: Meeting completed successfully');
          apiCalledRef.current = true;
        } else {
          console.error(
            'MeetingTimer: Failed to complete meeting',
            response.status,
          );
        }
      } catch (error) {
        console.error('MeetingTimer: Error completing meeting', error);
      }
    }, [hostUids.length]);

    useEffect(() => {
      remainingTimeRef.current = initialSeconds;
      setDisplayTime(formatTime(initialSeconds));
      warnedRef.current = false;
      apiCalledRef.current = false; // Reset API call flag when timer resets
      startTimeRef.current = Date.now(); // Reset start time when timer resets
      elapsedTimeRef.current = 0; // Reset elapsed time
    }, [initialSeconds]);

    useEffect(() => {
      const interval = setInterval(() => {
        const next = remainingTimeRef.current - 1;
        remainingTimeRef.current = next;

        if (next <= 0) {
          setDisplayTime('0:00');
          clearInterval(interval);
          onExpire && onExpire();
          return;
        }

        if (!warnedRef.current && next <= warningBeforeSeconds) {
          warnedRef.current = true;
          onWarning && onWarning(next);
        }

        setDisplayTime(formatTime(next));
      }, 1000);

      return () => clearInterval(interval);
    }, [onExpire, onWarning, warningBeforeSeconds, completeMeeting]);

    // Separate effect to automatically call API after 25 minutes (1500 seconds)
    useEffect(() => {
      const apiCheckInterval = setInterval(() => {
        // Calculate elapsed time in seconds
        const elapsedSeconds = Math.floor(
          (Date.now() - startTimeRef.current) / 1000,
        );
        elapsedTimeRef.current = elapsedSeconds;

        // Call API after 25 minutes (1500 seconds) regardless of displayTime
        if (elapsedSeconds >= 1800) {
          completeMeeting();
        }
      }, 1000); // Check every second

      return () => clearInterval(apiCheckInterval);
    }, [completeMeeting]);

    return (
      <View style={containerStyle}>
        {/* <Text style={textStyle}>{displayTime}</Text> */}
      </View>
    );
  },
);

export default MeetingTimer;

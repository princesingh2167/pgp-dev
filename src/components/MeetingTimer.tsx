/* eslint-disable prettier/prettier */
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {View, Text, StyleProp, ViewStyle, TextStyle} from 'react-native';

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
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
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

    useEffect(() => {
      remainingTimeRef.current = initialSeconds;
      setDisplayTime(formatTime(initialSeconds));
      warnedRef.current = false;
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
    }, [onExpire, onWarning, warningBeforeSeconds]);

    return (
      <View style={containerStyle}>
        <Text style={textStyle}>{displayTime}</Text>
      </View>
    );
  },
);

export default MeetingTimer;

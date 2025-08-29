/**
 * CustomWrapper.tsx
 *
 * Provides context and event handling for end-call and pin-for-everyone features
 * in the video calling app. It listens to custom events to control mic, video,
 * and pin actions based on user roles (host or attendee).
 */

import React, {
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
  useContext,
  useCallback,
} from 'react';

import {
  customEvents,
  useLocalAudio,
  useLocalVideo,
  useRoomInfo,
  useUserActionMenu,
  useLayout,
} from 'customization-api';
import {PinProvider} from './PinContext';
import {UidType} from '../../../index.rsdk';
import {DispatchContext} from '../../../agora-rn-uikit';
import {getPinnedLayoutName, DefaultLayouts} from '../../pages/video-call/DefaultLayouts';
import {useLiveStreamDataContext} from './LiveStreamDataContext';

export interface CustomWrapperContextInterface {
  triggerEndCallEvent: boolean;
  setTriggerEndCallEvent: Dispatch<SetStateAction<boolean>>;
  triggerEndCallEventRef: MutableRefObject<boolean>;
  pinnedForAllUid: UidType | null;
  setPinnedForAllUid: React.Dispatch<React.SetStateAction<UidType | null>>;
}

const CustomWrapperContext = React.createContext<CustomWrapperContextInterface>(
  {
    triggerEndCallEvent: true,
    setTriggerEndCallEvent: () => {},
    triggerEndCallEventRef: {current: true},
    pinnedForAllUid: null,
    setPinnedForAllUid: () => {},
  },
);

interface CustomWrapperProviderProps {
  children: React.ReactNode;
}

const CustomWrapperProvider = (props: CustomWrapperProviderProps) => {
  const [triggerEndCallEvent, setTriggerEndCallEvent] = useState(true);
  const triggerEndCallEventRef = useRef(triggerEndCallEvent);
  const dispatchContext = useContext(DispatchContext);
  const {setLayout} = useLayout();
  const {pinnedUids} = useLiveStreamDataContext();

  // Initialize pinnedUidsRef with the current pinnedUids
  const pinnedUidsRef = React.useRef<UidType[]>(pinnedUids || []);
  const pendingPinRef = React.useRef<{pinUID: UidType; action: string} | null>(
    null,
  );

  // Declare hooks first
  const {enableAudioButton, disableAudioButton} = useLocalAudio();
  const {enableVideoButton, disableVideoButton} = useLocalVideo();
  const {data} = useRoomInfo();
  const isHost = data?.isHost ?? false;
  const [pinnedForAllUid, setPinnedForAllUid] = useState<UidType | null>(null);
  const {pinForEveryone, unPinForEveryone} = useUserActionMenu();

  // Define event handlers
  const disableMicHandler = useCallback(
    ({payload}: {payload: string}) => {
      try {
        if (isHost) {
          return;
        }
        const data = JSON.parse(payload);
        if (data && data === true) {
          disableAudioButton();
        } else {
          enableAudioButton();
        }
      } catch (error) {
        console.log('debugging error on DISABLE_ATTENDEE_MIC listener ');
      }
    },
    [isHost, disableAudioButton, enableAudioButton],
  );

  const disableVideoHandler = useCallback(
    ({payload}: {payload: string}) => {
      try {
        if (isHost) {
          return;
        }
        const data = JSON.parse(payload);
        if (data && data === true) {
          disableVideoButton();
        } else {
          enableVideoButton();
        }
      } catch (error) {
        console.log('debugging error on DISABLE_ATTENDEE_VIDEO listener ');
      }
    },
    [isHost, disableVideoButton, enableVideoButton],
  );

  const pinForEveryoneHandler = useCallback(
    ({payload}: {payload: string}) => {
      // console.log('PIN_FOR_EVERYONE event received with payload:', payload);
      try {
        const data = JSON.parse(payload);
        // console.log('Parsed PIN_FOR_EVERYONE data:', data);

        if (!data || typeof data !== 'object') {
          throw new Error('Invalid payload format');
        }

        if (data.uidType !== 'rtc') {
          // console.log('Skipping non-rtc uidType:', data.uidType);
          return;
        }

        const pinUID = data.pinForAllUid;
        const action = data.action;

        // console.log('Processing pin action:', {pinUID, action});

        if (!pinUID && action !== 'unpin') {
          throw new Error('Missing required fields: pinUID or action');
        }

        // Update local state first
        setPinnedForAllUid(pinUID);

        // Then update the global pin state and layout
        if (action === 'pin' && pinUID) {
          // console.log('Pinning user for everyone:', pinUID);
          // Pin for everyone
          pinForEveryone(pinUID);
          // Update layout for all users
          if (dispatchContext?.dispatch) {
            dispatchContext.dispatch({
              type: 'UserPin',
              value: [pinUID],
            });
            setLayout(getPinnedLayoutName());
          }
        } else if (action === 'unpin') {
          console.log('Unpinning user for everyone');
          // Unpin for everyone
          unPinForEveryone();
          // Update layout for all users
          if (dispatchContext?.dispatch) {
            dispatchContext.dispatch({
              type: 'UserPin',
              value: [0],
            });
            setLayout(getPinnedLayoutName());
          }
        }
      } catch (error) {
        console.error('Error in PIN_FOR_EVERYONE handler:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
          payload,
        });
      }
    },
    [pinForEveryone, unPinForEveryone, dispatchContext, setLayout],
  );

  // Register event listeners
  useEffect(() => {
    // console.log('Registering PIN_FOR_EVERYONE event listener');
    customEvents.on('DISABLE_ATTENDEE_MIC', disableMicHandler);
    customEvents.on('DISABLE_ATTENDEE_VIDEO', disableVideoHandler);
    customEvents.on('PIN_FOR_EVERYONE', pinForEveryoneHandler);

    return () => {
      // console.log('Unregistering PIN_FOR_EVERYONE event listener');
      customEvents.off('DISABLE_ATTENDEE_MIC', disableMicHandler);
      customEvents.off('DISABLE_ATTENDEE_VIDEO', disableVideoHandler);
      customEvents.off('PIN_FOR_EVERYONE', pinForEveryoneHandler);
    };
  }, [disableMicHandler, disableVideoHandler, pinForEveryoneHandler]);

  useEffect(() => {
    triggerEndCallEventRef.current = triggerEndCallEvent;
  }, [triggerEndCallEvent]);

  useEffect(() => {
    if (pinnedUids) {
      pinnedUidsRef.current = pinnedUids;
      // If we have a pending pin action and now have pinned users, try to process it
      if (pendingPinRef.current && pinnedUids.length > 0) {
        const {pinUID, action} = pendingPinRef.current;
        if (pinnedUids.includes(pinUID)) {
          // Update local state first
          setPinnedForAllUid(pinUID);

          // Then update the global pin state and layout
          if (action === 'pin' && pinUID) {
            // Pin for everyone
            pinForEveryone(pinUID);
            // Update layout for all users
            if (dispatchContext?.dispatch) {
              dispatchContext.dispatch({
                type: 'UserPin',
                value: [pinUID],
              });
              setLayout(getPinnedLayoutName());
            }
          } else if (action === 'unpin') {
            // Unpin for everyone
            unPinForEveryone();
            // Update layout for all users - switch back to default layout
            if (dispatchContext?.dispatch) {
              dispatchContext.dispatch({
                type: 'UserPin',
                value: [0],
              });
              // When unpinning, switch back to default layout instead of pinned layout
              setLayout('grid'); // Use default grid layout
            }
          }
          pendingPinRef.current = null;
        }
      }
    }
  }, [
    pinnedUids,
    pinForEveryone,
    unPinForEveryone,
    dispatchContext,
    setLayout,
  ]);

  return (
    <CustomWrapperContext.Provider
      value={{
        triggerEndCallEvent,
        setTriggerEndCallEvent,
        triggerEndCallEventRef,
        pinnedForAllUid,
        setPinnedForAllUid,
      }}>
      <PinProvider>{props.children}</PinProvider>
    </CustomWrapperContext.Provider>
  );
};

export {CustomWrapperProvider, CustomWrapperContext};

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
} from 'react';

import AgoraAppBuilder, {
  useUserBan,
  customEvents,
  useLocalAudio,
  useLocalVideo,
  useRoomInfo,
  UidType,
  useUserActionMenu,
  useWhiteboard,
  useContent,
} from '@appbuilder/react';

import {PinProvider} from './PinContext';

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
  const {activeUids} = useContent();

  useEffect(() => {
    triggerEndCallEventRef.current = triggerEndCallEvent;
  }, [triggerEndCallEvent]);

  const {enableAudioButton, disableAudioButton} = useLocalAudio();
  const {enableVideoButton, disableVideoButton} = useLocalVideo();
  const {data} = useRoomInfo();
  const isHost = data?.isHost ?? false;

  const [pinnedForAllUid, setPinnedForAllUid] = useState<UidType | null>(null);
  const {pinForEveryone, unPinForEveryone} = useUserActionMenu();
  const {getWhiteboardUid} = useWhiteboard();

  const activeUidsRef = React.useRef(activeUids);
  useEffect(() => {
    activeUidsRef.current = activeUids;
  }, [activeUids]);

  // override default host controls
  useEffect(() => {
    /**
     * custom event listener for disable attendee mic
     * Here we can call disableAudioButton/enableAudioButton function to update participant mic button state
     */
    customEvents.on('DISABLE_ATTENDEE_MIC', ({payload}) => {
      try {
        //host side we don't disable the button so ignoring it
        if (isHost) {
          return;
        }
        //attendee only disable the mic button
        const data = JSON.parse(payload);
        if (data && data === true) {
          disableAudioButton();
        } else {
          enableAudioButton();
        }
      } catch (error) {
        console.log('debugging error on DISABLE_ATTENDEE_MIC listener ');
      }
    });
    customEvents.on('DISABLE_ATTENDEE_VIDEO', ({payload}) => {
      try {
        //host side we don't disable the button so ignoring it
        if (isHost) {
          return;
        }
        //attendee only disable the mic button
        const data = JSON.parse(payload);
        if (data && data === true) {
          disableVideoButton();
        } else {
          enableVideoButton();
        }
      } catch (error) {
        console.log('debugging error on DISABLE_ATTENDEE_VIDEO listener ');
      }
    });

    /**
     * Custom event listener for PIN_FOR_EVERYONE
     * @param {Object} payload - The payload data sent with the event.
     */

    customEvents.on('PIN_FOR_EVERYONE', ({payload}) => {
      try {
        const data = JSON.parse(payload);
        const pinUID =
          data.uidType === 'whiteboard' && data.pinForAllUid
            ? getWhiteboardUid() // each user has diff whiteboard uid
            : data.pinForAllUid;

        if (!activeUidsRef.current.includes(pinUID) && pinUID) {
          // prevent pinning if the user is not in the active UIDs list for ex banned user
          return;
        }
        setPinnedForAllUid(pinUID);
        if (pinUID) {
          pinForEveryone(pinUID);
        } else {
          unPinForEveryone();
        }
      } catch (error) {
        console.log('debugging error on PIN_FOR_EVERYONE listener ');
      }
    });

    return () => {
      customEvents.off('DISABLE_ATTENDEE_MIC', () => {});
      customEvents.off('DISABLE_ATTENDEE_VIDEO', () => {});
      customEvents.off('PIN_FOR_EVERYONE', () => {});
    };
  }, []);

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

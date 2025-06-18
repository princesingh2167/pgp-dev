/**
 * PinContext.tsx
 *
 * Enhances the user action menu by adding a "Pin for everyone" option and customizing
 * the "Remove from room" action to ban users.
 * Allows users to pin a participant for all users or remove them from the session.
 * Manages pinning state via context and sends custom events for global updates.
 */
import React, {useContext, useEffect} from 'react';
import {
  UserActionMenuItem,
  useContent,
  useRoomInfo,
  useLocalUid,
  UidType,
} from 'customization-api';
import {CustomWrapperContext} from './CustomWrapper';
import {PersistanceLevel} from '../../rtm-events-api/types';
import useUserBan from '../../utils/useUserBan';
import {customEvents} from '../../../customization-api/customEvents';
import {useUserActionMenu} from '../../components/useUserActionMenu';

export interface PinContextInterface {
  isPinned: boolean;
  pinForEveryone: (uid: UidType) => void;
  unPinForEveryone: () => void;
}

const PinContext = React.createContext<PinContextInterface>({
  isPinned: false,
  pinForEveryone: () => {},
  unPinForEveryone: () => {},
});

interface PinProviderProps {
  children: React.ReactNode;
}

const PinForEveryone = ({
  closeActionMenu,
  targetUid,
  targetUidType,
}: {
  closeActionMenu?: () => void;
  targetUid: UidType;
  targetUidType: string;
}) => {
  const {pinnedForAllUid, setPinnedForAllUid} =
    useContext(CustomWrapperContext);
  const {pinForEveryone, unPinForEveryone} = useUserActionMenu();
  const {activeUids} = useContent();
  const isPinned = pinnedForAllUid === targetUid;
  const isOnlyOneActive = activeUids?.length === 1;

  return (
    <UserActionMenuItem
      label={isPinned ? 'Unpin for everyone' : 'Pin for everyone'}
      icon={isPinned ? 'unpin-outlined' : 'pin-outlined'}
      iconColor={'yellow'}
      textColor={'yellow'}
      disabled={isOnlyOneActive}
      onPress={() => {
        const newPinnedUid = pinnedForAllUid === targetUid ? null : targetUid;

        customEvents.send(
          'PIN_FOR_EVERYONE',
          JSON.stringify({
            pinForAllUid: newPinnedUid,
            uidType: targetUidType,
            action: newPinnedUid ? 'pin' : 'unpin',
          }),
          PersistanceLevel.Session,
        );

        // Update local state
        setPinnedForAllUid(newPinnedUid);

        // Update pin state for local user
        if (newPinnedUid) {
          pinForEveryone(newPinnedUid);
        } else {
          unPinForEveryone();
        }

        closeActionMenu?.();
      }}
    />
  );
};

const PinProvider = (props: PinProviderProps) => {
  const {updateUserActionMenuItems} = useUserActionMenu();
  const banUser = useUserBan();
  const {activeUids} = useContent();
  const {pinnedForAllUid} = useContext(CustomWrapperContext);
  const {pinForEveryone, unPinForEveryone} = useUserActionMenu();
  const {
    data: {isHost},
  } = useRoomInfo();

  // Memoize the menu items configuration
  const menuItemsConfig = React.useMemo(
    () => ({
      'remove-from-room': {
        order: 1,
        hide: false,
        onAction: (uid: UidType, hostMeetingId: string) => {
          if (uid) {
            banUser({uid: uid, duration: 1440, hostMeetingId});
          }
        },
      },
      'pin-for-everyone': {
        component: PinForEveryone,
        order: 0,
        disabled: activeUids?.length === 1,
        visibility: ['host-remote', 'host-self'],
      },
    }),
    [activeUids?.length, banUser],
  );

  // Update menu items only when config changes
  useEffect(() => {
    updateUserActionMenuItems(menuItemsConfig);
  }, [menuItemsConfig, updateUserActionMenuItems]);

  return (
    <PinContext.Provider
      value={{
        isPinned: !!pinnedForAllUid,
        pinForEveryone,
        unPinForEveryone,
      }}>
      {props.children}
    </PinContext.Provider>
  );
};

export {PinProvider, PinContext};

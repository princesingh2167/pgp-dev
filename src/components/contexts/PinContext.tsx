/**
 * PinContext.tsx
 *
 * Enhances the user action menu by adding a "Pin for everyone" option and customizing
 * the "Remove from room" action to ban users.
 * Allows hosts to pin a participant for all users or remove them from the session.
 * Manages pinning state via context and sends custom events for global updates.
 */
import React, {useContext, useEffect, useState} from 'react';
import {
  // useUserActionMenu,
  //   UidType,
  UserActionMenuItem,
  // useUserBan,
  // customEvents,
  //   PersistanceLevel,
  useContent,
} from '@appbuilder/react';

import {CustomWrapperContext} from './CustomWrapper';
import {UidType} from '../../../index.rsdk';
import {PersistanceLevel} from '../../rtm-events-api/types';
import useUserBan from '../../utils/useUserBan';
import {customEvents} from '../../../customization-api/customEvents';
import {useUserActionMenu} from '../../components/useUserActionMenu';

export interface PinContextInterface {}

const PinContext = React.createContext<PinContextInterface>({});

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
  const {activeUids, pinnedUid} = useContent();

  const isPinned = pinnedForAllUid === targetUid;
  return (
    <UserActionMenuItem
      label={isPinned ? 'Unpin for everyone' : 'Pin for everyone'}
      icon={isPinned ? 'unpin-outlined' : 'pin-outlined'}
      iconColor={'yellow'}
      textColor={'yellow'}
      disabled={activeUids.length === 1}
      onPress={() => {
        const newPinnedUid = pinnedForAllUid === targetUid ? null : targetUid;

        customEvents.send(
          'PIN_FOR_EVERYONE',
          JSON.stringify({
            pinForAllUid: newPinnedUid,
            uidType: targetUidType,
          }),
          PersistanceLevel.Session,
        );

        // Update local state
        setPinnedForAllUid(newPinnedUid);

        // pinned for local user
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
  useEffect(() => {
    const updateActions = async () => {
      // updated user action menu items
      updateUserActionMenuItems({
        'remove-from-room': {
          order: 1,
          hide: false,
          onAction: (uid, hostMeetingId) => {
            console.log('Remove from room for uid:', uid);
            if (uid) {
              banUser({uid: uid, duration: 1440, hostMeetingId});
            }
          },
        },
        'pin-for-everyone': {
          component: PinForEveryone,
          order: 0,
          disabled: activeUids.length == 1,
          visibility: ['host-remote', 'host-self'],
        },
      });
    };
    updateActions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUids]);
  return <PinContext.Provider value={{}}>{props.children}</PinContext.Provider>;
};

export {PinProvider, PinContext};

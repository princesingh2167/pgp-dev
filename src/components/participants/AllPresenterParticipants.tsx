import React, {useContext, useEffect, useState} from 'react';
import {Text} from 'react-native';
import chatContext from '../ChatContext';
import {useString} from '../../utils/useString';
import {
  ContentInterface,
  UidType,
  useRoomInfo,
  useContent,
} from 'customization-api';
import Participant from './Participant';
import {useLiveStreamDataContext} from '../contexts/LiveStreamDataContext';
import {useScreenContext} from '../contexts/ScreenShareContext';
import ScreenshareParticipants from './ScreenshareParticipants';
import hexadecimalTransparency from '../../utils/hexadecimalTransparency';
import {videoRoomUserFallbackText} from '../../language/default-labels/videoCallScreenLabels';

const AllPresenterParticipants = (props: any) => {
  const {screenShareData} = useScreenContext();
  const {
    uids,
    isMobile = false,
    handleClose,
    updateActionSheet,
    emptyMessage,
  } = props;

  const {defaultContent} = useContent();
  const {localUid} = useContext(chatContext);
  const remoteUserDefaultLabel = useString(videoRoomUserFallbackText)();

  const {
    data: {isHost},
  } = useRoomInfo();
  const {hostUids} = useLiveStreamDataContext();

  // 🔹 State to hold fetched names
  const [localNames, setLocalNames] = useState<{uid: number; name: string}[]>(
    [],
  );

  // 🔹 Fetch user names from API
  useEffect(() => {
    const fetchUserNames = async () => {
      try {
        const response = await fetch(
          'https://ugkznimh5b.ap-south-1.awsapprunner.com/users/by-role?roleName=AR%20Manager',
        );
        const data = await response.json();

        // Assuming Agora UIDs are mapped to some backend user IDs
        // For now, we’ll just simulate mapping to uid for demo purposes
        const mappedUsers = data.map((user: any) => ({
          uid: user.id, // Replace this with actual mapping logic if available
          name: user.name,
        }));

        setLocalNames(mappedUsers);
      } catch (error) {
        console.error('Error fetching AR Manager users:', error);
      }
    };

    fetchUserNames();
  }, []);

  // 🔹 Helper to get participant name
  const getParticipantName = (uid: UidType) => {
    const localNameEntry = localNames.find(item => item.uid === uid);
    return (
      defaultContent[uid]?.name ||
      localNameEntry?.name ||
      remoteUserDefaultLabel
    );
  };

  const renderScreenShare = (user: ContentInterface) => {
    if (screenShareData[user.screenUid]?.isActive) {
      return (
        <ScreenshareParticipants
          user={defaultContent[user.screenUid]}
          key={user.screenUid}
        />
      );
    } else {
      return <></>;
    }
  };

  return (
    <>
      {uids.length == 0 ? (
        emptyMessage ? (
          <Text
            style={{
              alignSelf: 'center',
              paddingVertical: 20,
              fontFamily: 'Source Sans Pro',
              fontWeight: '400',
              fontSize: 14,
              color: $config.FONT_COLOR + hexadecimalTransparency['40%'],
            }}>
            {emptyMessage}
          </Text>
        ) : (
          <></>
        )
      ) : (
        <>
          {/* Local participant */}
          {uids.includes(localUid) && (
            <>
              <Participant
                isLocal={true}
                name={getParticipantName(localUid)}
                user={defaultContent[localUid]}
                isAudienceUser={
                  $config.EVENT_MODE && hostUids.indexOf(localUid) !== -1
                    ? false
                    : true
                }
                showControls={
                  (defaultContent[localUid]?.type === 'rtc' && isHost) ||
                  (defaultContent[localUid]?.type === 'rtc' &&
                    $config.EVENT_MODE &&
                    hostUids.indexOf(localUid) !== -1)
                }
                isHostUser={false}
                key={localUid}
                isMobile={isMobile}
                handleClose={handleClose}
                updateActionSheet={updateActionSheet}
              />
              {renderScreenShare(defaultContent[localUid])}
            </>
          )}

          {/* Other participants */}
          {uids
            .filter(uid => uid !== localUid)
            .map((uid: any) => (
              <React.Fragment key={uid}>
                <Participant
                  isLocal={false}
                  name={getParticipantName(uid)}
                  user={defaultContent[uid]}
                  showControls={defaultContent[uid]?.type === 'rtc' && isHost}
                  isAudienceUser={true}
                  isHostUser={false}
                  isMobile={isMobile}
                  handleClose={handleClose}
                  updateActionSheet={updateActionSheet}
                />
                {renderScreenShare(defaultContent[uid])}
              </React.Fragment>
            ))}
        </>
      )}
    </>
  );
};

export default AllPresenterParticipants;

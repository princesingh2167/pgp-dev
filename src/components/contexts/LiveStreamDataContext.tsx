import {UidType} from '../../../agora-rn-uikit';
import React, {
  createContext,
  useState,
  useContext,
  useReducer,
  useEffect,
} from 'react';
import {createHook} from 'customization-implementation';
import LiveStreamContext, {
  raiseHandListInterface,
} from '../../components/livestream';
import {ClientRoleType, useLocalUid} from '../../../agora-rn-uikit';
import {filterObject} from '../../utils';
import {useContent} from 'customization-api';

export interface LiveStreamDataObjectInterface {
  [key: number]: {
    role: number;
    raised: boolean;
    ts: number;
  };
}
export interface LiveStreamDataContextInterface {
  hostUids: UidType[];
  audienceUids: UidType[];
  arUids: UidType[];
  liveStreamData: raiseHandListInterface;
  pinnedUids: UidType[];
}
const LiveStreamDataContext = createContext<LiveStreamDataContextInterface>({
  hostUids: [],
  audienceUids: [],
  arUids: [],
  liveStreamData: {},
  pinnedUids: [],
});

interface ScreenShareProviderProps {
  children: React.ReactNode;
}
const LiveStreamDataProvider = (props: ScreenShareProviderProps) => {
  const {defaultContent, activeUids} = useContent();
  const {raiseHandList} = useContext(LiveStreamContext);
  const [hostUids, setHostUids] = useState<UidType[]>([]);
  const [audienceUids, setAudienceUids] = useState<UidType[]>([]);
  const [arUids, setARUids] = useState<UidType[]>([]);
  const [pinnedUids, setPinnedUids] = useState<UidType[]>([]);
  console.log(activeUids, 'defaultContent');
  useEffect(() => {
    if (activeUids) {
      setPinnedUids(activeUids);
      console.log('Updated pinnedUids:', {
        activeUids,
        pinnedUids: activeUids,
        timestamp: new Date().toISOString(),
      });
    }
  }, [activeUids]);
  React.useEffect(() => {
    if (Object.keys(defaultContent).length !== 0) {
      const hostList = filterObject(
        defaultContent,
        ([k, v]) =>
          (v?.type === 'rtc' || v?.type === 'live') && //||
          //(v?.type === 'screenshare' && v?.video == 1)
          (raiseHandList[k]
            ? raiseHandList[k]?.role == ClientRoleType.ClientRoleBroadcaster
            : true) &&
          !v?.offline &&
          activeUids.indexOf(v?.uid) !== -1,
      );
      const audienceList = filterObject(
        defaultContent,
        ([k, v]) =>
          (v?.type === 'rtc' || v?.type === 'live') &&
          raiseHandList[k]?.role == ClientRoleType.ClientRoleAudience &&
          !v.offline,
      );

      const arAdminList = filterObject(
        defaultContent,
        ([k, v]) =>
          (v?.type === '' || v?.type === '') &&
          raiseHandList[k]?.role !== ClientRoleType.ClientRoleARAdmin &&
          !v.offline,
      );

      const hUids = Object.keys(hostList).map(uid => parseInt(uid));
      const aUids = Object.keys(audienceList).map(uid => parseInt(uid));
      const aRUids = Object.keys(arAdminList).map(uid => parseInt(uid));
      console.log('arUids', aRUids);
      setHostUids(hUids);
      setAudienceUids(aUids);
      setARUids(aRUids);
    }
  }, [defaultContent, raiseHandList]);

  return (
    <LiveStreamDataContext.Provider
      value={{
        liveStreamData: raiseHandList,
        hostUids: hostUids,
        audienceUids,
        arUids,
        pinnedUids,
      }}>
      {props.children}
    </LiveStreamDataContext.Provider>
  );
};
const useLiveStreamDataContext = createHook(LiveStreamDataContext);

export {useLiveStreamDataContext, LiveStreamDataProvider};

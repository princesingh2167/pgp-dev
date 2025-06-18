/********************************************
 Copyright © 2021 Agora Lab, Inc., all rights reserved.
*********************************************/

import React, {useState, useLayoutEffect} from 'react';
import AppWrapper from './AppWrapper';
import {
  RoomInfoContextInterface,
  RoomInfoDefaultValue,
  RoomInfoProvider,
} from './components/room-info/useRoomInfo';
import {SetRoomInfoProvider} from './components/room-info/useSetRoomInfo';
import {ShareLinkProvider} from './components/useShareLink';
import AppRoutes from './AppRoutes';
import {isWebInternal} from './utils/common';
import {CustomWrapperProvider} from './components/contexts/CustomWrapper';

declare global {
  interface Navigator {
    notifyReady?: () => boolean;
  }
}

const App: React.FC = () => {
  const notifyReady = () => {
    if (typeof window.navigator.notifyReady === 'function') {
      console.log('recording-bot: notifyReady is available');
      window.navigator.notifyReady();
    } else {
      console.log('recording-bot: notifyReady is un-available');
    }
  };

  useLayoutEffect(() => {
    if (isWebInternal()) {
      window.addEventListener('load', notifyReady);
    }
    return () => {
      if (isWebInternal()) {
        window.removeEventListener('load', notifyReady);
      }
    };
  }, []);

  // Explicitly set loginToken: null to avoid expired token problems
  const [roomInfo, setRoomInfo] = useState<RoomInfoContextInterface>({
    ...RoomInfoDefaultValue,
    loginToken: null,
  });

  return (
    <AppWrapper>
      <SetRoomInfoProvider value={{setRoomInfo}}>
        <RoomInfoProvider value={{...roomInfo}}>
          <CustomWrapperProvider>
            <ShareLinkProvider>
              <AppRoutes />
            </ShareLinkProvider>
          </CustomWrapperProvider>
        </RoomInfoProvider>
      </SetRoomInfoProvider>
    </AppWrapper>
  );
};

export default App;

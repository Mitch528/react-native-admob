import { NativeModules, NativeEventEmitter } from 'react-native';

import { createErrorFromErrorData } from './utils';

type AdMobServerSideVerifiationOptions = {
  userId: string;
  customRewardString: string;
};

type AdMobRewarded = {
  setAdUnitID: (unitId: string) => void;
  setServerSideVerificationOptions: (options: AdMobServerSideVerifiationOptions) => void;
  requestAd: () => Promise<void>;
  showAd: () => Promise<void>;
};

const RNAdMobRewarded = NativeModules.RNAdMobRewarded;

const eventEmitter = new NativeEventEmitter(RNAdMobRewarded);

const eventMap = {
  adLoaded: 'rewardedVideoAdLoaded',
  adFailedToLoad: 'rewardedVideoAdFailedToLoad',
  adFailedToShow: 'rewardedVideoAdFailedToShow',
  adOpened: 'rewardedVideoAdOpened',
  adClosed: 'rewardedVideoAdClosed',
  rewarded: 'rewardedVideoAdRewarded'
};

const _subscriptions = new Map();

const addEventListener = (event, handler) => {
  const mappedEvent = eventMap[event];
  if (mappedEvent) {
    let listener;
    if (event === 'adFailedToLoad') {
      listener = eventEmitter.addListener(mappedEvent, (error) =>
        handler(createErrorFromErrorData(error))
      );
    } else {
      listener = eventEmitter.addListener(mappedEvent, handler);
    }
    _subscriptions.set(handler, listener);
    return {
      remove: () => removeEventListener(event, handler),
    };
  } else {
    // eslint-disable-next-line no-console
    console.warn(`Trying to subscribe to unknown event: "${event}"`);
    return {
      remove: () => { },
    };
  }
};

const removeEventListener = (type, handler) => {
  const listener = _subscriptions.get(handler);
  if (!listener) {
    return;
  }
  listener.remove();
  _subscriptions.delete(handler);
};

const removeAllListeners = () => {
  _subscriptions.forEach((listener, key, map) => {
    listener.remove();
    map.delete(key);
  });
};

export default {
  ...RNAdMobRewarded as AdMobRewarded,
  addEventListener,
  removeEventListener,
  removeAllListeners,
  simulatorId: 'SIMULATOR',
};

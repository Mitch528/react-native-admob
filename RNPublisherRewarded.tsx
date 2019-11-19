import { NativeModules, NativeEventEmitter } from 'react-native';

import { createErrorFromErrorData } from './utils';

type PublisherServerSideVerifiationOptions = {
  userId: string;
  customRewardString: string;
};

type PublisherRewarded = {
  setAdUnitID: (unitId: string) => void;
  setServerSideVerificationOptions: (options: PublisherServerSideVerifiationOptions) => void;
  requestAd: () => Promise<void>;
  showAd: () => Promise<void>;
};

const RNPublisherRewarded = NativeModules.RNPublisherRewarded;

const eventEmitter = new NativeEventEmitter(RNPublisherRewarded);

const eventMap = {
  adLoaded: 'rewardedVideoAdLoaded',
  adFailedToLoad: 'rewardedVideoAdFailedToLoad',
  adFailedToShow: 'rewardedVideoAdFailedToShow',
  adOpened: 'rewardedVideoAdOpened',
  adClosed: 'rewardedVideoAdClosed',
  rewarded: 'rewardedVideoAdRewarded'
};

type EventHandler = (evt) => void;
type EventListener = {
  remove: () => void;
};

const _subscriptions = new Map<EventHandler, EventListener>();

const addEventListener = (event: string, handler: EventHandler): EventListener => {
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

const removeEventListener = (type: string, handler: EventHandler) => {
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
  ...RNPublisherRewarded as PublisherRewarded,
  addEventListener,
  removeEventListener,
  removeAllListeners,
  simulatorId: 'SIMULATOR',
};

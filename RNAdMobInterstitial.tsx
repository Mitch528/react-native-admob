import { NativeEventEmitter, NativeModules } from 'react-native';
import { createErrorFromErrorData } from './utils';

const RNAdMobInterstitial = NativeModules.RNAdMobInterstitial;

const eventEmitter = new NativeEventEmitter(RNAdMobInterstitial);

const eventMap = {
  adLoaded: 'interstitialAdLoaded',
  adFailedToLoad: 'interstitialAdFailedToLoad',
  adOpened: 'interstitialAdOpened',
  adClosed: 'interstitialAdClosed',
  adLeftApplication: 'interstitialAdLeftApplication',
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
  ...RNAdMobInterstitial,
  addEventListener,
  removeEventListener,
  removeAllListeners,
  simulatorId: 'SIMULATOR',
};

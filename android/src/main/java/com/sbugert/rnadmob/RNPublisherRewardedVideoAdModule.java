package com.sbugert.rnadmob;

import android.os.Handler;
import android.os.Looper;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableNativeArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.ads.doubleclick.PublisherAdRequest;
import com.google.android.gms.ads.rewarded.RewardItem;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdCallback;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import com.google.android.gms.ads.rewarded.ServerSideVerificationOptions;

import java.util.ArrayList;
import java.util.HashMap;

public class RNPublisherRewardedVideoAdModule extends ReactContextBaseJavaModule {

  public static final String REACT_CLASS = "RNPublisherRewarded";

  public static final String EVENT_AD_LOADED = "rewardedVideoAdLoaded";
  public static final String EVENT_AD_FAILED_TO_LOAD = "rewardedVideoAdFailedToLoad";
  public static final String EVENT_AD_FAILED_TO_SHOW = "rewardedVideoAdFailedToShow";
  public static final String EVENT_AD_OPENED = "rewardedVideoAdOpened";
  public static final String EVENT_AD_CLOSED = "rewardedVideoAdClosed";
  public static final String EVENT_REWARDED = "rewardedVideoAdRewarded";

  RewardedAd mRewardedAd;
  String adUnitID;
  String[] testDevices;
  HashMap serverSideVerificationOptions;

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  public RNPublisherRewardedVideoAdModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  private void sendEvent(String eventName, @Nullable WritableMap params) {
    getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
  }

  @ReactMethod
  public void setAdUnitID(String adUnitID) {
    this.adUnitID = adUnitID;
  }

  @ReactMethod
  public void setTestDevices(ReadableArray testDevices) {
    ReadableNativeArray nativeArray = (ReadableNativeArray) testDevices;
    ArrayList<Object> list = nativeArray.toArrayList();
    this.testDevices = list.toArray(new String[list.size()]);
  }

  @ReactMethod
  public void setServerSideVerificationOptions(ReadableMap options) {
    if (options != null) {
      this.serverSideVerificationOptions = options.toHashMap();
    } else {
      this.serverSideVerificationOptions = null;
    }
  }

  @ReactMethod
  public void requestAd(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run() {
        mRewardedAd = new RewardedAd(getCurrentActivity(), adUnitID);

        if (serverSideVerificationOptions != null) {
          ServerSideVerificationOptions.Builder ssvBuilder = new ServerSideVerificationOptions.Builder();

          if (serverSideVerificationOptions.containsKey("customRewardString")) {
            ssvBuilder.setCustomData((String) serverSideVerificationOptions.get("customRewardString"));
          }
          if (serverSideVerificationOptions.containsKey("userId")) {
            ssvBuilder.setUserId((String) serverSideVerificationOptions.get("userId"));
          }

          mRewardedAd.setServerSideVerificationOptions(ssvBuilder.build());
        }

        RewardedAdLoadCallback adLoadCallback = new RewardedAdLoadCallback() {
          @Override
          public void onRewardedAdLoaded() {
            sendEvent(EVENT_AD_LOADED, null);
            promise.resolve(null);
          }

          @Override
          public void onRewardedAdFailedToLoad(int errorCode) {
            String errorString = "ERROR_UNKNOWN";
            String errorMessage = "Unknown error";
            switch (errorCode) {
              case PublisherAdRequest.ERROR_CODE_INTERNAL_ERROR:
                errorString = "ERROR_CODE_INTERNAL_ERROR";
                errorMessage = "Internal error, an invalid response was received from the ad server.";
                break;
              case PublisherAdRequest.ERROR_CODE_INVALID_REQUEST:
                errorString = "ERROR_CODE_INVALID_REQUEST";
                errorMessage = "Invalid ad request, possibly an incorrect ad unit ID was given.";
                break;
              case PublisherAdRequest.ERROR_CODE_NETWORK_ERROR:
                errorString = "ERROR_CODE_NETWORK_ERROR";
                errorMessage = "The ad request was unsuccessful due to network connectivity.";
                break;
              case PublisherAdRequest.ERROR_CODE_NO_FILL:
                errorString = "ERROR_CODE_NO_FILL";
                errorMessage = "The ad request was successful, but no ad was returned due to lack of ad inventory.";
                break;
            }

            WritableMap event = Arguments.createMap();
            WritableMap error = Arguments.createMap();
            event.putString("message", errorMessage);
            sendEvent(EVENT_AD_FAILED_TO_LOAD, event);

            promise.reject(errorString, errorMessage);
          }
        };

        if (mRewardedAd.isLoaded()) {
          promise.reject("E_AD_ALREADY_LOADED", "Ad is already loaded.");
        } else {
          PublisherAdRequest.Builder adRequestBuilder = new PublisherAdRequest.Builder();

          if (testDevices != null) {
            for (int i = 0; i < testDevices.length; i++) {
              String testDevice = testDevices[i];
              if (testDevice == "SIMULATOR") {
                testDevice = PublisherAdRequest.DEVICE_ID_EMULATOR;
              }
              adRequestBuilder.addTestDevice(testDevice);
            }
          }

          PublisherAdRequest adRequest = adRequestBuilder.build();
          mRewardedAd.loadAd(adRequest, adLoadCallback);
        }
      }
    });
  }

  @ReactMethod
  public void showAd(final Promise promise) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run() {
        if (mRewardedAd != null && mRewardedAd.isLoaded()) {
          RewardedAdCallback adCallback = new RewardedAdCallback() {
            @Override
            public void onRewardedAdOpened() {
              sendEvent(EVENT_AD_OPENED, null);
            }

            @Override
            public void onRewardedAdClosed() {
              sendEvent(EVENT_AD_CLOSED, null);
            }

            @Override
            public void onUserEarnedReward(@NonNull RewardItem rewardItem) {
              WritableMap reward = Arguments.createMap();

              reward.putInt("amount", rewardItem.getAmount());
              reward.putString("type", rewardItem.getType());

              sendEvent(EVENT_REWARDED, reward);
            }

            @Override
            public void onRewardedAdFailedToShow(int errorCode) {
              sendEvent(EVENT_AD_FAILED_TO_SHOW, null);
            }
          };

          mRewardedAd.show(getCurrentActivity(), adCallback);
          promise.resolve(null);
        } else {
          promise.reject("E_AD_NOT_READY", "Ad is not ready.");
        }
      }
    });
  }

  @ReactMethod
  public void isReady(final Callback callback) {
    new Handler(Looper.getMainLooper()).post(new Runnable() {
      @Override
      public void run() {
        if (mRewardedAd != null) {
          callback.invoke(mRewardedAd.isLoaded());
        } else {
          callback.invoke(false);
        }
      }
    });
  }
}

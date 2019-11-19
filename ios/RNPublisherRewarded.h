#if __has_include(<React/RCTBridgeModule.h>)
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#else
#import "RCTBridgeModule.h"
#import "RCTEventEmitter.h"
#endif

@import GoogleMobileAds;

@interface RNPublisherRewarded : RCTEventEmitter <RCTBridgeModule, GADRewardedAdDelegate>

@property(nonatomic, strong) GADRewardedAd *rewardedAd;

@end


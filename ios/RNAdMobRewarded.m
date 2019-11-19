#import "RNAdMobRewarded.h"
#import "RNAdMobUtils.h"

#if __has_include(<React/RCTUtils.h>)
#import <React/RCTUtils.h>
#else
#import "RCTUtils.h"
#endif

static NSString *const kEventAdLoaded = @"rewardedVideoAdLoaded";
static NSString *const kEventAdFailedToLoad = @"rewardedVideoAdFailedToLoad";
static NSString *const kEventAdOpened = @"rewardedVideoAdOpened";
static NSString *const kEventAdClosed = @"rewardedVideoAdClosed";
static NSString *const kEventRewarded = @"rewardedVideoAdRewarded";

@implementation RNAdMobRewarded
{
    NSString *_adUnitID;
    NSArray *_testDevices;
    NSDictionary *_serverSideVerificationOptions;
    BOOL hasListeners;
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents
{
    return @[
             kEventRewarded,
             kEventAdLoaded,
             kEventAdFailedToLoad,
             kEventAdOpened
    ];
}

#pragma mark exported methods

RCT_EXPORT_METHOD(setAdUnitID:(NSString *)adUnitID)
{
    _adUnitID = adUnitID;
}

RCT_EXPORT_METHOD(setTestDevices:(NSArray *)testDevices)
{
    _testDevices = RNAdMobProcessTestDevices(testDevices, kGADSimulatorID);
}

RCT_EXPORT_METHOD(setServerSideVerificationOptions:(NSDictionary *)options)
{
    _serverSideVerificationOptions = options;
}

RCT_EXPORT_METHOD(requestAd:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    self.rewardedAd = [[GADRewardedAd alloc]
         initWithAdUnitID:_adUnitID];
    
    if (_serverSideVerificationOptions != nil) {
        GADServerSideVerificationOptions *options = [[GADServerSideVerificationOptions alloc] init];
        
        options.customRewardString = [_serverSideVerificationOptions objectForKey:@"customRewardString"];
        options.userIdentifier = [_serverSideVerificationOptions objectForKey:@"userId"];
    
        self.rewardedAd.serverSideVerificationOptions = options;
    }
    
    GADRequest *request = [GADRequest request];
    [self.rewardedAd loadRequest:request completionHandler:^(GADRequestError * _Nullable error) {
      if (error) {
          reject(@"E_AD_REQUEST_ERROR", @"Ad request error.", error);
      } else {
          resolve(nil);
      }
    }];
}

RCT_EXPORT_METHOD(showAd:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
    if (self.rewardedAd.isReady) {
        UIWindow *keyWindow = [[UIApplication sharedApplication] keyWindow];
        UIViewController *rootViewController = [keyWindow rootViewController];
        [self.rewardedAd presentFromRootViewController:rootViewController delegate:self];
        
        resolve(nil);
    } else {
        reject(@"E_AD_NOT_READY", @"Ad is not ready.", nil);
    }
}

RCT_EXPORT_METHOD(isReady:(RCTResponseSenderBlock)callback)
{
    callback(@[[NSNumber numberWithBool:[[GADRewardBasedVideoAd sharedInstance] isReady]]]);
}

- (void)startObserving
{
    hasListeners = YES;
}

- (void)stopObserving
{
    hasListeners = NO;
}

#pragma mark GADRewardBasedVideoAdDelegate

- (void)rewardedAd:(GADRewardedAd *)rewardedAd userDidEarnReward:(GADAdReward *)reward {
    if (hasListeners) {
        [self sendEventWithName:kEventRewarded body:@{@"type": reward.type, @"amount": reward.amount}];
    }
}

/// Tells the delegate that the rewarded ad was presented.
- (void)rewardedAdDidPresent:(GADRewardedAd *)rewardedAd {
    if (hasListeners) {
        [self sendEventWithName:kEventAdOpened body:nil];
    }
}

/// Tells the delegate that the rewarded ad failed to present.
- (void)rewardedAd:(GADRewardedAd *)rewardedAd didFailToPresentWithError:(NSError *)error {
    if (hasListeners) {
        NSDictionary *jsError = RCTJSErrorFromCodeMessageAndNSError(@"E_AD_FAILED_TO_LOAD", error.localizedDescription, error);
        [self sendEventWithName:kEventAdFailedToLoad body:jsError];
    }
}

/// Tells the delegate that the rewarded ad was dismissed.
- (void)rewardedAdDidDismiss:(GADRewardedAd *)rewardedAd {
    if (hasListeners) {
        [self sendEventWithName:kEventAdClosed body:nil];
    }
}

@end

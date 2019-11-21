#import "RCTConvert+GADAdSize.h"
#import "RNAdMobUtils.h"

@implementation RCTConvert (GADAdSize)

+ (GADAdSize)GADAdSize:(id)json
{
    NSString *adSize = [self NSString:json];
    
    return getAdSizeFromString(adSize);
}

@end

#import <React/RCTBridgeModule.h>

/*
  The bridge declaration for `SentinelSecrets.swift`. The JS name is the
  selector up to its first colon, so `setSecret:value:...` exports `setSecret`.
*/
@interface RCT_EXTERN_MODULE (SentinelSecrets, NSObject)

RCT_EXTERN_METHOD(setSecret
                  : (NSString *)key value
                  : (NSString *)value resolver
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getSecret
                  : (NSString *)key resolver
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(removeSecret
                  : (NSString *)key resolver
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject)

@end

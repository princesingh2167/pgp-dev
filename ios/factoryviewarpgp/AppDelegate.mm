#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>
#import <TrustKit/TrustKit.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    NSString *hostName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"HostName"];
    NSString *mainPublicKey = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"MainPublicKey"];
    NSString *backupPublicKey = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"BackupPublicKey"];
  // Initialize TrustKit for SSL pinning
     NSDictionary *trustKitConfig =
     @{
         kTSKSwizzleNetworkDelegates: @YES,
         kTSKPinnedDomains: @{
            hostName : @{
                 kTSKIncludeSubdomains: @YES,
                 kTSKEnforcePinning: @YES,
                 kTSKDisableDefaultReportUri: @YES,
                 kTSKPublicKeyHashes : @[
                     mainPublicKey,   
                     backupPublicKey,    
                 ],
             },
         }
     };
     [TrustKit initSharedInstanceWithConfiguration:trustKitConfig];
  
  self.moduleName = @"factoryviewarpgp";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

- (BOOL)application:(UIApplication *)application
   openURL:(NSURL *)url
   options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity
 restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler
{
 return [RCTLinkingManager application:application
                  continueUserActivity:userActivity
                    restorationHandler:restorationHandler];
}

@end

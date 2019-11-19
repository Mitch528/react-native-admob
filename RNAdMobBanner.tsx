import React from 'react';
import {
  findNodeHandle,
  requireNativeComponent,
  UIManager,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { createErrorFromErrorData } from './utils';

export type AdMobBannerProps = {
  adSize: string;
  adUnitID: string;
  testDevices?: string[];
  onSizeChange?: ({ width, height }: { width: number, height: number }) => void;
  onAdLoaded?: () => void;
  onAdClosed?: () => void;
  onAdFailedToLoad?: (error: string) => void;
  onAdLeftApplication?: () => void;
  onAppEvent?: (evt) => void;
} & ViewProps;

type AdMobBannerState = {
  style: ViewStyle;
};

class AdMobBanner extends React.Component<AdMobBannerProps, AdMobBannerState> {
  static simulatorId = "SIMUALTOR";

  _bannerView!: View;

  constructor(props) {
    super(props);

    this.handleSizeChange = this.handleSizeChange.bind(this);
    this.handleAdFailedToLoad = this.handleAdFailedToLoad.bind(this);
    this.state = {
      style: {},
    };
  }

  componentDidMount() {
    this.loadBanner();
  }

  loadBanner() {
    UIManager.dispatchViewManagerCommand(
      findNodeHandle(this._bannerView),
      UIManager.getViewManagerConfig('RNGADBannerView').Commands.loadBanner,
      undefined
    );
  }

  handleSizeChange(event) {
    const { height, width } = event.nativeEvent;
    this.setState({ style: { width, height } });
    if (this.props.onSizeChange) {
      this.props.onSizeChange({ width, height });
    }
  }

  handleAdFailedToLoad(event) {
    if (this.props.onAdFailedToLoad) {
      this.props.onAdFailedToLoad(
        createErrorFromErrorData(event.nativeEvent.error)
      );
    }
  }

  render() {
    return (
      <RNGADBannerView
        {...this.props}
        style={[this.props.style, this.state.style]}
        onSizeChange={this.handleSizeChange}
        onAdFailedToLoad={this.handleAdFailedToLoad}
        ref={(el) => this._bannerView = el}
      />
    );
  }
}

const RNGADBannerView = (requireNativeComponent as any)('RNGADBannerView', AdMobBanner);

export default AdMobBanner;

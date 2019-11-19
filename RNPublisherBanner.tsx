import React from 'react';
import {
  findNodeHandle,
  requireNativeComponent,
  UIManager,
  View,
  ViewStyle,
  ViewProps
} from 'react-native';
import { createErrorFromErrorData } from './utils';

export type AdMobPublisherBannerProps = {
  adSize: string;
  adUnitID: string;
  validAdSizes?: string[];
  testDevices?: string[];
  onSizeChange?: ({ width, height }: { width: number, height: number }) => void;
  onAdLoaded?: () => void;
  onAdClosed?: () => void;
  onAdFailedToLoad?: (error: string) => void;
  onAdLeftApplication?: () => void;
  onAppEvent?: (evt) => void;
} & ViewProps;

type AdMobPublisherBannerState = {
  style: ViewStyle;
};

class PublisherBanner extends React.Component<AdMobPublisherBannerProps, AdMobPublisherBannerState> {
  static simulatorId = "SIMUALTOR";

  _bannerView!: View;

  constructor(props) {
    super(props);
    this.handleSizeChange = this.handleSizeChange.bind(this);
    this.handleAppEvent = this.handleAppEvent.bind(this);
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
      UIManager.getViewManagerConfig('RNDFPBannerView').Commands.loadBanner,
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

  handleAppEvent(event) {
    if (this.props.onAppEvent) {
      const { name, info } = event.nativeEvent;
      this.props.onAppEvent({ name, info });
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
      <RNDFPBannerView
        {...this.props}
        style={[this.props.style, this.state.style]}
        onSizeChange={this.handleSizeChange}
        onAdFailedToLoad={this.handleAdFailedToLoad}
        onAppEvent={this.handleAppEvent}
        ref={(el) => this._bannerView = el}
      />
    );
  }
}

const RNDFPBannerView = (requireNativeComponent as any)(
  'RNDFPBannerView',
  PublisherBanner
);

export default PublisherBanner;

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableNativeFeedback,
  Dimensions,
  Image,
  ActivityIndicator,
  Keyboard,
  Modal,
  ToastAndroid,
  BackHandler,
  Alert,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {WebView} from 'react-native-webview';

const width = Dimensions.get('window').width;

// keeps the reference to the browser
let browserRef = null;

// initial url for the browser
const url = 'https://www.google.com';

// functions to search using different engines
const searchEngines = {
  google: uri => `https://www.google.com/search?q=${uri}`,
  duckduckgo: uri => `https://duckduckgo.com/?q=${uri}`,
  bing: uri => `https://www.bing.com/search?q=${uri}`,
};

// upgrade the url to make it easier for the user:
//
// https://www.facebook.com => https://www.facebook.com
// facebook.com => https://www.facebook.com
// facebook => https://www.google.com/search?q=facebook
function upgradeURL(uri, searchEngine = 'google') {
  const isURL = uri.split(' ').length === 1 && uri.includes('.');
  if (isURL) {
    if (!uri.startsWith('http')) {
      return 'https://www.' + uri;
    }
    return uri;
  }
  // search for the text in the search engine
  const encodedURI = encodeURI(uri);
  console.log('ini uri sudah di encode = ' + encodedURI);
  return searchEngines[searchEngine](encodedURI);
}

// javascript to inject into the window
const injectedJavaScript = `
      window.ReactNativeWebView.postMessage('injected javascript works!');
      true; // note: this is required, or you'll sometimes get silent failures   
`;
class Browser extends React.Component {
  state = {
    currentURL: url,
    urlText: url,
    title: '',
    canGoForward: false,
    canGoBack: false,
    incognito: false,
    exitModal: false,
    // change configurations so the user can
    // better control the browser
    config: {
      detectorTypes: 'all',
      allowStorage: true,
      allowJavascript: true,
      allowCookies: true,
      allowLocation: true,
      allowCaching: true,
      defaultSearchEngine: 'google',
    },
  };
  componentDidMount() {
    BackHandler.addEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  componentWillUnmount() {
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.handleBackButtonClick,
    );
  }

  handleBackButtonClick() {
    Alert.alert(
      'Exit App ',
      'Are you sure to exit app ?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {text: 'OK', onPress: () => BackHandler.exitApp()},
      ],
      {cancelable: false},
    );
    return true;
  }
  closeApp = () => {
    Alert.alert(
      'Exit App ',
      'Are you sure to exit app ?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {text: 'OK', onPress: () => BackHandler.exitApp()},
      ],
      {cancelable: false},
    );
    return true;
  };

  // load the url from the text input
  loadURL = () => {
    const {config, urlText} = this.state;
    const {defaultSearchEngine} = config;
    const newURL = upgradeURL(urlText, defaultSearchEngine);

    this.setState({
      currentURL: newURL,
      urlText: newURL,
    });
    Keyboard.dismiss();
  };

  // update the text input
  updateUrlText = text => {
    this.setState({
      urlText: text,
    });
  };

  // go to the next page
  goForward = () => {
    if (browserRef && this.state.canGoForward) {
      browserRef.goForward();
    }
  };

  // go back to the last page
  goBack = () => {
    if (browserRef && this.state.canGoBack) {
      browserRef.goBack();
    }
  };

  // reload the page
  reload = () => {
    if (browserRef) {
      browserRef.reload();
    }
  };

  // set the reference for the browser
  setBrowserRef = browser => {
    console.log(`ini browwser ref = ${browser}`);
    if (!browserRef) {
      browserRef = browser;
    }
  };

  // called when there is an error in the browser
  onBrowserError = syntheticEvent => {
    const {nativeEvent} = syntheticEvent;
    console.warn('WebView error: ', nativeEvent);
  };

  // called when the webview is loaded
  onBrowserLoad = syntheticEvent => {
    const {canGoForward, canGoBack, title} = syntheticEvent.nativeEvent;
    console.log(syntheticEvent.nativeEvent);
    this.setState({
      canGoForward,
      canGoBack,
      title,
    });
  };

  // called when the navigation state changes (page load)
  onNavigationStateChange = navState => {
    const {canGoForward, canGoBack, title} = navState;
    this.setState({
      canGoForward,
      canGoBack,
      title,
    });
  };

  // can prevent requests from fulfilling, good to log requests
  // or filter ads and adult content.
  filterRequest = request => {
    return true;
  };

  // called when the browser sends a message using "window.ReactNativeWebView.postMessage"
  onBrowserMessage = event => {
    console.log('*'.repeat(10));
    console.log('Got message from the browser:', event.nativeEvent.data);
    console.log('*'.repeat(10));
  };
  render() {
    const {state} = this;
    console.log(config);
    const {
      currentURL,
      urlText,
      canGoForward,
      canGoBack,
      exitModal,
      config,
    } = state;
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="rgb(225,0,0)" barStyle="light-content" />
        <Modal
          visible={exitModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => this.setState({exitModal: false})}>
          <TouchableOpacity
            activeOpacity={1}
            delayPressIn={10}
            style={styles.exitModalContainer}
            onPress={() => this.setState({exitModal: false})}>
            <TouchableNativeFeedback onPress={() => this.closeApp()}>
              <View style={styles.buttonExitModal}>
                <Icon name="close" size={20} color="white" />
                <Text style={styles.textButtonExitModal}>Exit app</Text>
              </View>
            </TouchableNativeFeedback>
          </TouchableOpacity>
        </Modal>
        <View style={styles.wrapHeader}>
          <Text style={styles.textHeader}>Alpha Browser</Text>
        </View>
        <View style={styles.wrapSearch}>
          <View style={styles.boxSearch}>
            <TextInput
              style={styles.searchInput}
              value={urlText}
              placeholder="Pencarian"
              onChangeText={text => this.setState({urlText: text})}
            />
            <View style={styles.boxButton}>
              <TouchableOpacity
                activeOpacity={0.3}
                delayPressIn={10}
                onPress={() => this.loadURL()}>
                <Icon name="search" size={25} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <WebView
          style={styles.webView}
          ref={this.setBrowserRef}
          originWhitelist={['https://*']}
          source={{uri: currentURL}}
          onLoad={this.onBrowserLoad}
          onError={this.onBrowserError}
          onNavigationStateChange={this.onNavigationStateChange}
          renderLoading={() => (
            <Modal
              visible={true}
              transparent={true}
              animationType="slide"
              onRequestClose={() =>
                ToastAndroid.show(
                  'Tunggu proses selesai',
                  ToastAndroid.SHORT,
                  ToastAndroid.CENTER,
                )
              }>
              <View style={styles.modalLoadingContainer}>
                <View style={styles.boxModalLoading}>
                  <ActivityIndicator size="large" color="rgb(200,0,0)" />
                  <Text style={styles.textLoading}>Loading...</Text>
                </View>
              </View>
            </Modal>
          )}
          onShouldStartLoadWithRequest={this.filterRequest}
          onMessage={this.onBrowserMessage}
          dataDetectorTypes={config.detectorTypes}
          thirdPartyCookiesEnabled={config.allowCookies}
          domStorageEnabled={config.allowStorage}
          javaScriptEnabled={config.allowJavascript}
          geolocationEnabled={config.allowLocation}
          cacheEnabled={config.allowCaching}
          injectedJavaScript={injectedJavaScript}
        />
        <View style={styles.navbarWrap}>
          <View style={styles.boxNavbar}>
            <TouchableOpacity
              activeOpacity={0.3}
              delayPressIn={10}
              onPress={() => this.goBack()}>
              <Icon
                name="arrow-left"
                size={25}
                color="white"
                style={canGoBack ? {} : styles.disable}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.boxNavbar}>
            <TouchableOpacity
              activeOpacity={0.3}
              delayPressIn={10}
              onPress={() => this.reload()}>
              <Icon name="refresh" size={25} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.boxNavbar}>
            <TouchableOpacity
              activeOpacity={0.3}
              delayPressIn={10}
              onPress={() => this.goForward()}>
              <Icon
                name="arrow-right"
                size={25}
                color="white"
                style={canGoForward ? {} : styles.disable}
              />
            </TouchableOpacity>
          </View>
          <View style={{...styles.boxNavbar, backgroundColor: 'rgb(150,0,0)'}}>
            <TouchableOpacity
              activeOpacity={0.3}
              delayPressIn={10}
              onPress={() => this.setState({exitModal: true})}>
              <Image
                source={require('../../assets/images/logoPlankWhite.png')}
                style={styles.ImageTinyLogo}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}
export default Browser;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  disable: {
    opacity: 0.3,
  },
  exitModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingBottom: 60,
    paddingRight: 10,
  },
  buttonExitModal: {
    height: 40,
    width: 110,
    backgroundColor: 'rgb(200,0,0)',
    borderRadius: 5,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  textButtonExitModal: {
    marginLeft: 10,
    color: 'white',
  },
  wrapHeader: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(200,0,0)',
    padding: 10,
    elevation: 5,
  },
  textHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  wrapSearch: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 10,
    backgroundColor: 'rgb(200,0,0)',
    elevation: 5,
  },
  boxSearch: {
    flexDirection: 'row',
    width: '90%',
  },
  searchInput: {
    height: 40,
    width: '85%',
    backgroundColor: 'white',
    padding: 5,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
  },
  boxButton: {
    height: 40,
    width: '15%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  webView: {
    flex: 1,
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boxModalLoading: {
    height: 100,
    width: 100,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textLoading: {
    marginTop: 5,
    color: 'grey',
  },
  navbarWrap: {
    height: 50,
    width: '100%',
    backgroundColor: 'rgb(200,0,0)',
    flexDirection: 'row',
  },
  boxNavbar: {
    height: '100%',
    width: width / 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ImageTinyLogo: {
    height: 25,
    width: 25,
    resizeMode: 'contain',
  },
});

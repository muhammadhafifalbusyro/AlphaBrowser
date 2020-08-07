import React from 'react';
import {View, Image, StyleSheet, StatusBar} from 'react-native';
import Spinner from 'react-native-spinkit';

class SplashScreen extends React.Component {
  componentDidMount = () => {
    // Remember the timer handle
    this.timerHandle = setTimeout(() => {
      this.props.navigation.replace('Browser');
      this.timerHandle = 0;
    }, 4000);
  };
  componentWillUnmount = () => {
    // Is our timer running?
    if (this.timerHandle) {
      // Yes, clear it
      clearTimeout(this.timerHandle);
      this.timerHandle = 0;
    }
  };
  render() {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor="rgb(225,0,0)" barStyle="light-content" />
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
        />
        <Spinner
          visible={true}
          type="Wave"
          color="white"
          style={styles.spinner}
        />
      </View>
    );
  }
}
export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(200,0,0)',
  },
  logo: {
    resizeMode: 'contain',
    height: 110,
    width: 130,
  },
  spinner: {
    marginTop: 10,
  },
});

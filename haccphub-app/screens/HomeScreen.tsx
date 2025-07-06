import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';

export default function HomeScreen({ navigation }: { navigation: any }) {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <Text style={[styles.name, isDarkMode && styles.darkName]}>
          HACCP Hub
        </Text>
        <Text style={[styles.subtitle, isDarkMode && styles.darkSubtitle]}>
          Welcome to HACCP Hub
        </Text>
        <TouchableOpacity
          style={[styles.loginButton, isDarkMode && styles.darkLoginButton]}
          onPress={() => navigation.navigate('MonitoringHome')}
        >
          <Text style={[styles.loginButtonText, isDarkMode && styles.darkLoginButtonText]}>Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  name: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
  darkName: {
    color: '#ecf0f1',
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 32,
  },
  darkSubtitle: {
    color: '#bdc3c7',
  },
  loginButton: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    elevation: 2,
    marginTop: 12,
  },
  darkLoginButton: {
    backgroundColor: '#0056b3',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  darkLoginButtonText: {
    color: '#fff',
  },
}); 
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Text, Title, Provider as PaperProvider, ActivityIndicator } from 'react-native-paper';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export default function PhoneLogin({ navigation }: { navigation: any }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        if (!name || !companyName || !email || !password) {
          setError('Please fill all fields.');
          setLoading(false);
          return;
        }
        // Register user
        const userCredential = await auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        const companyCode = uuidv4().slice(0, 8);
        // Save user details to Firestore
        await firestore().collection('companies').doc(companyCode).collection('users').doc(user.uid).set({
          uid: user.uid,
          email,
          name,
          companyCode,
          role: 'owner',
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
        // Save company details to Firestore
        await firestore().collection('companies').doc(companyCode).set({
          name: companyName,
          createdAt: firestore.FieldValue.serverTimestamp(),
          owner: user.uid,
        });
      } else {
        if (!email || !password) {
          setError('Please enter email and password.');
          setLoading(false);
          return;
        }
        // Login user
        await auth().signInWithEmailAndPassword(email, password);
      }
      // Success: you can navigate or reset form here
      setLoading(false);
      navigation.replace('MonitoringHome');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <Title style={styles.title}>{isRegister ? 'Register' : 'Login'}</Title>
        {isRegister && (
          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            mode="outlined"
          />
        )}
        {isRegister && (
          <TextInput
            label="Company Name"
            value={companyName}
            onChangeText={setCompanyName}
            style={styles.input}
            mode="outlined"
          />
        )}
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          mode="outlined"
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? (
          <ActivityIndicator animating={true} style={{ marginVertical: 16 }} />
        ) : (
          <Button mode="contained" onPress={handleSubmit} style={styles.button}>
            {isRegister ? 'Register' : 'Login'}
          </Button>
        )}
        <Button mode="text" onPress={() => setIsRegister(r => !r)}>
          {isRegister ? 'Already have an account? Login' : 'No account? Register'}
        </Button>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 24,
  },
  input: {
    width: 300,
    marginBottom: 16,
  },
  button: {
    width: 300,
    marginTop: 8,
    marginBottom: 8,
  },
  error: {
    color: 'red',
    marginBottom: 8,
    textAlign: 'center',
  },
}); 
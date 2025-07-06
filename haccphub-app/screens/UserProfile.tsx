import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';

export default function UserProfile() {
  // Example user data (replace with real data as needed)
  const user = {
    name: 'Rahul Moradiya',
    role: 'Admin',
    email: 'rahul@example.com',
    profilePic: 'https://randomuser.me/api/portraits/men/75.jpg',
  };

  const handleLogout = () => {
    // Add logout logic here
    Alert.alert('Logged out!');
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: user.profilePic }} style={styles.avatar} />
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.role}>{user.role}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007bff',
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  role: {
    fontSize: 18,
    color: '#007bff',
    marginBottom: 4,
    fontWeight: '600',
  },
  email: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 16,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
}); 
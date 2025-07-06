import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Platform, Animated } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function UserTasks() {
  const [tasks, setTasks] = useState<{ text: string; date: Date }[]>([]);
  const [taskText, setTaskText] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const addTask = () => {
    if (taskText.trim() !== '') {
      setTasks([{ text: taskText, date }, ...tasks]);
      setTaskText('');
    }
  };

  const renderItem = ({ item }: { item: { text: string; date: Date } }) => (
    <View style={styles.taskItem}>
      <Text style={styles.taskText}>{item.text}</Text>
      <Text style={styles.taskDate}>{item.date.toDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}> 
      <Text style={styles.title}>Task Manager</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.calendarButton}>
        <Text style={styles.calendarButtonText}>Select Date: {date.toDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
        />
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task"
          value={taskText}
          onChangeText={setTaskText}
        />
        <TouchableOpacity style={styles.addButton} onPress={addTask}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={tasks}
        keyExtractor={(_, idx) => idx.toString()}
          renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.emptyText}>No tasks yet.</Text>}
        style={{ width: '100%' }}
      />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    minWidth: 320,
    width: '100%',
    maxWidth: 500,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
  },
  calendarButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  calendarButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    padding: 10,
    backgroundColor: '#f4f4f4',
    fontSize: 16,
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskItem: {
    backgroundColor: '#f1f3f6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    width: '100%',
  },
  taskText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  taskDate: {
    fontSize: 14,
    color: '#888',
    marginLeft: 12,
  },
  emptyText: {
    color: '#aaa',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 32,
  },
}); 
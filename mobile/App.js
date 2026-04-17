import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  Alert,
  Dimensions
} from 'react-native';
import RecordScreen from 'react-native-record-screen';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const timerRef = useRef(null);
  const viewShotRef = useRef();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      // Start recording
      const res = await RecordScreen.startRecording().catch(error => {
        Alert.alert('Error', 'Could not start recording: ' + error.message);
      });

      if (res === 'started') {
        setIsRecording(true);
        setTimer(0);
        timerRef.current = setInterval(() => {
          setTimer(prev => prev + 1);
        }, 1000);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Screen recording is not supported in the standard Expo Go app. You will need to build a Dev Client to use this feature.');
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    clearInterval(timerRef.current);
    
    const res = await RecordScreen.stopRecording().catch(error => {
      console.warn(error);
    });

    if (res) {
      // res.result.outputURL is the path to the video
      Alert.alert(
        'Recording Saved', 
        'Recording stopped successfully!',
        [
          { text: 'Share Video', onPress: () => Sharing.shareAsync(res.result.outputURL) },
          { text: 'OK' }
        ]
      );
    }
  };

  const takeSnapshot = async () => {
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert('Error', 'Failed to take snapshot');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ViewShot ref={viewShotRef} style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <View style={styles.header}>
          <Text style={styles.logoText}>RECify Mobile</Text>
          <View style={[styles.statusBadge, isRecording && styles.statusBadgeActive]}>
            <Text style={styles.statusText}>{isRecording ? 'RECORDING' : 'IDLE'}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
            <Text style={styles.subText}>
              {isRecording ? 'Recording your screen...' : 'Ready to capture.'}
            </Text>
          </View>

          <View style={styles.controls}>
            {!isRecording ? (
              <TouchableOpacity style={styles.mainButton} onPress={startRecording}>
                <View style={styles.recordCircle} />
                <Text style={styles.buttonText}>Start Recording</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.mainButton, styles.stopButton]} onPress={stopRecording}>
                <View style={styles.stopSquare} />
                <Text style={styles.buttonText}>Stop Recording</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={[styles.secondaryButton, !isRecording && styles.disabledButton]} 
              onPress={takeSnapshot}
              disabled={!isRecording}
            >
              <Text style={styles.secondaryButtonText}>Take Snapshot</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Simple Screen & Image Recorder</Text>
        </View>
      </ViewShot>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statusBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeActive: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  timerContainer: {
    alignItems: center,
    marginBottom: 60,
  },
  timerText: {
    color: '#fff',
    fontSize: 72,
    fontWeight: '200',
    fontFamily: 'System',
  },
  subText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 10,
  },
  controls: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  mainButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: center,
    justifyContent: 'center',
    width: width * 0.8,
    height: 64,
    borderRadius: 32,
    gap: 12,
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  recordCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  stopSquare: {
    width: 18,
    height: 18,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#1e293b',
    width: width * 0.8,
    height: 56,
    borderRadius: 28,
    alignItems: center,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.3,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 12,
  }
});

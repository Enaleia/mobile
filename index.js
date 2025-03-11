// Polyfill for Buffer
import { Buffer } from 'buffer'
global.Buffer = Buffer

// Polyfill for crypto.getRandomValues
import 'react-native-get-random-values'

// Run the app
import 'expo-router/entry'
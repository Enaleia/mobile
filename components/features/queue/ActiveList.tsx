import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQueue } from '@/contexts/QueueContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { QueueItem } from '@/types/queue';
import { QueueItemCard } from '../QueueItemCard';

const PROCESSING_CHECK_INTERVAL = 5000; // Check every 5 seconds

export const ActiveList: React.FC = () => {
  const { queueItems, processQueueItems, isProcessing } = useQueue();
  const network = useNetwork();
  const isOnline = network.isConnected && network.isInternetReachable;

  // Process items periodically when online
  useEffect(() => {
    if (!isOnline) return;

    // Initial processing
    processQueueItems();

    // Set up periodic processing
    const interval = setInterval(() => {
      processQueueItems();
    }, PROCESSING_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [isOnline, processQueueItems]);

  // Filter active items (not deleted)
  const activeItems = queueItems.filter(item => !item.deleted);

  if (!isOnline) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>You are currently offline. Queue processing will resume when you're back online.</Text>
      </View>
    );
  }

  if (!activeItems.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>No items in queue</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isProcessing && (
        <Text style={styles.processingMessage}>Processing queue items...</Text>
      )}
      {activeItems.map((item: QueueItem) => (
        <QueueItemCard key={item.localId} item={item} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  message: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  processingMessage: {
    textAlign: 'center',
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 16,
  },
}); 
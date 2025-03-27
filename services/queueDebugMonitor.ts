import { QueueItem, QueueItemStatus, ServiceStatus, PROCESSING_TIMEOUT, MAX_RETRIES_PER_BATCH, RETRY_COOLDOWN, MAX_RETRY_AGE, MAX_TOTAL_RETRIES } from "@/types/queue";
import { filterQueueItems } from "@/utils/queue";

interface QueueMetrics {
  totalItems: number;
  activeItems: number;
  stuckItems: number;
  failedItems: number;
  completedItems: number;
  averageProcessingTime: number;
  retryStats: {
    attempts: number;
    manualRetries: number;
  };
}

export class QueueDebugMonitor {
  private static instance: QueueDebugMonitor;
  private debugEnabled: boolean = true;
  private lastMetrics: QueueMetrics | null = null;
  private lastNotificationTime: { [key: string]: number } = {};
  private NOTIFICATION_COOLDOWN = 5 * 60 * 1000; // 5 minutes
  private itemTimings: { [key: string]: { [key: string]: number } } = {};

  private constructor() {}

  static getInstance(): QueueDebugMonitor {
    if (!QueueDebugMonitor.instance) {
      QueueDebugMonitor.instance = new QueueDebugMonitor();
    }
    return QueueDebugMonitor.instance;
  }

  enableDebug(enabled: boolean = true) {
    this.debugEnabled = enabled;
  }

  disableDebug() {
    this.debugEnabled = false;
  }

  log(message: string, data?: any) {
    if (this.debugEnabled) {
      console.log(`[QueueMonitor] ${message}`, data ? data : '');
    }
  }

  private isItemStuck(item: QueueItem): boolean {
    return Boolean(
      item.status === QueueItemStatus.PROCESSING &&
      item.lastAttempt &&
      Date.now() - new Date(item.lastAttempt).getTime() > PROCESSING_TIMEOUT
    );
  }

  private getRetryInfo(item: QueueItem) {
    const now = new Date();
    const lastAttempt = item.lastAttempt ? new Date(item.lastAttempt) : null;
    const timeSinceLastAttempt = lastAttempt ? 
      `${Math.round((now.getTime() - lastAttempt.getTime()) / 1000)}s` : 
      'N/A';
    
    return {
      retryCount: item.retryCount || 0,
      maxRetriesPerBatch: MAX_RETRIES_PER_BATCH,
      maxTotalRetries: MAX_TOTAL_RETRIES,
      timeSinceLastAttempt
    };
  }

  private calculateMetrics(items: QueueItem[]): QueueMetrics {
    const now = Date.now();
    let totalProcessingTime = 0;
    let completedCount = 0;

    const metrics = items.reduce((acc, item) => {
      // Count total items
      acc.totalItems++;

      // Count by status
      if (item.status === QueueItemStatus.PROCESSING) {
        acc.activeItems++;
      } else if (item.status === QueueItemStatus.FAILED) {
        acc.failedItems++;
      } else if (item.status === QueueItemStatus.COMPLETED) {
        acc.completedItems++;
        // Calculate processing time for completed items
        if (item.lastAttempt) {
          const processingTime = new Date(item.lastAttempt).getTime() - new Date(item.date).getTime();
          totalProcessingTime += processingTime;
          completedCount++;
        }
      }

      // Check for stuck items
      if (this.isItemStuck(item)) {
        acc.stuckItems++;
      }

      // Track retry stats
      if (item.retryCount && item.retryCount > 0) {
        acc.retryStats.attempts++;
      }

      return acc;
    }, {
      totalItems: 0,
      activeItems: 0,
      stuckItems: 0,
      failedItems: 0,
      completedItems: 0,
      averageProcessingTime: 0,
      retryStats: {
        attempts: 0,
        manualRetries: 0
      }
    });

    // Calculate average processing time
    metrics.averageProcessingTime = completedCount > 0 ? 
      Math.round(totalProcessingTime / completedCount / 1000) : 0;

    return metrics;
  }

  logQueueMetrics(items: QueueItem[]) {
    const currentMetrics = this.calculateMetrics(items);

    // Only log if metrics have changed
    if (!this.lastMetrics || 
        JSON.stringify(this.lastMetrics) !== JSON.stringify(currentMetrics)) {
      
      this.log(`Queue Stats:
  Total: ${currentMetrics.totalItems}
  Active: ${currentMetrics.activeItems}
  Stuck: ${currentMetrics.stuckItems}
  Failed: ${currentMetrics.failedItems}
  Completed: ${currentMetrics.completedItems}
  Avg Processing: ${currentMetrics.averageProcessingTime}s
  Retries: ${currentMetrics.retryStats.attempts} attempts, ${currentMetrics.retryStats.manualRetries} manual`);
      
      this.lastMetrics = currentMetrics;
    }
  }

  logItemStateChange(item: QueueItem, updates: Partial<QueueItem>) {
    const oldStatus = item.status;
    const newStatus = updates.status || item.status;
    
    // Only log state changes that are relevant to retries or stuck items
    if (newStatus === QueueItemStatus.PROCESSING || 
        newStatus === QueueItemStatus.FAILED) {
      const retryInfo = this.getRetryInfo(item);
      this.log(`[${item.localId}] ${oldStatus} → ${newStatus} | Attempt #${retryInfo.retryCount}/${retryInfo.maxRetriesPerBatch}`);
    }
  }

  logProcessingStart(item: QueueItem) {
    const retryInfo = this.getRetryInfo(item);
    this.log(`[${item.localId}] Processing | Attempt #${retryInfo.retryCount}/${retryInfo.maxRetriesPerBatch}`);
  }

  logProcessingComplete(item: QueueItem, success: boolean, error?: string) {
    const duration = item.lastAttempt ? 
      `${Math.round((Date.now() - new Date(item.lastAttempt).getTime()) / 1000)}s` : 
      'unknown';
    
    const retryInfo = this.getRetryInfo(item);
    this.log(`${success ? '✓' : '✗'} [${item.localId}] ${duration} | Attempt #${retryInfo.retryCount}/${retryInfo.maxRetriesPerBatch}${error ? ` | ${error}` : ''}`);
  }

  logRetryAttempt(item: QueueItem, service?: "directus" | "eas", isManual: boolean = false) {
    const retryInfo = this.getRetryInfo(item);
    const timings = this.getTimingInfo(item);
    const serviceIndicator = service ? `[${service}]` : '';
    
    // Calculate total cycle time if available
    let cycleTime = '';
    if (timings.pendingStarted && timings.processingStarted && timings.failedStarted) {
      const totalCycle = Date.now() - timings.pendingStarted;
      cycleTime = `\n    Cycle time (Pending→Process→Fail→Retry): ${this.formatDuration(timings.pendingStarted)}`;
    }

    if (isManual && this.lastMetrics) {
      this.lastMetrics.retryStats.manualRetries++;
    }
    
    this.log(`${isManual ? '🔄' : '↻'} Retry Attempt [${item.localId}] ${serviceIndicator}
    Attempt: #${retryInfo.retryCount}/${retryInfo.maxRetriesPerBatch} per batch, ${retryInfo.retryCount}/${retryInfo.maxTotalRetries} total
    Time since last attempt: ${retryInfo.timeSinceLastAttempt}
    Services: [Directus: ${item.directus?.status || 'N/A'}] [EAS: ${item.eas?.status || 'N/A'}]${cycleTime}`);
  }

  logStuckItem(item: QueueItem) {
    const retryInfo = this.getRetryInfo(item);
    this.log(`⚠️ [${item.localId}] Stuck | Attempt #${retryInfo.retryCount}/${retryInfo.maxRetriesPerBatch} per batch, ${retryInfo.retryCount}/${retryInfo.maxTotalRetries} total | ${retryInfo.timeSinceLastAttempt} since last attempt`);
  }

  logNetworkStatus(isConnected: boolean, isInternetReachable: boolean) {
    this.log(`Network: ${isConnected ? '✓' : '✗'} Connected | ${isInternetReachable ? '✓' : '✗'} Internet`);
  }

  private getTimingInfo(item: QueueItem) {
    if (!this.itemTimings[item.localId]) {
      this.itemTimings[item.localId] = {};
    }
    return this.itemTimings[item.localId];
  }

  private formatDuration(startTime: number, endTime: number = Date.now()): string {
    const duration = endTime - startTime;
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(2)}s`;
    return `${(duration / 60000).toFixed(2)}m`;
  }

  logStateTransition(item: QueueItem, newStatus: QueueItemStatus) {
    const timings = this.getTimingInfo(item);
    const now = Date.now();
    const retryInfo = this.getRetryInfo(item);

    // Record timing for the state transition
    timings[`${item.status}_to_${newStatus}`] = now;

    let timingInfo = '';
    
    // Calculate durations based on state transitions
    if (newStatus === QueueItemStatus.PROCESSING && item.status === QueueItemStatus.PENDING) {
      timings.pendingStarted = timings.pendingStarted || now;
      timingInfo = `Pending duration: ${this.formatDuration(timings.pendingStarted, now)}`;
    }
    else if (newStatus === QueueItemStatus.FAILED && item.status === QueueItemStatus.PROCESSING) {
      timings.processingStarted = timings.processingStarted || timings[`PENDING_to_PROCESSING`];
      timingInfo = `Processing duration: ${this.formatDuration(timings.processingStarted, now)}`;
    }
    else if (newStatus === QueueItemStatus.PENDING && item.status === QueueItemStatus.FAILED) {
      timings.failedStarted = timings.failedStarted || timings[`PROCESSING_to_FAILED`];
      timingInfo = `Failed duration: ${this.formatDuration(timings.failedStarted, now)}`;
    }

    this.log(`State Transition [${item.localId}] ${item.status} → ${newStatus}
    Attempt: #${retryInfo.retryCount}/${retryInfo.maxRetriesPerBatch} per batch, ${retryInfo.retryCount}/${retryInfo.maxTotalRetries} total
    ${timingInfo}
    Last attempt: ${retryInfo.timeSinceLastAttempt} ago
    Services: [Directus: ${item.directus?.status || 'N/A'}] [EAS: ${item.eas?.status || 'N/A'}]`);
  }

  logRetryEligibilityCheck(item: QueueItem, isEligible: boolean, reason: string) {
    const retryInfo = this.getRetryInfo(item);
    
    this.log(`Retry Eligibility Check [${item.localId}]
    Result: ${isEligible ? '✓ Eligible' : '✗ Not eligible'}
    Reason: ${reason}
    Attempt: #${retryInfo.retryCount}/${retryInfo.maxRetriesPerBatch} per batch, ${retryInfo.retryCount}/${retryInfo.maxTotalRetries} total
    Time since failure: ${item.lastAttempt ? this.formatDuration(new Date(item.lastAttempt).getTime()) : 'N/A'}`);
  }
} 
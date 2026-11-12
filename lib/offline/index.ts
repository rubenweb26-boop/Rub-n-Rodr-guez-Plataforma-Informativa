// Offline Support - IndexedDB for offline complaint submissions and sync
// This module handles offline-first form submissions with background sync

interface OfflineComplaint {
  id: string;
  formData: FormData;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
}

interface OfflineAction {
  id: string;
  type: 'complaint_submit' | 'complaint_update' | 'evidence_upload';
  payload: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
}

const DB_NAME = 'RubenWebOfflineDB';
const DB_VERSION = 1;
const STORE_COMPLAINTS = 'complaints';
const STORE_ACTIONS = 'actions';
const STORE_EVIDENCE = 'evidence';

let dbInstance: IDBDatabase | null = null;

export function initOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Complaints store
      if (!db.objectStoreNames.contains(STORE_COMPLAINTS)) {
        const complaintStore = db.createObjectStore(STORE_COMPLAINTS, { keyPath: 'id' });
        complaintStore.createIndex('status', 'status', { unique: false });
        complaintStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Actions store
      if (!db.objectStoreNames.contains(STORE_ACTIONS)) {
        const actionStore = db.createObjectStore(STORE_ACTIONS, { keyPath: 'id' });
        actionStore.createIndex('type', 'type', { unique: false });
        actionStore.createIndex('status', 'status', { unique: false });
      }

      // Evidence store (for blob storage)
      if (!db.objectStoreNames.contains(STORE_EVIDENCE)) {
        const evidenceStore = db.createObjectStore(STORE_EVIDENCE, { keyPath: 'id' });
        evidenceStore.createIndex('complaintId', 'complaintId', { unique: false });
      }
    };
  });
}

// Save complaint for offline submission
export async function saveComplaintOffline(formData: FormData): Promise<string> {
  const db = await initOfflineDB();
  const id = `complaint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Convert FormData to plain object for storage
  const formDataObj: Record<string, any> = {};
  formData.forEach((value, key) => {
    if (value instanceof File) {
      // Store file metadata separately
      formDataObj[key] = {
        name: value.name,
        type: value.type,
        size: value.size,
        lastModified: value.lastModified,
      };
    } else {
      formDataObj[key] = value;
    }
  });

  const complaint: OfflineComplaint = {
    id,
    formData: formDataObj as any,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_COMPLAINTS], 'readwrite');
    const store = transaction.objectStore(STORE_COMPLAINTS);
    const request = store.add(complaint);
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

// Save evidence files separately
export async function saveEvidenceOffline(complaintId: string, files: File[]): Promise<void> {
  const db = await initOfflineDB();
  
  for (const file of files) {
    const id = `evidence_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const arrayBuffer = await file.arrayBuffer();
    
    const evidence = {
      id,
      complaintId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileData: arrayBuffer,
      timestamp: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_EVIDENCE], 'readwrite');
      const store = transaction.objectStore(STORE_EVIDENCE);
      const request = store.add(evidence);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Get pending complaints
export async function getPendingComplaints(): Promise<OfflineComplaint[]> {
  const db = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_COMPLAINTS], 'readonly');
    const store = transaction.objectStore(STORE_COMPLAINTS);
    const index = store.index('status');
    const request = index.getAll('pending');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Update complaint status
export async function updateComplaintStatus(id: string, status: OfflineComplaint['status'], error?: string): Promise<void> {
  const db = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_COMPLAINTS], 'readwrite');
    const store = transaction.objectStore(STORE_COMPLAINTS);
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const complaint = getRequest.result;
      if (complaint) {
        complaint.status = status;
        complaint.retryCount += 1;
        if (error) complaint.error = error;
        
        const putRequest = store.put(complaint);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        reject(new Error('Complaint not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Get evidence for a complaint
export async function getEvidenceForComplaint(complaintId: string): Promise<File[]> {
  const db = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_EVIDENCE], 'readonly');
    const store = transaction.objectStore(STORE_EVIDENCE);
    const index = store.index('complaintId');
    const request = index.getAll(complaintId);
    
    request.onsuccess = () => {
      const files: File[] = [];
      for (const evidence of request.result) {
        const file = new File([evidence.fileData], evidence.fileName, {
          type: evidence.fileType,
        });
        files.push(file);
      }
      resolve(files);
    };
    request.onerror = () => reject(request.error);
  });
}

// Sync pending complaints to server
export async function syncPendingComplaints(): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingComplaints();
  let synced = 0;
  let failed = 0;

  for (const complaint of pending) {
    try {
      // Reconstruct FormData
      const formData = new FormData();
      const formDataObj = complaint.formData as Record<string, any>;
      
      for (const [key, value] of Object.entries(formDataObj)) {
        if (value && typeof value === 'object' && 'name' in value) {
          // This is a file reference - get actual file from evidence store
          const evidenceFiles = await getEvidenceForComplaint(complaint.id);
          const file = evidenceFiles.find(f => f.name === value.name);
          if (file) {
            formData.append(key, file);
          }
        } else {
          formData.append(key, value as string);
        }
      }

      // Update status to syncing
      await updateComplaintStatus(complaint.id, 'syncing');

      // Submit to server
      const response = await fetch('/api/complaints', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await updateComplaintStatus(complaint.id, 'synced');
        synced++;
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        await updateComplaintStatus(complaint.id, 'failed', errorData.error || 'Error del servidor');
        failed++;
      }
    } catch (error) {
      await updateComplaintStatus(complaint.id, 'failed', error instanceof Error ? error.message : 'Error de red');
      failed++;
    }
  }

  return { synced, failed };
}

// Register background sync (Service Worker)
export function registerBackgroundSync(): void {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then((registration) => {
      // Register periodic sync for complaints
      registration.sync.register('complaint-sync').catch(console.error);
    });
  }
}

// Check online status
export function isOnline(): boolean {
  return navigator.onLine;
}

// Listen for online/offline events
export function setupOfflineListeners(onOnline: () => void, onOffline: () => void): () => void {
  const handleOnline = () => {
    console.log('[Offline] Back online - triggering sync');
    onOnline();
    syncPendingComplaints().then(({ synced, failed }) => {
      console.log(`[Offline] Sync complete: ${synced} synced, ${failed} failed`);
    });
  };

  const handleOffline = () => {
    console.log('[Offline] Gone offline');
    onOffline();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// Get offline status for UI
export async function getOfflineStatus(): Promise<{
  isOnline: boolean;
  pendingCount: number;
  lastSync: number | null;
}> {
  const pending = await getPendingComplaints();
  const lastSync = parseInt(localStorage.getItem('lastSyncTime') || '0', 10);
  
  return {
    isOnline: navigator.onLine,
    pendingCount: pending.filter(c => c.status === 'pending' || c.status === 'failed').length,
    lastSync: lastSync || null,
  };
}

// Save sync timestamp
export function saveSyncTime(): void {
  localStorage.setItem('lastSyncTime', Date.now().toString());
}

// Clear synced complaints (cleanup)
export async function clearSyncedComplaints(): Promise<number> {
  const db = await initOfflineDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_COMPLAINTS], 'readwrite');
    const store = transaction.objectStore(STORE_COMPLAINTS);
    const index = store.index('status');
    const request = index.getAll('synced');
    
    request.onsuccess = () => {
      let count = 0;
      for (const complaint of request.result) {
        store.delete(complaint.id);
        count++;
      }
      resolve(count);
    };
    request.onerror = () => reject(request.error);
  });
}
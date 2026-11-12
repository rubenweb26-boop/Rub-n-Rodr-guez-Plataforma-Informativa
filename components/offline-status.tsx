"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi, Loader2, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  getOfflineStatus, 
  syncPendingComplaints, 
  setupOfflineListeners, 
  saveSyncTime,
  registerBackgroundSync 
} from "@/lib/offline";

export function OfflineStatusIndicator() {
  const [status, setStatus] = useState<{
    isOnline: boolean;
    pendingCount: number;
    lastSync: number | null;
    isSyncing: boolean;
  }>({
    isOnline: true,
    pendingCount: 0,
    lastSync: null,
    isSyncing: false,
  });

  const refreshStatus = async () => {
    const newStatus = await getOfflineStatus();
    setStatus(prev => ({ ...prev, ...newStatus }));
  };

  const handleSync = async () => {
    setStatus(prev => ({ ...prev, isSyncing: true }));
    try {
      const result = await syncPendingComplaints();
      saveSyncTime();
      await refreshStatus();
      // Show toast notification - in production use a proper toast library
      if (result.synced > 0) {
        console.log(`Sincronizadas ${result.synced} denuncias`);
      }
      if (result.failed > 0) {
        console.warn(`Fallaron ${result.failed} denuncias`);
      }
    } catch (error) {
      console.error('Error sincronizando:', error);
    } finally {
      setStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  useEffect(() => {
    // Initial check
    refreshStatus();
    registerBackgroundSync();

    // Setup listeners
    const cleanup = setupOfflineListeners(
      () => refreshStatus(),
      () => refreshStatus()
    );

    // Periodic check
    const interval = setInterval(refreshStatus, 30000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, []);

  // Don't show if online and no pending items
  if (status.isOnline && status.pendingCount === 0) {
    return (
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
          <Wifi className="h-3.5 w-3.5" />
          <span>En línea</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {/* Status Badge */}
      <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
        status.isOnline 
          ? 'bg-amber-100 text-amber-800' 
          : 'bg-rose-100 text-rose-800 animate-pulse'
      }`}>
        {status.isOnline ? (
          <Wifi className="h-3.5 w-3.5" />
        ) : (
          <WifiOff className="h-3.5 w-3.5" />
        )}
        <span>
          {status.isOnline ? 'En línea' : 'Sin conexión'}
          {status.pendingCount > 0 && ` • ${status.pendingCount} pendiente${status.pendingCount > 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Sync Button */}
      <Button
        onClick={handleSync}
        disabled={status.isSyncing || (!status.isOnline && status.pendingCount === 0)}
        className="gap-2 rounded-full bg-[#d84d3d] hover:bg-[#b74033] text-white font-medium px-4 py-2 shadow-lg"
        size="sm"
      >
        {status.isSyncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sincronizando...
          </>
        ) : status.isOnline ? (
          <>
            <RefreshCw className="h-4 w-4" />
            Sincronizar ahora
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4" />
            Sin conexión
          </>
        )}
      </Button>

      {/* Last sync time */}
      {status.lastSync && (
        <div className="text-[10px] text-[#8ea4be] text-right max-w-xs">
          Última sincronización: {new Date(status.lastSync).toLocaleString('es-CR')}
        </div>
      )}
    </div>
  );
}

// Hook for components that need offline status
export function useOfflineStatus() {
  const [status, setStatus] = useState<{
    isOnline: boolean;
    pendingCount: number;
    lastSync: number | null;
  }>({
    isOnline: true,
    pendingCount: 0,
    lastSync: null,
  });

  useEffect(() => {
    getOfflineStatus().then(setStatus);
    registerBackgroundSync();

    const cleanup = setupOfflineListeners(
      () => getOfflineStatus().then(setStatus),
      () => getOfflineStatus().then(setStatus)
    );

    return cleanup;
  }, []);

  return status;
}

// Offline-aware form submission hook
export function useOfflineFormSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const submitForm = async (formData: FormData, endpoint: string = '/api/complaints'): Promise<{
    success: boolean;
    offline: boolean;
    trackingCode?: string;
    error?: string;
  }> => {
    setIsSubmitting(true);
    const online = navigator.onLine;
    setIsOffline(!online);

    try {
      if (online) {
        // Try online submission
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          return { success: true, offline: false, trackingCode: data.trackingCode };
        } else {
          // If server error, save offline
          throw new Error('Server error');
        }
      } else {
        // Offline - save to IndexedDB
        throw new Error('Offline');
      }
    } catch (error) {
      // Save offline
      if (error instanceof Error && error.message === 'Offline') {
        const { saveComplaintOffline, saveEvidenceOffline } = await import('@/lib/offline');
        
        // Extract files for separate storage
        const files: File[] = [];
        formData.forEach((value, key) => {
          if (value instanceof File && key === 'evidence') {
            files.push(value);
          }
        });

        const complaintId = await saveComplaintOffline(formData);
        if (files.length > 0) {
          await saveEvidenceOffline(complaintId, files);
        }

        return { 
          success: true, 
          offline: true, 
          trackingCode: 'PENDIENTE_SYNC_' + complaintId 
        };
      }

      return { 
        success: false, 
        offline: !navigator.onLine, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitForm, isSubmitting, isOffline };
}
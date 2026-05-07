import { useRef, useState, useCallback, useEffect } from "react";
import { AppState } from "react-native";
import { CameraView, CameraType, FlashMode } from "expo-camera";

import CameraService, { PhotoResult, CaptureOptions } from "@/src/services/cameraService";
import PermissionService, { AppPermissions } from "@/src/services/permissionService";

interface UseCameraOptions {
  requestOnMount?: boolean;
}

interface UseCameraReturn {
  cameraRef: React.RefObject<CameraView | null>;
  permissions: AppPermissions | null;
  isPermissionGranted: boolean;
  isLoadingPermissions: boolean;
  facing: CameraType;
  flashMode: FlashMode;
  requestPermissions: () => Promise<void>;
  takePhoto: (options?: CaptureOptions) => Promise<PhotoResult | null>;
  toggleFacing: () => void;
  toggleFlash: () => void;
  saveToGallery: (uri: string) => Promise<void>;
  lastPhoto: PhotoResult | null;
  error: string | null;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { requestOnMount = true } = options;

  const cameraRef = useRef<CameraView>(null);
  const [permissions, setPermissions] = useState<AppPermissions | null>(null);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [flashMode, setFlashMode] = useState<FlashMode>("off");
  const [lastPhoto, setLastPhoto] = useState<PhotoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPermissionGranted =
    !!permissions &&
    PermissionService.isGranted(permissions.camera) &&
    PermissionService.isGranted(permissions.mediaLibrary);

  const requestPermissions = useCallback(async () => {
    setIsLoadingPermissions(true);
    setError(null);
    try {
      const result = await PermissionService.requestAllPermissions();
      setPermissions(result);
    } catch {
      setError("Error al solicitar permisos.");
    } finally {
      setIsLoadingPermissions(false);
    }
  }, []);

  useEffect(() => {
    if (requestOnMount) {
      void requestPermissions();
    }
  }, [requestOnMount, requestPermissions]);

  // Re-verifica permisos cuando el usuario vuelve desde Ajustes del sistema
  useEffect(() => {
    let prev = AppState.currentState;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (prev.match(/inactive|background/) && nextState === "active") {
        void requestPermissions();
      }
      prev = nextState;
    });
    return () => subscription.remove();
  }, [requestPermissions]);

  const takePhoto = useCallback(async (opts: CaptureOptions = {}): Promise<PhotoResult | null> => {
    setError(null);
    if (!cameraRef.current) {
      setError("No se detectó ninguna cámara.");
      return null;
    }
    try {
      const photo = await CameraService.takePhoto(
        cameraRef as React.RefObject<CameraView>,
        opts,
      );
      setLastPhoto(photo);
      return photo;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al capturar foto.");
      return null;
    }
  }, []);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => CameraService.toggleFacing(prev));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlashMode((prev) => CameraService.cycleFlashMode(prev));
  }, []);

  const saveToGallery = useCallback(async (uri: string) => {
    setError(null);
    try {
      await CameraService.saveToGallery(uri);
    } catch {
      setError("Error al guardar en galería.");
    }
  }, []);

  return {
    cameraRef,
    permissions,
    isPermissionGranted,
    isLoadingPermissions,
    facing,
    flashMode,
    requestPermissions,
    takePhoto,
    toggleFacing,
    toggleFlash,
    saveToGallery,
    lastPhoto,
    error,
  };
}

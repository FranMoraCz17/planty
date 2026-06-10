/**
 * MapLocationPicker — requiere entorno nativo (expo run:android / expo run:ios).
 * No funciona en Expo Go porque react-native-maps tiene módulos nativos.
 *
 * Para activarlo:
 * 1. npm install react-native-maps  (en mobile/)
 * 2. Agregar EXPO_PUBLIC_GOOGLE_MAPS_KEY al .env
 * 3. npx expo prebuild --clean
 * 4. npx expo run:android  o  npx expo run:ios
 *
 * Mientras tanto, AreaFormScreen usa expo-location con inputs manuales.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

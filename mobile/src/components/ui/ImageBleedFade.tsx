import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

interface ImageBleedFadeProps {
  // Misma foto que se muestra a sangre arriba.
  uri: string;
  // Color hacia el que se difumina (típicamente colors.surface).
  fadeColor: string;
  style?: ViewStyle;
}

// Continúa visualmente el borde inferior de una foto a sangre: una copia
// recortada y muy desenfocada de la misma imagen (alineada al fondo) se
// funde en un degradado hacia el color de fondo, evitando el corte duro.
// Por defecto se estira hasta el fondo de su contenedor (pasar `top`/`bottom`
// vía `style`) para que el degradado termine exactamente en `fadeColor`,
// sin crear un segundo borde duro.
export default function ImageBleedFade({ uri, fadeColor, style }: ImageBleedFadeProps) {
  return (
    <View pointerEvents="none" style={[styles.wrap, style]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        contentPosition="bottom"
        blurRadius={Platform.OS === "android" ? 25 : 60}
      />
      <LinearGradient
        colors={["transparent", fadeColor]}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
  },
});

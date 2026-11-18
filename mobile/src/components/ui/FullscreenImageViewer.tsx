import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from "react-native";
import GlassIconButton from "./GlassIconButton";
import { Spacing, Typography } from "@/src/theme/designSystem";

interface ViewerImage {
  uri: string;
  caption?: string;
}

interface FullscreenImageViewerProps {
  visible: boolean;
  images: ViewerImage[];
  initialIndex?: number;
  onClose: () => void;
}

// Visor a pantalla completa con deslizamiento entre fotos del registro.
export default function FullscreenImageViewer({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: FullscreenImageViewerProps) {
  const { width } = Dimensions.get("window");
  const listRef = useRef<FlatList<ViewerImage>>(null);
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) return;
    setIndex(initialIndex);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    });
  }, [visible, initialIndex]);

  const renderItem = ({ item }: ListRenderItemInfo<ViewerImage>) => (
    <View style={[styles.page, { width }]}>
      <Image source={{ uri: item.uri }} style={styles.image} resizeMode="contain" />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <FlatList
          ref={listRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, i) => `${item.uri}-${i}`}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          initialScrollIndex={initialIndex}
          onMomentumScrollEnd={(e) =>
            setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          renderItem={renderItem}
        />

        <View style={styles.topBar}>
          <GlassIconButton icon="close" accessibilityLabel="Cerrar" onPress={onClose} />
          {images.length > 1 ? (
            <View style={styles.counterPill}>
              <Text style={styles.counterText}>
                {index + 1} / {images.length}
              </Text>
            </View>
          ) : null}
        </View>

        {images[index]?.caption ? (
          <View style={styles.captionWrap}>
            <Text style={styles.captionText}>{images[index].caption}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)" },
  page: { alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: 52,
  },
  counterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  counterText: {
    color: "#FFFFFF",
    fontFamily: Typography.family,
    fontSize: 12,
    fontWeight: "700",
  },
  captionWrap: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  captionText: {
    color: "rgba(255,255,255,0.85)",
    fontFamily: Typography.family,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
});

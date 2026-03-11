import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "./UserProfile.styles";

interface UserInterface {
  nombre: string;
  apodo: string;
  cantidadPlantas: number;
  categoriasPlantas: string[];
  racha: number;
  cumpleanos: string;
  image: string;
  cantidadAmigos: number;
  privacidad: "publico" | "privado";
  descripcion: string;
  plantaFavorita: string;
  nivel: number;
  ubicacion?: string;
}

const mockUser: UserInterface = {
  nombre: "Lucia Andrade",
  apodo: "selva_urbana",
  cantidadPlantas: 83,
  categoriasPlantas: ["Orquideas", "Bonsais", "Medicinales", "Helechos"],
  racha: 142,
  cumpleanos: "1998-11-03",
  image: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e",
  cantidadAmigos: 612,
  privacidad: "publico",
  descripcion:
    "Transformando mi apartamento en una jungla sostenible. Cultivo consciente y amor por la biodiversidad.",
  plantaFavorita: "Ficus Lyrata",
  nivel: 27,
  ubicacion: "San Jose, Costa Rica",
};

export default function UserProfile() {
  const user = mockUser;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header} />

        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user.image }} style={styles.avatar} />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Editar foto de perfil"
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>E</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.nameSection}>
          <Text style={styles.name}>{user.nombre}</Text>
          <Text style={styles.username}>@{user.apodo}</Text>

          <View style={styles.levelCompactContainer}>
            <View style={styles.levelCompact}>
              <Text style={styles.levelCompactText}>Nivel {user.nivel}</Text>
            </View>
            <View style={styles.badgeCompact}>
              <Text style={styles.badgeCompactText}>Jardinero Experto</Text>
            </View>
          </View>

          <View style={styles.privacyBadge}>
            <Text style={styles.privacyText}>
              {user.privacidad === "publico" ? "Publico" : "Privado"}
            </Text>
          </View>
        </View>

        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{user.cantidadPlantas}</Text>
            <Text style={styles.summaryLabel}>Plantas</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{user.cantidadAmigos}</Text>
            <Text style={styles.summaryLabel}>Amigos</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{user.racha}</Text>
            <Text style={styles.summaryLabel}>Racha</Text>
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {user.categoriasPlantas.map((categoria, index) => (
              <View key={index} style={styles.categoryChip}>
                <Text style={styles.categoryText}>{categoria}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.bioCard}>
          <View style={styles.bioHeader}>
            <Text style={styles.bioIcon}>Plant</Text>
            <Text style={styles.bioTitle}>Acerca de</Text>
          </View>
          <Text style={styles.bioText}>{user.descripcion}</Text>
        </View>

        <View style={styles.featuredPlantCard}>
          <Text style={styles.featuredPlantLabel}>Planta destacada</Text>
          <View style={styles.featuredPlantContent}>
            <View style={styles.featuredPlantImageLarge}>
              <Text style={styles.featuredPlantEmoji}>PL</Text>
            </View>
            <View style={styles.featuredPlantInfo}>
              <Text style={styles.featuredPlantName}>{user.plantaFavorita}</Text>
              <Text style={styles.featuredPlantSubtext}>
                En mi coleccion desde 2024
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Cumpleanos</Text>
            <Text style={styles.infoValue}>{user.cumpleanos}</Text>
          </View>
          {user.ubicacion && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Ubicacion</Text>
              <Text style={styles.infoValue}>{user.ubicacion}</Text>
            </View>
          )}
        </View>

        <View style={styles.gardenSection}>
          <View style={styles.gardenHeader}>
            <Text style={styles.gardenHeaderLabel}>Inventario activo</Text>
            <Text style={styles.sectionTitle}>Mi Jardin</Text>
          </View>
          <View style={styles.gardenGrid}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <TouchableOpacity
                key={item}
                accessibilityRole="button"
                accessibilityLabel={`Abrir planta ${item}`}
                style={styles.gardenItem}
              >
                <View style={styles.gardenPlaceholder}>
                  {item === 1 && (
                    <View style={styles.recentIndicator}>
                      <Text style={styles.recentIndicatorText}>*</Text>
                    </View>
                  )}
                  <Text style={styles.gardenPlaceholderText}>PL</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

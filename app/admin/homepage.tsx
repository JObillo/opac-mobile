import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import api from "../../api/api";

type Book = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  status: string;
  book_cover?: string;
};

type Section = {
  id: number;
  section_name: string;
  books: Book[];
};

export default function AdminDashboard() {
  const [sections, setSections] = useState<Section[]>([]);
  const [filteredSections, setFilteredSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<"all" | "title" | "author" | "isbn">("all");

  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const fetchSections = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sections");
      setSections(res.data);
      setFilteredSections(res.data);
    } catch (err: any) {
      console.error("Axios error:", err.message);
      Alert.alert("Error", "Failed to fetch sections. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    const trimmed = searchText.trim().toLowerCase();
    if (!trimmed) {
      setFilteredSections(sections);
      return;
    }

    const newSections = sections
      .map((section) => ({
        ...section,
        books: section.books.filter((book) => {
          if (filterType === "all") {
            return (
              book.title.toLowerCase().includes(trimmed) ||
              book.author.toLowerCase().includes(trimmed) ||
              (book.isbn?.toLowerCase().includes(trimmed) ?? false)
            );
          } else {
            return book[filterType]?.toLowerCase().includes(trimmed);
          }
        }),
      }))
      .filter((section) => section.books.length > 0);

    setFilteredSections(newSections);
  }, [searchText, filterType, sections]);

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      if (token) {
        await fetch("http://192.168.0.104:8000/api/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
      }

      await AsyncStorage.removeItem("token");
      Alert.alert("Logged Out", "You have been logged out successfully.");
      router.replace("/");
    } catch (error) {
      console.error("Logout Error:", error);
      Alert.alert("Error", "Something went wrong while logging out.");
    }
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  const hasBooks = filteredSections.some((section) => section.books.length > 0);

  const dismissSearch = () => {
    Keyboard.dismiss();
    setSearchText("");
    setFilteredSections(sections);
    inputRef.current?.blur();
  };

  return (
    <>
      {/* Header */}
      <Stack.Screen
        options={{
          headerBackVisible: false,
          headerTitle: () => (
            <View style={styles.header}>
              <Image
                source={{ uri: "http://192.168.0.104:8000/philcstlogo.png" }}
                style={styles.logo}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.libraryName}>Philcst Library</Text>
                <Text style={styles.adminBadge}>ADMIN DASHBOARD</Text>
              </View>
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: "#f0e6fa" },
          headerShadowVisible: false,
          headerTitleAlign: "left",
        }}
      />

      {/* Main Body */}
      <TouchableWithoutFeedback onPress={dismissSearch}>
        <View style={{ flex: 1, backgroundColor: "#f8f8f8" }}>

          {/* Search & Filter */}
          <View style={styles.searchContainer}>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder={filterType === "all" ? "Search books..." : `Search by ${filterType}`}
              value={searchText}
              onChangeText={setSearchText}
            />
            <Picker
              selectedValue={filterType}
              style={styles.picker}
              onValueChange={(value) => setFilterType(value)}
            >
              <Picker.Item label="All" value="all" />
              <Picker.Item label="Title" value="title" />
              <Picker.Item label="Author" value="author" />
              <Picker.Item label="ISBN" value="isbn" />
            </Picker>
          </View>

          {/* Book Sections */}
          {hasBooks ? (
            <FlatList
              data={filteredSections}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{item.section_name}</Text>
                    <TouchableOpacity onPress={() => router.push(`/section/${item.id}`)}>
                      <Text style={styles.seeAllText}>See All</Text>
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    data={item.books.slice(0, 3)}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(book) => book.id.toString()}
                    renderItem={({ item: book }) => (
                      <TouchableOpacity
                        onPress={() =>
                          router.push({ pathname: "/book/[id]", params: { id: book.id.toString() } })
                        }
                      >
                        <View style={styles.bookCard}>
                          <Image
                            source={{
                              uri: book.book_cover
                                ? book.book_cover.startsWith("http")
                                  ? book.book_cover
                                  : `http://192.168.0.104:8000${book.book_cover}`
                                : "https://via.placeholder.com/120x160.png?text=No+Cover",
                            }}
                            style={styles.bookCover}
                          />
                          <View style={styles.bookInfo}>
                            <Text numberOfLines={1} style={styles.bookTitle}>
                              {book.title}
                            </Text>
                            <Text
                              style={[
                                styles.status,
                                { color: book.status === "Available" ? "green" : "red" },
                              ]}
                            >
                              {book.status}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            />
          ) : (
            <View style={styles.noBooksContainer}>
              <Text style={styles.noBooksText}>No books found.</Text>
            </View>
          )}

          {/* Bottom Admin Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="home" size={26} color="#774e94ff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/admin/add-book")}>
              <Ionicons name="add" size={26} color="#774e94ff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/admin/homepage")}>
              <Ionicons name="create-outline" size={26} color="#774e94ff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center" },
  logo: { width: 35, height: 35, borderRadius: 8 },
  libraryName: { color: "#774e94ff", fontSize: 20, fontWeight: "bold" },
  adminBadge: { fontSize: 12, color: "#774e94ff", fontWeight: "bold", textTransform: "uppercase" },
  logoutButton: { backgroundColor: "#774e94ff", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginRight: 10 },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  adminActions: { flexDirection: "row", justifyContent: "flex-start", marginVertical: 12, paddingLeft: 10 },
  adminButton: { backgroundColor: "#774e94ff", padding: 12, borderRadius: 8, flexDirection: "row", alignItems: "center" },
  adminButtonText: { color: "#fff", fontWeight: "bold", marginLeft: 6 },
  searchContainer: { flexDirection: "row", alignItems: "center", padding: 10 },
  searchInput: { flex: 1, height: 40, backgroundColor: "#fff", paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: "#ccc" },
  picker: { width: 120, marginLeft: 8 },
  sectionContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontWeight: "bold", fontSize: 18, marginLeft: 12 },
  seeAllText: { color: "#007bff", fontWeight: "bold", marginRight: 12 },
  bookCard: { width: 120, marginRight: 12, marginLeft: 12 },
  bookCover: { width: 120, height: 160, borderRadius: 8, marginBottom: 6 },
  bookInfo: { marginTop: 4 },
  bookTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  status: { fontWeight: "500" },
  bottomBar: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", height: 70, borderTopWidth: 1, borderTopColor: "#ddd", backgroundColor: "#fff" },
  iconButton: { flex: 1, alignItems: "center" },
  noBooksContainer: { flex: 1, justifyContent: "flex-start", alignItems: "center", marginTop: 80 },
  noBooksText: { fontSize: 16, color: "#666" },
});

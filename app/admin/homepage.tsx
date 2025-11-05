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
  subject: string;
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
  const [filterType, setFilterType] = useState<"all" | "title" | "author" | "isbn" | "subject">("all");
  const [searched, setSearched] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  // Fetch sections
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

  // Search handler
  const handleSearch = () => {
    const trimmed = searchText.trim();
    if (!trimmed) {
      setFilteredSections(sections);
      setSearched(false);
      return;
    }

    const q = trimmed.toLowerCase();
    const newSections = sections
      .map((section) => ({
        ...section,
        books: section.books.filter((book) => {
          if (filterType === "all") {
            return (
              book.title.toLowerCase().includes(q) ||
              book.author.toLowerCase().includes(q) ||
              (book.isbn?.toLowerCase().includes(q) ?? false) ||
              book.subject.toLowerCase().includes(q)
            );
          } else {
            return book[filterType]?.toLowerCase().includes(q);
          }
        }),
      }))
      .filter((section) => section.books.length > 0);

    setFilteredSections(newSections);
    setSearched(true);
    Keyboard.dismiss();
  };

  const clearSearch = () => {
    setSearchText("");
    setFilteredSections(sections);
    setSearched(false);
    inputRef.current?.blur();
  };

  const dismissSearch = () => {
    Keyboard.dismiss();
    inputRef.current?.blur();
  };

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

  return (
    <>
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
                <Text style={styles.adminBadge}>
                  {editMode ? "EDIT MODE" : "ADMIN DASHBOARD"}
                </Text>
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

      <TouchableWithoutFeedback onPress={dismissSearch}>
        <View style={{ flex: 1, backgroundColor: "#f8f8f8" }}>
          {/* Search & Filter */}
          <View style={styles.searchContainer}>
            <View style={styles.searchWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.searchInput}
                placeholder={filterType === "all" ? "Search books..." : `Search by ${filterType}`}
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              {searched ? (
                <TouchableOpacity onPress={clearSearch} style={styles.searchIcon}>
                  <Ionicons name="close" size={20} color="#774e94ff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleSearch} style={styles.searchIcon}>
                  <Ionicons name="search" size={20} color="#774e94ff" />
                </TouchableOpacity>
              )}
            </View>

            <Picker
              selectedValue={filterType}
              style={styles.picker}
              onValueChange={(value) => setFilterType(value)}
            >
              <Picker.Item label="All" value="all" />
              <Picker.Item label="Title" value="title" />
              <Picker.Item label="Author" value="author" />
              <Picker.Item label="ISBN" value="isbn" />
              <Picker.Item label="Subject" value="subject" />
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
                          editMode
                            ? router.push({ pathname: "/admin/edit-book/[id]", params: { id: book.id.toString() } })
                            : router.push({ pathname: "/book/[id]", params: { id: book.id.toString() } })
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
                            <Text style={{ color: book.status === "Available" ? "green" : "red" }}>
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

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setEditMode((prev) => !prev)}
            >
              <Ionicons name="create-outline" size={26} color={editMode ? "green" : "#774e94ff"} />
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
  searchContainer: { flexDirection: "row", alignItems: "center", padding: 10 },
  searchWrapper: { flex: 1, position: "relative" },
  searchInput: { height: 40, backgroundColor: "#fff", paddingHorizontal: 12, paddingRight: 35, borderRadius: 8, borderWidth: 1, borderColor: "#ccc" },
  searchIcon: { position: "absolute", right: 10, top: 10 },
  picker: { width: 120, marginLeft: 8 },
  sectionContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontWeight: "bold", fontSize: 18, marginLeft: 12 },
  seeAllText: { color: "#007bff", fontWeight: "bold", marginRight: 12 },
  bookCard: { width: 120, marginRight: 12, marginLeft: 12 },
  bookCover: { width: 120, height: 160, borderRadius: 8, marginBottom: 6 },
  bookInfo: { marginTop: 4 },
  bookTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  bottomBar: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", height: 70, borderTopWidth: 1, borderTopColor: "#ddd", backgroundColor: "#fff" },
  iconButton: { flex: 1, alignItems: "center" },
  noBooksContainer: { flex: 1, justifyContent: "flex-start", alignItems: "center", marginTop: 80 },
  noBooksText: { fontSize: 16, color: "#666" },
});

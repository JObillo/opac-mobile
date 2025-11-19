import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import Fuse from "fuse.js";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

export default function LandingPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [filteredSections, setFilteredSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<"all" | "title" | "author" | "isbn" | "subject">("all");
  const [searched, setSearched] = useState(false);

  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    api
      .get("/sections")
      .then((res) => {
        setSections(res.data);
        setFilteredSections(res.data);
      })
      .catch((err) => console.error("Axios error:", err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = () => {
    const trimmed = searchText.trim();

    if (!trimmed) {
      setFilteredSections(sections);
      setSearched(false);
      return;
    }

    const allBooks = sections.flatMap((section) =>
      section.books.map((book) => ({
        ...book,
        section_id: section.id,
        section_name: section.section_name,
      }))
    );

    const fuse = new Fuse(allBooks, {
      keys: ["title", "author", "isbn", "subject"],
      threshold: 0.4,
    });

    const results = fuse.search(trimmed).map((result) => result.item);

    const grouped: Record<number, Section> = {};

    results.forEach((book) => {
      if (!grouped[book.section_id]) {
        grouped[book.section_id] = {
          id: book.section_id,
          section_name: book.section_name,
          books: [],
        };
      }
      grouped[book.section_id].books.push(book);
    });

    setFilteredSections(Object.values(grouped));
    setSearched(true);
    Keyboard.dismiss();
  };

  const clearSearch = () => {
    setSearchText("");
    setFilteredSections(sections);
    setSearched(false);
    inputRef.current?.blur();
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  const hasBooks = filteredSections.some((section) => section.books.length > 0);

  const dismissSearch = () => {
    Keyboard.dismiss();
    inputRef.current?.blur();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissSearch}>
      <View style={{ flex: 1, backgroundColor: Colors.background }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: "#f0e6fa" }]}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={{ uri: "http://192.168.0.104:8000/philcstlogo.png" }}
              style={styles.logo}
            />
            <Text style={[styles.libraryName, { color: Colors.tint }]}>
              Philcst Opac Library
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.adminButton, { backgroundColor: Colors.tint }]}
            onPress={() => router.push("/admin/login" as never)}
          >
            <Text style={styles.adminButtonText}>Login</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder={
                filterType === "all"
                  ? "Search books..."
                  : `Search books by ${filterType}`
              }
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                if (!text) {
                  setFilteredSections(sections);
                  setSearched(false);
                }
              }}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searched ? (
              <TouchableOpacity onPress={clearSearch} style={styles.searchIcon}>
                <Ionicons name="close" size={20} color={Colors.tint} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleSearch} style={styles.searchIcon}>
                <Ionicons name="search" size={20} color={Colors.tint} />
              </TouchableOpacity>
            )}
          </View>

          <Picker
            selectedValue={filterType}
            style={styles.picker}
            onValueChange={(value: "all" | "title" | "author" | "isbn" | "subject") =>
              setFilterType(value)
            }
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
                  <Text style={[styles.sectionTitle, { color: Colors.text }]}>
                    {item.section_name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push(`/section/${item.id}`)}
                  >
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
                        router.push({
                          pathname: "/book/[id]",
                          params: { id: book.id.toString() },
                        })
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
                          <Text numberOfLines={1} style={[styles.bookTitle, { color: Colors.text }]}>
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
          <View
            style={{
              flex: 1,
              justifyContent: "flex-start",
              alignItems: "center",
              marginTop: 80,
            }}
          >
            <Text style={{ fontSize: 16, color: "#666" }}>No books found.</Text>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginTop: 30,
  },
  libraryName: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
    marginTop: 30,
  },
  adminButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 30,
  },
  adminButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  searchWrapper: {
    flex: 1,
    position: "relative",
  },
  searchInput: {
    height: 40,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingRight: 35,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  searchIcon: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  picker: {
    width: 120,
    marginLeft: 8,
  },
  sectionContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 12,
  },
  seeAllText: {
    color: "#007bff",
    fontWeight: "bold",
    marginRight: 12,
  },
  bookCard: {
    width: 120,
    marginRight: 12,
    marginLeft: 12,
  },
  bookCover: {
    width: 120,
    height: 160,
    borderRadius: 8,
    marginBottom: 6,
  },
  bookInfo: {
    marginTop: 4,
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
  },
  status: {
    fontWeight: "500",
  },
});

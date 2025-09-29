import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
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
  const [filterType, setFilterType] = useState<"all" | "title" | "author" | "isbn">("all");

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

  // Filter books based on search
  useEffect(() => {
    if (!searchText) {
      setFilteredSections(sections);
      return;
    }

    const newSections = sections
      .map((section) => ({
        ...section,
        books: section.books.filter((book) => {
          const q = searchText.toLowerCase().trim();
          if (filterType === "all") {
            return (
              book.title.toLowerCase().includes(q) ||
              book.author.toLowerCase().includes(q) ||
              (book.isbn?.toLowerCase().includes(q) ?? false)
            );
          } else {
            return book[filterType]?.toLowerCase().includes(q);
          }
        }),
      }))
      .filter((section) => section.books.length > 0);

    setFilteredSections(newSections);
  }, [searchText, filterType, sections]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  const hasBooks = filteredSections.some(section => section.books.length > 0);

  const dismissSearch = () => {
    Keyboard.dismiss();
    setSearchText("");
    setFilteredSections(sections);
    inputRef.current?.blur();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissSearch}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: "http://192.168.0.103:8000/philcstlogo.png" }}
            style={styles.logo}
          />
          <Text style={styles.libraryName}>Philcst Library</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder={
              filterType === "all"
                ? "Search books..."
                : `Search books by ${filterType}`
            }
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
                  data={item.books.slice(0, 3)} // show 3 books
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(book) => book.id.toString()}
                  renderItem={({ item: book }) => (
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/book/[id]',
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
                                : `http://192.168.0.103:8000${book.book_cover}`
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
          <View style={{ flex: 1, justifyContent: "flex-start", alignItems: "center", marginTop: 80 }}>
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
    padding: 20,
    backgroundColor: "#fff",
  },
  logo: { width: 40, height: 40, borderRadius: 8, marginTop: 30 },
  libraryName: { color: "#774e94ff", fontSize: 20, fontWeight: "bold", marginLeft: 12, marginTop: 30 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  picker: {
    width: 120,
    marginLeft: 8,
  },

  sectionContainer: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontWeight: "bold", fontSize: 18, marginLeft: 12 },
  seeAllText: { color: "#007bff", fontWeight: "bold", marginRight: 12 },

  bookCard: { width: 120, marginRight: 12, marginLeft: 12 },
  bookCover: { width: 120, height: 160, borderRadius: 8, marginBottom: 6 },
  
  bookInfo: { marginTop: 4 },
  bookTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  status: { fontWeight: "500" },
});

import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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
  publisher: string;
  subject?: string;
  status?: string;
  book_cover?: string;
};

export default function SectionPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [sectionName, setSectionName] = useState<string>("");
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] =
    useState<"all" | "title" | "author" | "isbn" | "subject">("all");
  const [searched, setSearched] = useState(false); // ✅ added

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 5;

  useEffect(() => {
    api
      .get(`/sections/${id}/books`)
      .then((res) => {
        setBooks(res.data.books);
        setFilteredBooks(res.data.books);
        setSectionName(res.data.section.section_name);
      })
      .catch((err) => console.error("Axios error:", err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSearch = () => {
    const trimmedText = searchText.trim();
    if (!trimmedText) {
      setFilteredBooks(books);
      setSearched(false);
      setCurrentPage(1);
      return;
    }

    const q = trimmedText.toLowerCase();
    const newBooks = books.filter((book) => {
      if (filterType === "all") {
        return (
          book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q) ||
          (book.isbn?.toLowerCase().includes(q) ?? false) ||
          (book.subject?.toLowerCase().includes(q) ?? false)
        );
      } else {
        return book[filterType]?.toLowerCase().includes(q);
      }
    });

    setFilteredBooks(newBooks);
    setCurrentPage(1);
    setSearched(true); // ✅ show clear button
    Keyboard.dismiss();
  };

  const clearSearch = () => {
    setSearchText("");
    setFilteredBooks(books);
    setSearched(false);
    setCurrentPage(1);
    inputRef.current?.blur();
  };

  const dismissSearch = () => {
    Keyboard.dismiss();
    inputRef.current?.blur();
  };

  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxButtons = 5;
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <TouchableOpacity
          key={i}
          onPress={() => setCurrentPage(i)}
          disabled={i === currentPage}
          style={[
            styles.pageButton,
            i === currentPage && styles.activePageButton,
          ]}
        >
          <Text
            style={[
              styles.pageText,
              i === currentPage && styles.activePageText,
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          disabled={currentPage === 1}
          onPress={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          <Ionicons
            name="chevron-back-circle"
            size={36}
            color={currentPage === 1 ? "#ccc" : "#774e94ff"}
          />
        </TouchableOpacity>

        {startPage > 1 && (
          <>
            <TouchableOpacity
              onPress={() => setCurrentPage(1)}
              style={styles.pageButton}
            >
              <Text style={styles.pageText}>1</Text>
            </TouchableOpacity>
            {startPage > 2 && <Text style={styles.ellipsis}>...</Text>}
          </>
        )}

        {pages}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <Text style={styles.ellipsis}>...</Text>
            )}
            <TouchableOpacity
              onPress={() => setCurrentPage(totalPages)}
              style={styles.pageButton}
            >
              <Text style={styles.pageText}>{totalPages}</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          disabled={currentPage === totalPages}
          onPress={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
        >
          <Ionicons
            name="chevron-forward-circle"
            size={36}
            color={currentPage === totalPages ? "#ccc" : "#774e94ff"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={dismissSearch}>
      <View style={{ flex: 1, backgroundColor: "#f6f6f6" }}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.sectionHeaderText}>{sectionName}</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder={
                filterType === "all"
                  ? "Search books..."
                  : `Search by ${filterType}`
              }
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                if (!text) {
                  clearSearch();
                }
              }}
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
            onValueChange={(
              value: "all" | "title" | "author" | "isbn" | "subject"
            ) => setFilterType(value)}
          >
            <Picker.Item label="All" value="all" />
            <Picker.Item label="Title" value="title" />
            <Picker.Item label="Author" value="author" />
            <Picker.Item label="ISBN" value="isbn" />
            <Picker.Item label="Subject" value="subject" />
          </Picker>
        </View>

        {/* Book list */}
        {filteredBooks.length > 0 ? (
          <FlatList
            data={currentBooks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/book/[id]",
                    params: { id: item.id.toString() },
                  })
                }
              >
                <View style={styles.bookCard}>
                  <Image
                    source={{
                      uri: item.book_cover
                        ? item.book_cover.startsWith("http")
                          ? item.book_cover
                          : `http://192.168.0.104:8000${item.book_cover}`
                        : "https://via.placeholder.com/140x180.png?text=No+Cover",
                    }}
                    style={styles.bookCover}
                  />
                  <View style={styles.bookInfo}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text>Author: {item.author}</Text>
                    <Text>ISBN: {item.isbn}</Text>
                    <Text>Publisher: {item.publisher}</Text>
                    {item.subject && <Text>Subject: {item.subject}</Text>}
                    {item.status && (
                      <Text
                        style={{
                          color:
                            item.status === "Available" ? "green" : "red",
                          fontWeight: "bold",
                        }}
                      >
                        {item.status}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListFooterComponent={renderPagination}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        ) : (
          <View style={{ paddingTop: 20, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 16, color: "#666" }}>No books found.</Text>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#774e94ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: { marginRight: 12 },
  sectionHeaderText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    flexShrink: 1,
    textAlign: "right",
  },
  searchContainer: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
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
  picker: { width: 120, marginLeft: 8 },
  bookCard: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#fff",
  },
  bookCover: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginRight: 12,
  },
  bookInfo: { flex: 1, justifyContent: "space-between" },
  title: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  paginationContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  pageButton: {
    marginHorizontal: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#774e94ff",
    backgroundColor: "#fff",
  },
  activePageButton: { backgroundColor: "#774e94ff" },
  pageText: { color: "#774e94ff", fontWeight: "bold" },
  activePageText: { color: "#fff" },
  ellipsis: { marginHorizontal: 4, fontSize: 16, color: "#666" },
});

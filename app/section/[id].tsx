import { Ionicons } from '@expo/vector-icons';
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
  status?: string;
  book_cover?: string;
};

export default function SectionPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [sectionName, setSectionName] = useState<string>("");
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<"all" | "title" | "author" | "isbn">("all");

  const inputRef = useRef<TextInput>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 5;

  useEffect(() => {
    api
      .get(`/sections/${id}/books`)
      .then(res => {
        setBooks(res.data.books);
        setFilteredBooks(res.data.books);
        setSectionName(res.data.section.section_name);
      })
      .catch(err => console.error("Axios error:", err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Filter books with trimmed search text
  useEffect(() => {
    const trimmedText = searchText.trim();
    if (!trimmedText) {
      setFilteredBooks(books);
      setCurrentPage(1);
      return;
    }

    const q = trimmedText.toLowerCase();
    const newBooks = books.filter(book => {
      if (filterType === "all") {
        return (
          book.title.toLowerCase().includes(q) ||
          book.author.toLowerCase().includes(q) ||
          (book.isbn?.toLowerCase().includes(q) ?? false)
        );
      } else {
        return book[filterType]?.toLowerCase().includes(q);
      }
    });

    setFilteredBooks(newBooks);
    setCurrentPage(1);
  }, [searchText, filterType, books]);

  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

  const dismissSearch = () => {
    Keyboard.dismiss();
    setSearchText("");
    setFilteredBooks(books);
    inputRef.current?.blur();
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  const hasBooks = filteredBooks.length > 0;

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          disabled={currentPage === 1}
          onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        >
          <Ionicons name="chevron-back-circle" size={28} color={currentPage === 1 ? "#ccc" : "#774e94ff"} />
        </TouchableOpacity>

        <Text style={styles.pageNumber}>
          {currentPage} / {totalPages}
        </Text>

        <TouchableOpacity
          disabled={currentPage === totalPages}
          onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
        >
          <Ionicons name="chevron-forward-circle" size={28} color={currentPage === totalPages ? "#ccc" : "#774e94ff"} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={dismissSearch}>
      <View style={{ flex: 1 }}>
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

        {/* Book list */}
        {hasBooks ? (
          <FlatList
            data={currentBooks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/book/[id]", params: { id: item.id.toString() } })}
              >
                <View style={styles.bookCard}>
                  <Image
                    source={{
                      uri: item.book_cover
                        ? item.book_cover.startsWith("http")
                          ? item.book_cover
                          : `http://192.168.0.103:8000${item.book_cover}`
                        : "https://via.placeholder.com/140x180.png?text=No+Cover",
                    }}
                    style={styles.bookCover}
                  />
                  <View style={styles.bookInfo}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text>Author: {item.author}</Text>
                    <Text>ISBN: {item.isbn}</Text>
                    <Text>Publisher: {item.publisher}</Text>
                    {item.status && (
                      <Text style={{ color: item.status === "Available" ? "green" : "red", fontWeight: "bold" }}>
                        {item.status}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListFooterComponent={renderPagination}
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
    justifyContent: "space-between" 
},
  backButton: { 
    marginRight: 12 },

  sectionHeaderText: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#fff", 
    flexShrink: 1, 
    textAlign: "right" 
},

  searchContainer: { 
    flexDirection: "row", 
    padding: 10, 
    alignItems: "center" 
},
  searchInput: { 
    flex: 1, 
    height: 40, 
    backgroundColor: "#fff", 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: "#ccc" 
},
  picker: { width: 120, marginLeft: 8 },

  bookCard: { 
     flexDirection: "row", 
     padding: 12,
     borderBottomWidth: 1, 
     borderBottomColor: "#ccc" 
    },
  bookCover: { 
    width: 100, 
    height: 150, 
    borderRadius: 8, 
    marginRight: 12 
},
  bookInfo: { 
    flex: 1, 
    justifyContent: "space-between" 
},
  title: { 
    fontWeight: "bold", 
    fontSize: 16, 
    marginBottom: 4 
},

  paginationContainer: { 
    flexDirection: "row", 
    justifyContent: "center", 
    alignItems: "center", 
    paddingVertical: 12 
},
  pageNumber: { 
    marginHorizontal: 12, 
    fontWeight: "bold", 
    fontSize: 16 
},

});

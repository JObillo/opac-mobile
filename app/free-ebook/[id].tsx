import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Book = {
  id: number;
  title: string;
  author: string;
  publisher: string;
  published_year?: string;
  cover: string;
};

const hardcodedBooks: Book[] = [
  { id: 1, title: "Philippine History", author: "Maria Christine N. Halili", publisher: "Rex Book Store", published_year: "2002", cover: "https://via.placeholder.com/120x160.png?text=Book+1" },
  { id: 2, title: "Introduction to Programming", author: "John Doe", publisher: "Tech Books", published_year: "2018", cover: "https://via.placeholder.com/120x160.png?text=Book+2" },
  { id: 3, title: "Modern Science", author: "Jane Smith", publisher: "Edu Publishers", published_year: "2020", cover: "https://via.placeholder.com/120x160.png?text=Book+3" },
  { id: 4, title: "Mathematics Made Easy", author: "Albert Newton", publisher: "Math World", published_year: "2015", cover: "https://via.placeholder.com/120x160.png?text=Book+4" },
  { id: 5, title: "World Literature", author: "William Wordsworth", publisher: "Classic Books", published_year: "2010", cover: "https://via.placeholder.com/120x160.png?text=Book+5" },
];

export default function FreeEbookDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const book = hardcodedBooks.find(b => b.id.toString() === id);

  const handleDownload = () => {
    Alert.alert("Download", "This will download the eBook (placeholder).");
  };

  if (!book) return <Text style={{ flex: 1, textAlign: "center", marginTop: 50 }}>Book not found.</Text>;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Book Info */}
        <View style={styles.infoContainer}>
          <Image source={{ uri: book.cover }} style={styles.bookCover} />
          <Text style={styles.infoTitle}>{book.title}</Text>
          <Text style={styles.infoText}>Author: {book.author}</Text>
          <Text style={styles.infoText}>Publisher: {book.publisher}</Text>
          {book.published_year && <Text style={styles.infoText}>Year: {book.published_year}</Text>}

          <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
            <Text style={styles.downloadText}>Download eBook</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: "#774e94ff" },
  backButton: { marginRight: 12 },
  infoContainer: { padding: 16, alignItems: "center" },
  bookCover: { width: 160, height: 220, borderRadius: 8, marginBottom: 16 },
  infoTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 8, textAlign: "center" },
  infoText: { fontSize: 16, marginBottom: 4, textAlign: "center" },
  downloadButton: { backgroundColor: "#774e94ff", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, marginTop: 12 },
  downloadText: { color: "#fff", fontWeight: "bold" },
});

import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../api/api";

type Book = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  publication_place?: string;
  accession_number?: string;
  call_number?: string;
  book_copies?: number;
  published_year?: string;
  section?: { id: number; section_name: string };
  dewey?: string;
  book_cover?: string;
  status?: string;
};

export default function BookDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/books/${id}`)
      .then(res => setBook(res.data))
      .catch(err => console.error("Axios error:", err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  if (!book) return <Text style={{ flex: 1, textAlign: "center", marginTop: 50 }}>Book not found.</Text>;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          {/* <Text style={styles.headerText}>back</Text> */}
        </View>

        {/* Book Cover */}
        <View style={styles.coverContainer}>
        <Image
            source={{
            uri: book.book_cover
                ? book.book_cover.startsWith("http")
                ? book.book_cover
                : `http://192.168.0.104:8000${book.book_cover}`
                : "https://via.placeholder.com/200x300.png?text=No+Cover",
            }}
            style={styles.bookCover}
        />
        {/* Status below the cover */}
        {book.status && (
        <View style={styles.statusContainer}>
            <Text
            style={[
                styles.statusText,
                { color: book.status === "Available" ? "green" : "red" },
            ]}
            >
            {book.status}
            </Text>
        </View>
        )}

        </View>


        {/* Book Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Title: {book.title}</Text>
          <Text style={styles.infoText}>Author: {book.author}</Text>
          <Text style={styles.infoText}>ISBN: {book.isbn}</Text>
          <Text style={styles.infoText}>Publisher: {book.publisher}</Text>
          {book.publication_place && <Text style={styles.infoText}>Publication Place: {book.publication_place}</Text>}
          {book.accession_number && <Text style={styles.infoText}>Accession Number: {book.accession_number}</Text>}
          {book.call_number && <Text style={styles.infoText}>Call Number: {book.call_number}</Text>}
          {/* {book.book_copies !== undefined && <Text style={styles.infoText}>Book Copies: {book.book_copies}</Text>} */}
          {book.published_year && <Text style={styles.infoText}>Published Year: {book.published_year}</Text>}
          {book.section && <Text style={styles.infoText}>Section: {book.section.section_name}</Text>}
          {book.dewey && <Text style={styles.infoText}>Dewey: {book.dewey}</Text>}

        </View>
      </ScrollView>
    </>
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
  },
  backButton: {
    marginRight: 12,
  },
  headerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    flexShrink: 1,
  },
  coverContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  bookCover: {
    width: 200,
    height: 300,
    borderRadius: 8,
    resizeMode: "cover",
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 4,
  },

statusContainer: {
  borderBottomWidth: 1,
  borderBottomColor: "#ccc",
  width: "80%",      // line width
  alignSelf: "center",
  marginTop: 8,
  marginBottom: 16,
},
statusText: {
  fontWeight: "bold",
  textAlign: "center",
},

});

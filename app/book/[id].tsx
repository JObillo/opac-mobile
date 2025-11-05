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

type BookCopy = {
  accession_number: string;
  status: string;
};

type Book = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  publication_place?: string;
  call_number?: string;
  book_copies?: number;
  year?: string;
  section?: { id: number; name: string };
  dewey?: string;
  subject?: string;
  book_cover?: string;
  status?: string;
  copies?: BookCopy[];
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
          <Text style={styles.infoTitle}>{book.title}</Text>
          <Text style={styles.infoText}>Author: {book.author}</Text>
          <Text style={styles.infoText}>ISBN: {book.isbn}</Text>
          <Text style={styles.infoText}>Publisher: {book.publisher}</Text>
          {book.publication_place && <Text style={styles.infoText}>Place of publication: {book.publication_place}</Text>}
          {book.call_number && <Text style={styles.infoText}>Call Number: {book.call_number}</Text>}
          {book.book_copies !== undefined && <Text style={styles.infoText}>Total Copies: {book.book_copies}</Text>}
          {book.year && <Text style={styles.infoText}>Published Year: {book.year}</Text>}
          {book.section && <Text style={styles.infoText}>Section: {book.section.name}</Text>}
          {/* {book.dewey && <Text style={styles.infoText}>Dewey: {book.dewey}</Text>} */}
          {book.subject && <Text style={styles.infoText}>Subject: {book.subject}</Text>}
        </View>

        {/* Copies List */}
        {book.copies && book.copies.length > 0 && (
          <View style={styles.copiesContainer}>
            <Text style={styles.copiesTitle}>Copies</Text>
            {book.copies.map((copy) => (
              <View key={copy.accession_number} style={styles.copyRow}>
                <Text>Accession No: {copy.accession_number}</Text>
                <Text style={{ color: copy.status === "Available" ? "green" : "red" }}>{copy.status}</Text>
              </View>
            ))}
          </View>
        )}

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
  statusContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    width: "80%",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  statusText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 4,
  },
  copiesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  copiesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  copyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
});

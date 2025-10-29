import { Stack, useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Book = {
  id: number;
  title: string;
  author: string;
  publisher: string;
  published_year?: string;
  cover: string;
};

export default function FreeEbooks() {
  const router = useRouter();

  // Hardcoded free eBooks
  const books: Book[] = [
    {
      id: 1,
      title: "Philippine History",
      author: "Maria Christine N. Halili",
      publisher: "Rex Book Store",
      published_year: "2002",
      cover: "https://via.placeholder.com/120x160.png?text=Book+1",
    },
    {
      id: 2,
      title: "Introduction to Programming",
      author: "John Doe",
      publisher: "Tech Books",
      published_year: "2018",
      cover: "https://via.placeholder.com/120x160.png?text=Book+2",
    },
    {
      id: 3,
      title: "Modern Science",
      author: "Jane Smith",
      publisher: "Edu Publishers",
      published_year: "2020",
      cover: "https://via.placeholder.com/120x160.png?text=Book+3",
    },
    {
      id: 4,
      title: "Mathematics Made Easy",
      author: "Albert Newton",
      publisher: "Math World",
      published_year: "2015",
      cover: "https://via.placeholder.com/120x160.png?text=Book+4",
    },
    {
      id: 5,
      title: "World Literature",
      author: "William Wordsworth",
      publisher: "Classic Books",
      published_year: "2010",
      cover: "https://via.placeholder.com/120x160.png?text=Book+5",
    },
  ];

  return (
    <>
      <Stack.Screen options={{ title: "Free eBooks", headerStyle: { backgroundColor: "#774e94ff" }, headerTintColor: "#fff" }} />

      <ScrollView style={{ flex: 1, backgroundColor: "#fff", padding: 16 }}>
        {books.map((book) => (
          <TouchableOpacity
            key={book.id}
            style={styles.bookCard}
            onPress={() => router.push({ pathname: "/free-ebook/[id]", params: { id: book.id.toString() } })}
          >
            <Image source={{ uri: book.cover }} style={styles.bookCover} />
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>{book.title}</Text>
              <Text style={styles.text}>Author: {book.author}</Text>
              <Text style={styles.text}>Publisher: {book.publisher}</Text>
              {book.published_year && <Text style={styles.text}>Year: {book.published_year}</Text>}

              <TouchableOpacity style={styles.downloadButton}>
                <Text style={styles.downloadText}>Download</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  bookCard: {
    flexDirection: "row",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
  },
  bookCover: {
    width: 120,
    height: 160,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  title: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  text: { fontSize: 14, marginBottom: 2 },
  downloadButton: {
    backgroundColor: "#774e94ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  downloadText: { color: "#fff", fontWeight: "bold" },
});

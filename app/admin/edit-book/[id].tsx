import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import api from "../../../api/api";

export default function EditBook() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [book, setBook] = useState<any>(null);

  useEffect(() => {
    api.get(`/books/${id}`)
      .then(res => setBook(res.data))
      .catch(err => Alert.alert("Error", err.message));
  }, [id]);

  const handleChange = (key: string, value: string) => {
    setBook({ ...book, [key]: value });
  };

  const handleSubmit = () => {
    Alert.alert("Book Updated", "This will later send PUT request to your API.");
    router.back();
  };

  if (!book) return null;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Edit Book</Text>

      {Object.keys(book).map((key) =>
        typeof book[key] === "string" ? (
          <View key={key} style={{ marginBottom: 12 }}>
            <Text style={styles.label}>{key.replaceAll("_", " ")}</Text>
            <TextInput
              style={styles.input}
              value={book[key]}
              onChangeText={(value) => handleChange(key, value)}
            />
          </View>
        ) : null
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Update Book</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 24, fontWeight: "bold", color: "#774e94ff", marginBottom: 20 },
  label: { fontWeight: "600", marginBottom: 4, color: "#444" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 },
  button: {
    backgroundColor: "#774e94ff",
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

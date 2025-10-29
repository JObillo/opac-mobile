import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddBook() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    isbn: "",
    title: "",
    author: "",
    publisher: "",
    book_copies: "",
    accession_number: "",
    call_number: "",
    year: "",
    publication_place: "",
    section_id: "",
    dewey_id: "",
    subject: "",
    date_purchase: "",
    book_price: "",
    other_info: "",
    book_cover: "",
  });

  const handleChange = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  // 📸 Camera + Gallery Picker
  const handleImageOption = async () => {
    Alert.alert("Select Book Cover", "Choose a method to add a book cover", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Gallery", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Camera access is needed to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });
    if (!result.canceled) setForm({ ...form, book_cover: result.assets[0].uri });
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Gallery access is needed to select an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 1,
    });
    if (!result.canceled) setForm({ ...form, book_cover: result.assets[0].uri });
  };

  // 🔍 Fetch Book Info via ISBN
  const fetchBookInfo = async () => {
    if (!form.isbn.trim()) {
      Alert.alert("Missing ISBN", "Please enter an ISBN first.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${form.isbn}&format=json&jscmd=data`
      );
      const data = await res.json();
      const bookKey = `ISBN:${form.isbn}`;
      const book = data[bookKey];

      if (book) {
        setForm({
          ...form,
          title: book.title || form.title,
          author: book.authors?.[0]?.name || form.author,
          publisher: book.publishers?.[0]?.name || form.publisher,
          year: book.publish_date || form.year,
          book_cover: book.cover?.medium || form.book_cover,
        });
        Alert.alert("Book Info Loaded", "Book details have been autofilled.");
      } else {
        Alert.alert("Not Found", "No book data found for this ISBN.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to fetch book data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    Alert.alert("Book Added", "This will later send data to your API.");
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "#fff" },
          headerLeft: () => (
            <Image
              source={{ uri: "http://192.168.0.104:8000/philcstlogo.png" }}
              style={{ width: 40, height: 40, borderRadius: 8, marginLeft: 15 }}
            />
          ),
          headerTitle: "",
          headerRight: () => (
            <Text
              style={{
                color: "#774e94ff",
                fontWeight: "bold",
                fontSize: 18,
                marginRight: 15,
              }}
            >
              Add New Book
            </Text>
          ),
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* 📸 Book Cover */}
        <TouchableOpacity onPress={handleImageOption} style={styles.imagePicker}>
          {form.book_cover ? (
            <Image source={{ uri: form.book_cover }} style={styles.imagePreview} />
          ) : (
            <Text style={{ color: "#774e94ff", textAlign: "center" }}>Select Book Cover</Text>
          )}
        </TouchableOpacity>

        {/* 🔢 ISBN + Fetch Button */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>ISBN</Text>
            <TextInput
              style={styles.input}
              value={form.isbn}
              onChangeText={(value) => handleChange("isbn", value)}
              placeholder="Enter ISBN"
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity style={styles.fetchButton} onPress={fetchBookInfo}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.fetchText}>Fetch</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 🧾 Other fields */}
        {[
          { key: "title", label: "Title" },
          { key: "author", label: "Author" },
          { key: "publisher", label: "Publisher" },
          { key: "book_copies", label: "Book Copies", keyboardType: "numeric" },
          { key: "accession_number", label: "Accession Number" },
          { key: "call_number", label: "Call Number" },
          { key: "year", label: "Year", keyboardType: "numeric" },
          { key: "publication_place", label: "Publication Place" },
          { key: "subject", label: "Subject" },
          { key: "book_price", label: "Book Price", keyboardType: "numeric" },
          { key: "other_info", label: "Other Info" },
        ].map(({ key, label, keyboardType }) => (
          <View key={key} style={{ marginBottom: 12 }}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={form[key as keyof typeof form]}
              onChangeText={(value) => handleChange(key, value)}
              placeholder={`Enter ${label}`}
              keyboardType={keyboardType as any}
            />
          </View>
        ))}

        {/* Section Dropdown */}
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.label}>Section</Text>
          <Picker
            selectedValue={form.section_id}
            style={styles.input}
            onValueChange={(value) => handleChange("section_id", value)}
          >
            <Picker.Item label="Select Section" value="" />
            <Picker.Item label="Fiction" value="1" />
            <Picker.Item label="Science" value="2" />
            <Picker.Item label="History" value="3" />
          </Picker>
        </View>

        {/* Dewey Dropdown */}
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.label}>Dewey</Text>
          <Picker
            selectedValue={form.dewey_id}
            style={styles.input}
            onValueChange={(value) => handleChange("dewey_id", value)}
          >
            <Picker.Item label="Select Dewey" value="" />
            <Picker.Item label="000 – General Works" value="000" />
            <Picker.Item label="100 – Philosophy" value="100" />
            <Picker.Item label="200 – Religion" value="200" />
          </Picker>
        </View>

        {/* Date Purchase */}
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.label}>Date Purchase</Text>
          <TextInput
            style={styles.input}
            value={form.date_purchase}
            onChangeText={(value) => handleChange("date_purchase", value)}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={{ marginTop: 20, marginBottom: 40 }}>
          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Save Book</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  row: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12 },
  label: { fontWeight: "600", marginBottom: 4, color: "#444" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },
  fetchButton: {
    backgroundColor: "#774e94ff",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignSelf: "flex-end",
  },
  fetchText: { color: "#fff", fontWeight: "bold" },
  imagePicker: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 160,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    marginBottom: 20,
  },
  imagePreview: { width: 120, height: 160, borderRadius: 8 },
  button: {
    backgroundColor: "#774e94ff",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

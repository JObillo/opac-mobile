import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import api from "../../../api/api";

type Section = { id: number; section_name: string };
type Dewey = { id: number; dewey_number: string; dewey_classification: string };

type BookForm = {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  book_copies: string;
  accession_numbers: string[];
  call_number: string;
  year: string;
  publication_place: string;
  section_id: string;
  dewey_id: string;
  subject: string;
  date_purchase: string;
  book_price: string;
  other_info: string;
  book_cover: string;
};

export default function EditBook() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [deweys, setDeweys] = useState<Dewey[]>([]);
  const [token, setToken] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const [form, setForm] = useState<BookForm>({
    isbn: "",
    title: "",
    author: "",
    publisher: "",
    book_copies: "1",
    accession_numbers: [""],
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatISBN = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 13);
    let formatted = "";
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length > 3) formatted += "-" + digits[3];
    if (digits.length > 4) formatted += "-" + digits.slice(4, 9);
    if (digits.length > 9) formatted += "-" + digits.slice(9, 12);
    if (digits.length > 12) formatted += "-" + digits[12];
    return formatted;
  };

  // Load token, sections, deweys
  useEffect(() => {
    const loadData = async () => {
      const t = await AsyncStorage.getItem("token");
      if (t) setToken(t);

      fetch("http://192.168.0.104:8000/api/sections")
        .then((res) => res.json())
        .then(setSections)
        .catch(() => Alert.alert("Error", "Failed to load sections"));

      fetch("http://192.168.0.104:8000/api/deweys")
        .then((res) => res.json())
        .then(setDeweys)
        .catch(() => Alert.alert("Error", "Failed to load deweys"));
    };
    loadData();
  }, []);

  // Fetch book data
  useEffect(() => {
    if (!id) return;

    const fetchBook = async () => {
      try {
        const res = await api.get(`/books/${id}`);
        const data = res.data;

        const cover =
          typeof data.book_cover === "string"
            ? data.book_cover.startsWith("http")
              ? data.book_cover
              : `http://192.168.0.104:8000${data.book_cover}`
            : "";

        let accessionNumbers: string[] = [];
        if (Array.isArray(data.accession_numbers) && data.accession_numbers.length > 0) {
          accessionNumbers = data.accession_numbers.map((a: any) =>
            typeof a === "string" ? a : a.number || ""
          );
        } else {
          accessionNumbers = [""];
        }

        setForm({
          isbn: data.isbn || "",
          title: data.title || "",
          author: data.author || "",
          publisher: data.publisher || "",
          book_copies: data.book_copies?.toString() || "1",
          accession_numbers: accessionNumbers,
          call_number: data.call_number || "",
          year: data.year?.toString() || "",
          publication_place: data.publication_place || "",
          section_id: data.section_id?.toString() || "",
          dewey_id: data.dewey_id?.toString() || "",
          subject: data.subject || "",
          date_purchase: data.date_purchase || "",
          book_price: data.book_price?.toString() || "",
          other_info: data.other_info || "",
          book_cover: cover,
        });
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to fetch book details");
      }
    };

    fetchBook();
  }, [id]);

  const handleChange = (key: keyof BookForm, value: string) => {
    if (key === "isbn") value = formatISBN(value.replace(/\D/g, ""));
    if (["book_copies", "book_price", "year"].includes(key)) value = value.replace(/\D/g, "");
    if (key === "year") value = value.slice(0, 4);
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleAccessionChange = (index: number, value: string) => {
    const updated = [...form.accession_numbers];
    updated[index] = value;
    setForm((prev) => ({ ...prev, accession_numbers: updated }));
  };

  const handleAddAccession = () =>
    setForm((prev) => ({ ...prev, accession_numbers: [...prev.accession_numbers, ""] }));

  const handleRemoveAccession = (index: number) => {
    const updated = [...form.accession_numbers];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, accession_numbers: updated }));
  };

  const handleImageOption = async () => {
    Alert.alert("Select Book Cover", "Choose a method", [
      { text: "Take Photo", onPress: takePhoto },
      { text: "Choose from Gallery", onPress: pickImage },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const takePhoto = async () => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) return Alert.alert("Permission needed", "Camera access required.");
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [3, 4], quality: 1 });
    if (!result.canceled) setForm((prev) => ({ ...prev, book_cover: result.assets[0].uri }));
  };

  const pickImage = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) return Alert.alert("Permission needed", "Gallery access required.");
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [3, 4], quality: 1 });
    if (!result.canceled) setForm((prev) => ({ ...prev, book_cover: result.assets[0].uri }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate)
      setForm((prev) => ({ ...prev, date_purchase: selectedDate.toISOString().split("T")[0] }));
  };

  const handleSubmit = async () => {
    if (!token) return Alert.alert("Error", "You must be logged in to update a book.");

    const requiredFields: (keyof BookForm)[] = [
      "isbn", "title", "author", "publisher",
      "book_copies", "call_number", "subject", "date_purchase", "book_price", "other_info"
    ];

    const validationErrors: Record<string, string> = {};

    requiredFields.forEach((field) => {
      const value = form[field];
      if (Array.isArray(value)) {
        if (value.length === 0 || value.some(v => v.trim() === "")) {
          validationErrors[field] = `${field.replace("_", " ")} is required`;
        }
      } else if (typeof value === "string") {
        if (value.trim() === "") {
          validationErrors[field] = `${field.replace("_", " ")} is required`;
        }
      }
    });

    if (form.accession_numbers.length === 0 || form.accession_numbers.some(a => a.trim() === "")) {
      validationErrors.accession_numbers = "All accession numbers are required";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return Alert.alert("Validation Error", "Please fix all required fields.");
    }

    // ✅ Build FormData safely
    const data = new FormData();
    const numericFields: (keyof BookForm)[] = ["book_copies", "year", "section_id", "dewey_id", "book_price"];

    for (const key in form) {
      const value = form[key as keyof BookForm];

      if (key === "accession_numbers" && Array.isArray(value)) {
        value
          .filter((num: string) => num.trim() !== "")
          .forEach((num: string, i: number) => data.append(`accession_numbers[${i}]`, num.trim()));
      } else if (key === "book_cover" && typeof value === "string" && value.trim() !== "") {
        if (value.startsWith("http")) {
          data.append("book_cover", value);
        } else {
          const filename = value.split("/").pop() || "cover.jpg";
          data.append("book_cover", { uri: value, name: filename, type: "image/jpeg" } as any);
        }
      } else if (numericFields.includes(key as keyof BookForm)) {
        if (typeof value === "string") data.append(key, (Number(value) || 0).toString());
      } else if (typeof value === "string" && value.trim() !== "") {
        data.append(key, value);
      }
    }

    setLoading(true);

    try {
      await api.put(`/books/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert("Success", "Book updated successfully!");
      router.replace({ pathname: "/admin/homepage" });
    } catch (err: any) {
      console.error(err);
      Alert.alert(
        "Error",
        err.response?.data?.message || err.message || "Failed to update book"
      );
    } finally {
      setLoading(false);
    }
  };

  const formKeys: (keyof BookForm)[] = [
    "isbn", "title", "author", "publisher",
    "book_copies", "call_number", "year",
    "publication_place", "subject", "book_price", "other_info"
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: "#774e94ff" },
          headerTitle: () => (
            <View style={{ flex: 1, alignItems: "flex-end", paddingRight: 10 }}>
              <Text style={{ fontWeight: "bold", fontSize: 18, color: "#fff" }}>Edit Book</Text>
            </View>
          ),
          headerTintColor: "#fff",
        }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <KeyboardAwareScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} enableOnAndroid={true}>
          <TouchableOpacity onPress={handleImageOption} style={styles.imagePicker}>
            {form.book_cover ? (
              <Image source={{ uri: form.book_cover }} style={styles.imagePreview} />
            ) : (
              <Text style={{ color: "#774e94ff", textAlign: "center" }}>Select Book Cover</Text>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={form.isbn}
              onChangeText={(v) => handleChange("isbn", v)}
              placeholder="111-1-11111-111-1"
              keyboardType="numeric"
            />
          </View>

          {formKeys.filter((k) => k !== "isbn").map((key, index) => (
            <View key={key} style={{ marginBottom: 12 }}>
              <Text style={styles.label}>{key.replace("_", " ").toUpperCase()}</Text>
              <TextInput
                ref={(el) => { inputRefs.current[index] = el; }}
                style={styles.input}
                value={form[key] as string}
                onChangeText={(v) => handleChange(key, v)}
                keyboardType={["book_copies", "book_price", "year"].includes(key) ? "numeric" : "default"}
                maxLength={key === "year" ? 4 : undefined}
              />
            </View>
          ))}

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Date of Purchase</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text>{form.date_purchase || "Select date"}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={form.date_purchase ? new Date(form.date_purchase) : new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
              />
            )}
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Section</Text>
            <Picker
              selectedValue={form.section_id}
              style={styles.input}
              onValueChange={(v) => handleChange("section_id", v)}
            >
              <Picker.Item label="Select Section" value="" />
              {sections.map((s) => (
                <Picker.Item key={s.id} label={s.section_name} value={s.id.toString()} />
              ))}
            </Picker>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Dewey</Text>
            <Picker
              selectedValue={form.dewey_id}
              style={styles.input}
              onValueChange={(v) => handleChange("dewey_id", v)}
            >
              <Picker.Item label="Select Dewey" value="" />
              {deweys.map((d) => (
                <Picker.Item key={d.id} label={`${d.dewey_number} – ${d.dewey_classification}`} value={d.id.toString()} />
              ))}
            </Picker>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Accession Numbers</Text>
            {form.accession_numbers.map((acc, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={acc}
                  onChangeText={(v) => handleAccessionChange(i, v)}
                  placeholder={`Accession #${i + 1}`}
                />
                <TouchableOpacity onPress={() => handleRemoveAccession(i)} style={{ marginLeft: 6 }}>
                  <Text style={{ color: "red" }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={handleAddAccession}>
              <Text style={{ color: "#774e94ff", fontWeight: "bold" }}>+ Add Accession</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>{loading ? "Saving..." : "Update Book"}</Text>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: "600", marginBottom: 4, color: "#444" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, backgroundColor: "#fff" },
  imagePicker: { alignSelf: "center", alignItems: "center", justifyContent: "center", width: 120, height: 160, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, backgroundColor: "#f9f9f9", marginBottom: 20 },
  imagePreview: { width: 120, height: 160, borderRadius: 8 },
  button: { backgroundColor: "#774e94ff", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

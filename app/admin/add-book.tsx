import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

type Section = { id: string; section_name: string };
type Dewey = { id: string; dewey_number: string; dewey_classification: string };

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

export default function AddBook() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [deweys, setDeweys] = useState<Dewey[]>([]);
  const [token, setToken] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const [form, setForm] = useState({
    isbn: "",
    title: "",
    author: "",
    publisher: "",
    book_copies: "1",
    accession_numbers: [""] as string[],
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

  const handleChange = (key: string, value: string) => {
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
    if (errors[`accession_${index}`]) setErrors((prev) => ({ ...prev, [`accession_${index}`]: "" }));
  };

  const handleAddAccession = () =>
    setForm((prev) => ({ ...prev, accession_numbers: [...prev.accession_numbers, ""] }));

  const handleRemoveAccession = (index: number) => {
    const updated = [...form.accession_numbers];
    updated.splice(index, 1);
    setForm((prev) => ({ ...prev, accession_numbers: updated }));
    const updatedErrors = { ...errors };
    delete updatedErrors[`accession_${index}`];
    setErrors(updatedErrors);
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
    if (errors.date_purchase) setErrors((prev) => ({ ...prev, date_purchase: "" }));
  };

  const fetchBookByISBN = async (isbn: string) => {
    const cleanIsbn = isbn.replace(/\D/g, "");
    if (cleanIsbn.length < 10) return Alert.alert("Error", "Please enter a valid ISBN.");

    try {
      const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`);
      const data = await response.json();
      if (!data.items || data.items.length === 0) return Alert.alert("Error", "No book found for this ISBN.");

      const info = data.items[0].volumeInfo;

      setForm((prev) => ({
        ...prev,
        title: info.title || prev.title,
        author: info.authors ? info.authors.join(", ") : prev.author,
        publisher: info.publisher || prev.publisher,
        year: info.publishedDate ? info.publishedDate.slice(0, 4) : prev.year,
        subject: info.categories ? info.categories.join(", ") : prev.subject,
        book_cover: info.imageLinks?.thumbnail || prev.book_cover,
        other_info: `${info.pageCount ? info.pageCount + " pages" : ""}` || prev.other_info,
      }));

      Alert.alert("Success", "Book info loaded from Google Books!");
    } catch {
      Alert.alert("Error", "Failed to fetch book info.");
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title) newErrors.title = "Title is required.";
    if (!form.author) newErrors.author = "Author is required.";
    if (!form.isbn) newErrors.isbn = "ISBN is required.";
    else if (form.isbn.replace(/\D/g, "").length !== 13) newErrors.isbn = "ISBN must be 13 digits.";
    if (!form.date_purchase) newErrors.date_purchase = "Select a date.";
    if (!form.section_id) newErrors.section_id = "Select a section.";
    if (!form.dewey_id) newErrors.dewey_id = "Select a Dewey.";
    if (form.accession_numbers.length === 0) newErrors.accession_numbers = "Add at least 1 accession number.";

    const seen: Record<string, number> = {};
    form.accession_numbers.forEach((num, idx) => {
      if (!num.trim()) newErrors[`accession_${idx}`] = "Cannot be empty.";
      else if (seen[num]) newErrors[`accession_${idx}`] = "Duplicate accession number.";
      else seen[num] = 1;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!token) return Alert.alert("Error", "You must be logged in to add a book.");
    if (!validateForm()) return;

    const data = new FormData();

    try {
      // Handle cover image
      if (form.book_cover) {
        let uri = form.book_cover;

        // If it's a remote URL, download it first
        if (uri.startsWith("http")) {
            const fileUri = (FileSystem as any).cacheDirectory + "cover.jpg";
            await FileSystem.downloadAsync(uri, fileUri);
          uri = fileUri;
        }

        const filename = uri.split("/").pop() || "cover.jpg";
        data.append("book_cover", { uri, name: filename, type: "image/jpeg" } as any);
      }

      // Append other fields
      Object.keys(form).forEach((key) => {
        const value = form[key as keyof typeof form];
        if (key === "accession_numbers") {
          form.accession_numbers.forEach((num) => data.append("accession_numbers[]", num));
        } else if (key !== "book_cover") {
          data.append(key, value as string);
        }
      });

      setLoading(true);

      const res = await fetch("http://192.168.0.104:8000/api/books", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });

      const contentType = res.headers.get("content-type") || "";
      let json = {};
      if (contentType.includes("application/json")) json = await res.json();

      if (!res.ok) return Alert.alert("Error", JSON.stringify(json));

      Alert.alert("Success", "Book added successfully!");
      router.replace("/admin/homepage");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const formKeys: (keyof typeof form)[] = [
    "isbn", "title", "author", "publisher", "book_copies",
    "call_number", "year", "publication_place", "subject", "book_price", "other_info"
  ];

  return (
    <>
      <Stack.Screen
          options={{
            headerStyle: {
              backgroundColor: "#774e94ff",
            },
            headerTitle: () => (
              <View style={{ flex: 1, alignItems: "flex-end", paddingRight: 10 }}>
                <Text style={{ fontWeight: "bold", fontSize: 18, color: "#ffffffff" }}>Add New Book</Text>
              </View>
            ),
            headerTintColor: "#ffffffff",
          }}
        />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}>
        <KeyboardAwareScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} enableOnAndroid={true}>

          <TouchableOpacity onPress={handleImageOption} style={styles.imagePicker}>
            {form.book_cover ? <Image source={{ uri: form.book_cover }} style={styles.imagePreview} /> : <Text style={{ color: "#774e94ff", textAlign: "center" }}>Select Book Cover</Text>}
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={form.isbn}
              onChangeText={(v) => handleChange("isbn", v)}
              placeholder="111-1-11111-111-1"
              keyboardType="numeric"
            />
            <TouchableOpacity style={{ marginLeft: 8, backgroundColor: "#774e94ff", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 6 }} onPress={() => fetchBookByISBN(form.isbn)}>
              <Text style={{ color: "#fff" }}>Fetch</Text>
            </TouchableOpacity>
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
              {errors[key] ? <Text style={styles.errorText}>{errors[key]}</Text> : null}
            </View>
          ))}

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Date of Purchase</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
              <Text>{form.date_purchase || "Select date"}</Text>
            </TouchableOpacity>
            {errors.date_purchase ? <Text style={styles.errorText}>{errors.date_purchase}</Text> : null}
            {showDatePicker && <DateTimePicker value={form.date_purchase ? new Date(form.date_purchase) : new Date()} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={handleDateChange} />}
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Section</Text>
            <Picker selectedValue={form.section_id} style={styles.input} onValueChange={(v) => handleChange("section_id", v)}>
              <Picker.Item label="Select Section" value="" />
              {sections.map((s) => <Picker.Item key={s.id} label={s.section_name} value={s.id} />)}
            </Picker>
            {errors.section_id ? <Text style={styles.errorText}>{errors.section_id}</Text> : null}
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text style={styles.label}>Dewey</Text>
            <Picker selectedValue={form.dewey_id} style={styles.input} onValueChange={(v) => handleChange("dewey_id", v)}>
              <Picker.Item label="Select Dewey" value="" />
              {deweys.map((d) => <Picker.Item key={d.id} label={`${d.dewey_number} – ${d.dewey_classification}`} value={d.id} />)}
            </Picker>
            {errors.dewey_id ? <Text style={styles.errorText}>{errors.dewey_id}</Text> : null}
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
                {errors[`accession_${i}`] ? <Text style={styles.errorText}>{errors[`accession_${i}`]}</Text> : null}
              </View>
            ))}
            <TouchableOpacity onPress={handleAddAccession}>
              <Text style={{ color: "#774e94ff", fontWeight: "bold" }}>+ Add Accession</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>{loading ? "Saving..." : "Save Book"}</Text>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  label: { fontWeight: "600", marginBottom: 4, color: "#444" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, backgroundColor: "#fff" },
  imagePicker: { alignSelf: "center", alignItems: "center", justifyContent: "center", width: 120, height: 160, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, backgroundColor: "#f9f9f9", marginBottom: 20 },
  imagePreview: { width: 120, height: 160, borderRadius: 8 },
  button: { backgroundColor: "#774e94ff", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  errorText: { color: "red", marginTop: 2 },
});

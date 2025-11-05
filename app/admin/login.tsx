import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secure, setSecure] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  // Refs for inputs
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = async () => {
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://192.168.0.104:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(result?.message || "Invalid email or password.");
        return;
      }

      await AsyncStorage.setItem("token", result.access_token);
      router.replace("/admin/homepage");
    } catch (error: any) {
      console.error("Login Error:", error);
      setErrorMessage(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Logo */}
            <Image
              source={{ uri: "http://192.168.0.104:8000/philcstlogo.png" }}
              style={styles.logo}
            />

            <Text style={styles.title}>Admin Login</Text>

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            {/* Email Input */}
            <TextInput
              ref={emailRef}
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()} // Move to password
            />

            {/* Password Input */}
            <View style={styles.passwordWrapper}>
              <TextInput
                ref={passwordRef}
                style={[styles.input, { paddingRight: 44 }]}
                placeholder="Password"
                secureTextEntry={secure}
                value={password}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin} // Submit login on enter
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setSecure((s) => !s)}
                accessibilityLabel={secure ? "Show password" : "Hide password"}
              >
                <Ionicons
                  name={secure ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginText}>Login</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: "center" },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
    alignItems: "center", // center logo and title
  },
  logo: { width: 120, height: 120, marginBottom: 24, borderRadius: 16 },
  title: { fontSize: 28, fontWeight: "bold", color: "#774e94ff", marginBottom: 16, textAlign: "center" },
  errorText: { color: "red", marginBottom: 12, textAlign: "center" },
  input: { width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 16, backgroundColor: "#fff" },
  passwordWrapper: { position: "relative", width: "100%", marginBottom: 16 },
  eyeButton: { position: "absolute", right: 10, top: 10, height: 36, width: 36, justifyContent: "center", alignItems: "center" },
  loginButton: { backgroundColor: "#774e94ff", padding: 14, borderRadius: 10, alignItems: "center", width: "100%" },
  loginText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

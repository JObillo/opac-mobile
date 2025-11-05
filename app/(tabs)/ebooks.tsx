import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../api/api";

type Ebook = {
  id: number;
  title: string;
  author: string;
  year?: string | number;
  cover?: string;
  file_url: string;
};

type EbookResponse = {
  data: Ebook[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
};

const EbookCard = React.memo(
  ({
    ebook,
    onDownload,
  }: {
    ebook: Ebook;
    onDownload: (url: string) => void;
  }) => (
    <View style={styles.ebookCard}>
      <Image
        source={{
          uri:
            ebook.cover ?? "https://via.placeholder.com/120x160.png?text=No+Cover",
        }}
        style={styles.ebookCover}
        resizeMode="cover"
      />
      <View style={styles.ebookInfo}>
        <Text numberOfLines={2} style={styles.ebookTitle}>
          {ebook.title}
        </Text>
        <Text numberOfLines={1} style={styles.ebookAuthor}>
          {ebook.author}
        </Text>
        {ebook.year && <Text style={styles.ebookYear}>{ebook.year}</Text>}
        <TouchableOpacity
          onPress={() => onDownload(ebook.file_url)}
          style={styles.downloadButton}
          activeOpacity={0.8}
        >
          <Text style={styles.downloadText}>Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
);

export default function FreeEbooksPage() {
  const router = useRouter();
  const listRef = useRef<FlatList>(null);

  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState<"all" | "title" | "author">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const ebooksPerPage = 5;

  const fetchEbooks = async (page = 1, search = "", filter = "all") => {
    try {
      setLoading(true);
      const res = await api.get<EbookResponse>("/mobile/ebooks", {
        params: { page, perPage: ebooksPerPage, search, filter },
      });
      setEbooks(res.data.data);
      setCurrentPage(res.data.current_page);
      setTotalPages(res.data.last_page);
    } catch (err) {
      console.error("❌ Failed to fetch eBooks:", err);
      Alert.alert("Error", "Failed to fetch eBooks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEbooks(1);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchEbooks(1, searchText.trim(), filterType);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchText, filterType]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    fetchEbooks(page, searchText.trim(), filterType);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleDownload = useCallback((url: string) => {
    const absoluteUrl = url.startsWith("http") ? url : `http://192.168.0.104:8000${url}`;
    Linking.canOpenURL(absoluteUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(absoluteUrl);
        } else {
          Alert.alert("Error", "Cannot open this URL in your browser.");
        }
      })
      .catch((err) => {
        console.error("Failed to open URL:", err);
        Alert.alert("Error", "Failed to open eBook in browser.");
      });
  }, []);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxButtons = 5;
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <TouchableOpacity
          key={i}
          onPress={() => handlePageChange(i)}
          disabled={i === currentPage}
          style={[styles.pageButton, i === currentPage && styles.activePageButton]}
        >
          <Text style={[styles.pageText, i === currentPage && styles.activePageText]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          disabled={currentPage === 1}
          onPress={() => handlePageChange(currentPage - 1)}
        >
          <Ionicons
            name="chevron-back-circle"
            size={36}
            color={currentPage === 1 ? "#ccc" : "#774e94ff"}
          />
        </TouchableOpacity>

        {startPage > 1 && (
          <>
            <TouchableOpacity onPress={() => handlePageChange(1)} style={styles.pageButton}>
              <Text style={styles.pageText}>1</Text>
            </TouchableOpacity>
            {startPage > 2 && <Text style={styles.ellipsis}>...</Text>}
          </>
        )}

        {pages}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <Text style={styles.ellipsis}>...</Text>}
            <TouchableOpacity onPress={() => handlePageChange(totalPages)} style={styles.pageButton}>
              <Text style={styles.pageText}>{totalPages}</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          disabled={currentPage === totalPages}
          onPress={() => handlePageChange(currentPage + 1)}
        >
          <Ionicons
            name="chevron-forward-circle"
            size={36}
            color={currentPage === totalPages ? "#ccc" : "#774e94ff"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading)
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f6f6f6" }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Image
            source={{
              uri: "http://192.168.0.104:8000/philcstlogo.png",
            }}
            style={styles.logo}
          />
          <Text style={styles.libraryName}>Philcst Opac Library</Text>
        </View>
        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => router.push("/admin/login" as never)}
        >
          <Text style={styles.adminButtonText}>Login</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={filterType === "all" ? "Search eBooks..." : `Search by ${filterType}`}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
        <Picker
          selectedValue={filterType}
          style={styles.picker}
          onValueChange={(value) => setFilterType(value)}
        >
          <Picker.Item label="All" value="all" />
          <Picker.Item label="Title" value="title" />
          <Picker.Item label="Author" value="author" />
        </Picker>
      </View>

      {/* eBooks list + pagination */}
      <FlatList
        ref={listRef}
        data={ebooks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <EbookCard ebook={item} onDownload={handleDownload} />
        )}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={4}
        initialNumToRender={4}
        windowSize={6}
        getItemLayout={(_, index) => ({
          length: 180,
          offset: 180 * index,
          index,
        })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ color: "#666", fontSize: 16 }}>No eBooks found.</Text>
          </View>
        }
        ListFooterComponent={renderPagination}
        contentContainerStyle={{ paddingBottom: 1 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#fff",
  },
  logo: { width: 40, height: 40, borderRadius: 8, marginTop: 30 },
  libraryName: {
    color: "#774e94ff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 12,
    marginTop: 30,
  },
  adminButton: {
    backgroundColor: "#774e94ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 30,
  },
  adminButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  searchContainer: { flexDirection: "row", alignItems: "center", padding: 10 },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  picker: { width: 120, marginLeft: 8 },
  ebookCard: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#fff",
  },
  ebookCover: {
    width: 120,
    height: 160,
    borderRadius: 8,
    marginRight: 12,
  },
  ebookInfo: { flex: 1, justifyContent: "space-between" },
  ebookTitle: { fontWeight: "bold", fontSize: 16 },
  ebookAuthor: { color: "#666", fontSize: 14, marginVertical: 2 },
  ebookYear: { color: "#666", fontSize: 12 },
  downloadButton: {
    marginTop: 6,
    backgroundColor: "#774e94ff",
    paddingVertical: 6,
    borderRadius: 6,
    width: 100,
    alignItems: "center",
  },
  downloadText: { color: "#fff", fontSize: 14, fontWeight: "bold" },

  paginationContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderColor: "#ccc",
  },
  pageButton: {
    marginHorizontal: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#774e94ff",
    backgroundColor: "#fff",
  },
  activePageButton: {
    backgroundColor: "#774e94ff",
  },
  pageText: {
    color: "#774e94ff",
    fontWeight: "bold",
  },
  activePageText: {
    color: "#fff",
  },
  ellipsis: {
    marginHorizontal: 4,
    fontSize: 16,
    color: "#666",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

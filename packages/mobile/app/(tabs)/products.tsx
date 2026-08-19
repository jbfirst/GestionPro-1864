import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Loading,
  ScreenHeader,
  SectionTitle,
  display,
  sans,
} from "@/components/ui";
import { useCreateProduct, useProducts, useRestock } from "@/queries/products";
import { errorMessage, formatMoney } from "@/lib/format";

export default function ProductsScreen() {
  const colors = useColors();
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState("");
  const [name, setName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("5");
  const [error, setError] = useState("");

  const products = useProducts(search.trim() || undefined);
  const createProduct = useCreateProduct();
  const restock = useRestock();

  function submitProduct() {
    setError("");
    if (name.trim().length < 2) {
      setError("Le nom du produit est trop court.");
      return;
    }
    const sale = Number(salePrice.replace(",", "."));
    const purchase = Number(purchasePrice.replace(",", ".") || "0");
    if (!Number.isFinite(sale) || sale <= 0) {
      setError("Le prix de vente doit être supérieur à 0.");
      return;
    }
    createProduct.mutate(
      {
        name: name.trim(),
        purchasePrice: Number.isFinite(purchase) ? purchase : 0,
        salePrice: sale,
        stock: Number(stock.replace(",", ".") || "0"),
        minStock: Number(minStock.replace(",", ".") || "0"),
      },
      {
        onSuccess: () => {
          setName("");
          setPurchasePrice("");
          setSalePrice("");
          setStock("");
          setMinStock("5");
          setOpenForm(false);
        },
        onError: (err) => setError(errorMessage(err)),
      },
    );
  }

  function submitRestock(id: string) {
    const qty = Number(restockQty.replace(",", "."));
    if (!Number.isFinite(qty) || qty <= 0) return;
    restock.mutate(
      { id, quantity: qty },
      {
        onSuccess: () => {
          setRestockId(null);
          setRestockQty("");
        },
      },
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={products.isFetching}
              onRefresh={() => products.refetch()}
              tintColor={colors.accent}
            />
          }
        >
          <ScreenHeader title="Stock" subtitle="Produits, prix et réapprovisionnement." />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingHorizontal: 12,
              height: 46,
            }}
          >
            <Ionicons name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher un produit"
              placeholderTextColor={colors.mutedForeground}
              style={{ flex: 1, color: colors.foreground, fontSize: 15 }}
            />
          </View>

          <Button
            label={openForm ? "Annuler" : "Nouveau produit"}
            variant={openForm ? "outline" : "accent"}
            icon={openForm ? "close" : "add"}
            onPress={() => setOpenForm(!openForm)}
          />

          {openForm ? (
            <Card style={{ gap: 12 }}>
              <SectionTitle>Nouveau produit</SectionTitle>
              <Field label="Nom" value={name} onChangeText={setName} placeholder="Ex. Sac de riz 25kg" />
              <Field
                label="Prix d'achat (FCFA)"
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                placeholder="0"
                keyboardType="numeric"
              />
              <Field
                label="Prix de vente (FCFA)"
                value={salePrice}
                onChangeText={setSalePrice}
                placeholder="0"
                keyboardType="numeric"
              />
              <Field
                label="Stock initial"
                value={stock}
                onChangeText={setStock}
                placeholder="0"
                keyboardType="numeric"
              />
              <Field
                label="Stock minimum"
                value={minStock}
                onChangeText={setMinStock}
                placeholder="5"
                keyboardType="numeric"
              />
              {error ? (
                <Text style={{ fontFamily: sans, fontSize: 13, color: colors.destructive }}>
                  {error}
                </Text>
              ) : null}
              <Button label="Enregistrer" onPress={submitProduct} loading={createProduct.isPending} />
            </Card>
          ) : null}

          {products.isLoading ? (
            <Loading />
          ) : products.data?.length ? (
            products.data.map((p) => {
              const low = p.stock <= p.minStock;
              return (
                <Card key={p.id}>
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text
                        style={{
                          fontFamily: display,
                          fontSize: 16,
                          fontWeight: "700",
                          color: colors.foreground,
                        }}
                      >
                        {p.name}
                      </Text>
                      <Text style={{ fontFamily: sans, fontSize: 12, color: colors.mutedForeground }}>
                        {p.categoryName ?? "Sans catégorie"} · achat {formatMoney(p.purchasePrice)}
                      </Text>
                      <Text
                        style={{
                          fontFamily: sans,
                          fontSize: 14,
                          fontWeight: "700",
                          color: colors.foreground,
                        }}
                      >
                        {formatMoney(p.salePrice)}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 6 }}>
                      <Badge
                        label={`Stock ${p.stock}`}
                        tone={p.stock === 0 ? "danger" : low ? "warning" : "success"}
                      />
                      <Pressable
                        onPress={() => {
                          setRestockId(restockId === p.id ? null : p.id);
                          setRestockQty("");
                        }}
                      >
                        <Text style={{ fontFamily: sans, fontSize: 13, color: colors.accent }}>
                          Réappro.
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {restockId === p.id ? (
                    <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                      <TextInput
                        value={restockQty}
                        onChangeText={setRestockQty}
                        placeholder="Quantité à ajouter"
                        placeholderTextColor={colors.mutedForeground}
                        keyboardType="numeric"
                        style={{
                          flex: 1,
                          height: 44,
                          borderWidth: 1,
                          borderColor: colors.border,
                          borderRadius: 12,
                          paddingHorizontal: 12,
                          color: colors.foreground,
                        }}
                      />
                      <Button
                        label="Ajouter"
                        variant="accent"
                        onPress={() => submitRestock(p.id)}
                        loading={restock.isPending}
                        style={{ height: 44, paddingHorizontal: 14 }}
                      />
                    </View>
                  ) : null}
                </Card>
              );
            })
          ) : (
            <EmptyState
              title="Aucun produit"
              description="Ajoutez votre premier produit pour suivre votre stock."
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

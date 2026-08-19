import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  Loading,
  ScreenHeader,
  SectionTitle,
  display,
  sans,
} from "@/components/ui";
import { useProducts } from "@/queries/products";
import { useCreateSale, useCustomerOptions } from "@/queries/sales";
import { errorMessage, formatMoney } from "@/lib/format";

type CartLine = { productId: string; name: string; unitPrice: number; quantity: number; stock: number };

export default function SaleScreen() {
  const colors = useColors();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const products = useProducts(search.trim() || undefined);
  const customers = useCustomerOptions();
  const createSale = useCreateSale();

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart],
  );

  function add(product: { id: string; name: string; salePrice: number; stock: number }) {
    setMessage(null);
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((l) =>
          l.productId === product.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      if (product.stock <= 0) return prev;
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.salePrice,
          quantity: 1,
          stock: product.stock,
        },
      ];
    });
  }

  function step(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.productId === productId
            ? { ...l, quantity: Math.min(l.stock, Math.max(0, l.quantity + delta)) }
            : l,
        )
        .filter((l) => l.quantity > 0),
    );
  }

  function submit() {
    setMessage(null);
    if (cart.length === 0) {
      setMessage({ tone: "error", text: "Ajoutez au moins un produit." });
      return;
    }
    createSale.mutate(
      {
        items: cart.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
        customerId: customerId ?? undefined,
        note: note.trim() || undefined,
      },
      {
        onSuccess: () => {
          setCart([]);
          setNote("");
          setCustomerId(null);
          setMessage({ tone: "ok", text: "Vente enregistrée. Le stock a été mis à jour." });
        },
        onError: (err) => setMessage({ tone: "error", text: errorMessage(err) }),
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
        >
          <ScreenHeader title="Nouvelle vente" subtitle="Le stock se met à jour automatiquement." />

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

          <Card>
            <SectionTitle>Produits</SectionTitle>
            {products.isLoading ? (
              <Loading />
            ) : products.data?.length ? (
              products.data.slice(0, 25).map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() => add(p)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                    opacity: pressed ? 0.6 : p.stock <= 0 ? 0.45 : 1,
                  })}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontFamily: sans, fontSize: 14, color: colors.foreground }}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                    <Text style={{ fontFamily: sans, fontSize: 12, color: colors.mutedForeground }}>
                      {formatMoney(p.salePrice)} · stock {p.stock}
                    </Text>
                  </View>
                  {p.stock <= 0 ? (
                    <Badge label="Rupture" tone="danger" />
                  ) : (
                    <Ionicons name="add-circle" size={24} color={colors.accent} />
                  )}
                </Pressable>
              ))
            ) : (
              <EmptyState
                title="Aucun produit"
                description="Ajoutez des produits depuis l'onglet Stock."
              />
            )}
          </Card>

          <Card>
            <SectionTitle>Panier</SectionTitle>
            {cart.length === 0 ? (
              <Text style={{ fontFamily: sans, fontSize: 13, color: colors.mutedForeground }}>
                Touchez un produit pour l'ajouter.
              </Text>
            ) : (
              cart.map((line) => (
                <View
                  key={line.productId}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    paddingVertical: 10,
                    borderTopWidth: 1,
                    borderTopColor: colors.border,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontFamily: sans, fontSize: 14, color: colors.foreground }}
                      numberOfLines={1}
                    >
                      {line.name}
                    </Text>
                    <Text style={{ fontFamily: sans, fontSize: 12, color: colors.mutedForeground }}>
                      {formatMoney(line.unitPrice)} × {line.quantity}
                    </Text>
                  </View>
                  <Pressable onPress={() => step(line.productId, -1)} hitSlop={8}>
                    <Ionicons name="remove-circle-outline" size={24} color={colors.mutedForeground} />
                  </Pressable>
                  <Text
                    style={{
                      fontFamily: sans,
                      fontSize: 15,
                      fontWeight: "700",
                      color: colors.foreground,
                      minWidth: 22,
                      textAlign: "center",
                    }}
                  >
                    {line.quantity}
                  </Text>
                  <Pressable onPress={() => step(line.productId, 1)} hitSlop={8}>
                    <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
                  </Pressable>
                </View>
              ))
            )}

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 12,
              }}
            >
              <Text style={{ fontFamily: sans, fontSize: 14, color: colors.mutedForeground }}>
                Total
              </Text>
              <Text
                style={{
                  fontFamily: display,
                  fontSize: 22,
                  fontWeight: "800",
                  color: colors.foreground,
                }}
              >
                {formatMoney(total)}
              </Text>
            </View>
          </Card>

          <Card>
            <SectionTitle>Client (optionnel)</SectionTitle>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Chip label="Aucun" active={customerId === null} onPress={() => setCustomerId(null)} />
              {(customers.data ?? []).map((c) => (
                <Chip
                  key={c.id}
                  label={c.name}
                  active={customerId === c.id}
                  onPress={() => setCustomerId(c.id)}
                />
              ))}
            </ScrollView>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Note (optionnel)"
              placeholderTextColor={colors.mutedForeground}
              style={{
                height: 46,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingHorizontal: 14,
                color: colors.foreground,
                fontSize: 15,
              }}
            />
          </Card>

          {message ? (
            <Text
              style={{
                fontFamily: sans,
                fontSize: 13,
                color: message.tone === "ok" ? colors.success : colors.destructive,
              }}
            >
              {message.text}
            </Text>
          ) : null}

          <Button
            label="Enregistrer la vente"
            variant="accent"
            icon="checkmark-circle"
            onPress={submit}
            loading={createSale.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        backgroundColor: active ? colors.accent : colors.card,
        borderColor: active ? colors.accent : colors.border,
      }}
    >
      <Text
        style={{
          fontFamily: sans,
          fontSize: 13,
          fontWeight: "600",
          color: active ? colors.accentForeground : colors.mutedForeground,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

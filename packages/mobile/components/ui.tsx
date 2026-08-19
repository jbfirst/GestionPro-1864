import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { Fonts } from "@/constants/theme";

export const display = Fonts?.rounded;
export const sans = Fonts?.sans;

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        style as ViewStyle,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.sectionTitle}>
      <Text
        style={{ fontFamily: display, fontSize: 17, fontWeight: "700", color: colors.foreground }}
      >
        {children}
      </Text>
      {action}
    </View>
  );
}

export function Button({
  label,
  onPress,
  loading,
  variant = "primary",
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: "primary" | "accent" | "outline" | "danger";
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}) {
  const colors = useColors();
  const palette = {
    primary: { bg: colors.primary, fg: colors.primaryForeground, border: colors.primary },
    accent: { bg: colors.accent, fg: colors.accentForeground, border: colors.accent },
    outline: { bg: "transparent", fg: colors.foreground, border: colors.border },
    danger: { bg: colors.destructive, fg: "#FFFFFF", border: colors.destructive },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: loading ? 0.6 : pressed ? 0.85 : 1,
        },
        style as ViewStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={17} color={palette.fg} /> : null}
          <Text style={{ color: palette.fg, fontFamily: sans, fontSize: 15, fontWeight: "700" }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  hint,
  ...props
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  const colors = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          fontFamily: sans,
          fontSize: 13,
          fontWeight: "600",
          color: colors.mutedForeground,
        }}
      >
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        {...props}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : colors.border,
            color: colors.foreground,
          },
          props.style as ViewStyle,
        ]}
      />
      {error ? (
        <Text style={{ fontFamily: sans, fontSize: 12, color: colors.destructive }}>{error}</Text>
      ) : hint ? (
        <Text style={{ fontFamily: sans, fontSize: 12, color: colors.mutedForeground }}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function Badge({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: "muted" | "success" | "warning" | "danger";
}) {
  const colors = useColors();
  const map = {
    muted: { bg: colors.muted, fg: colors.mutedForeground },
    success: { bg: `${colors.success}22`, fg: colors.success },
    warning: { bg: `${colors.warning}22`, fg: colors.warning },
    danger: { bg: `${colors.destructive}22`, fg: colors.destructive },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <Text style={{ fontFamily: sans, fontSize: 11, fontWeight: "700", color: map.fg }}>
        {label}
      </Text>
    </View>
  );
}

export function EmptyState({
  icon = "cube-outline",
  title,
  description,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={34} color={colors.mutedForeground} />
      <Text
        style={{ fontFamily: display, fontSize: 16, fontWeight: "700", color: colors.foreground }}
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={{
            fontFamily: sans,
            fontSize: 13,
            color: colors.mutedForeground,
            textAlign: "center",
          }}
        >
          {description}
        </Text>
      ) : null}
    </View>
  );
}

export function Loading({ label = "Chargement…" }: { label?: string }) {
  const colors = useColors();
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={colors.accent} />
      <Text style={{ fontFamily: sans, fontSize: 13, color: colors.mutedForeground }}>{label}</Text>
    </View>
  );
}

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const colors = useColors();
  return (
    <View style={{ gap: 4, paddingBottom: 4 }}>
      <Text
        style={{ fontFamily: display, fontSize: 24, fontWeight: "800", color: colors.foreground }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontFamily: sans, fontSize: 13, color: colors.mutedForeground }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 18,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
});

import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, Radius, Spacing } from "@/constants/theme";
import { AppText } from "./ui";

export type Option = { key: string; label: string };

type Props = {
  visible: boolean;
  title: string;
  options: readonly Option[];
  selectedKey?: string;
  onSelect: (key: string) => void;
  onClose: () => void;
};

/** A bottom sheet list; the mobile replacement for the web app's <select> menus. */
export function OptionSheet({ visible, title, options, selectedKey, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="إغلاق" />
      <SafeAreaView edges={["bottom"]} style={styles.sheet}>
        <View style={styles.handle} />
        <AppText weight="bold" style={styles.title}>
          {title}
        </AppText>
        <FlatList
          data={options}
          keyExtractor={(item) => item.key}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const selected = item.key === selectedKey;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onSelect(item.key)}
                style={({ pressed }) => [styles.option, (pressed || selected) && styles.optionActive]}
              >
                <AppText weight={selected ? "bold" : "regular"} style={selected && { color: Colors.gold }}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheet: {
    maxHeight: "70%",
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.lg * 1.5,
    borderTopRightRadius: Radius.lg * 1.5,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 18,
    color: Colors.gold,
    textAlign: "center",
    marginBottom: Spacing.two,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.divider,
  },
  option: {
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
  },
  optionActive: {
    backgroundColor: Colors.goldSoft,
  },
});

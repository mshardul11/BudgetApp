import React, { useState } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native'
import { ChevronDown, X } from 'lucide-react-native'
import { colors } from '../theme'

interface Option {
  label: string
  value: string
}

interface PickerModalProps {
  value: string
  options: Option[]
  onChange: (value: string) => void
  placeholder?: string
}

export default function PickerModal({ value, options, onChange, placeholder = 'Select...' }: PickerModalProps) {
  const [visible, setVisible] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={16} color={colors.gray400} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select Option</Text>
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
              <X size={20} color={colors.gray500} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={item => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.option, item.value === value && styles.optionSelected]}
                onPress={() => {
                  onChange(item.value)
                  setVisible(false)
                }}
              >
                <Text style={[styles.optionText, item.value === value && styles.optionTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
  },
  triggerText: { fontSize: 15, color: colors.gray900 },
  placeholder: { color: colors.gray400 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sheetTitle: { fontSize: 16, fontWeight: '600', color: colors.gray900 },
  closeBtn: { padding: 4 },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray50,
  },
  optionSelected: { backgroundColor: colors.primaryLight },
  optionText: { fontSize: 15, color: colors.gray800 },
  optionTextSelected: { color: colors.primary, fontWeight: '600' },
})

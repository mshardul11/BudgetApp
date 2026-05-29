import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Plus, Briefcase, Target, Trash2, X } from 'lucide-react-native'
import { useBudget } from '../context/BudgetContext'
import { formatCurrency, formatDate } from '../utils/formatters'
import { colors } from '../theme'
import PickerModal from '../components/PickerModal'

export default function InvestmentsScreen() {
  const { state, addTransaction, deleteTransaction } = useBudget()
  const { user } = state
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const investCategories = useMemo(() => state.categories.filter(c => c.type === 'investment'), [state.categories])
  const investTransactions = useMemo(
    () => [...state.transactions.filter(t => t.type === 'investment')].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.transactions]
  )
  const total = useMemo(() => investTransactions.reduce((s, t) => s + t.amount, 0), [investTransactions])
  const categoryOptions = useMemo(() => investCategories.map(c => ({ label: `${c.icon} ${c.name}`, value: c.name })), [investCategories])

  const handleSubmit = async () => {
    if (!amount || !description || !category) { Alert.alert('Error', 'Please fill in all fields'); return }
    await addTransaction({ type: 'investment', amount: parseFloat(amount), description, category, date })
    setAmount(''); setDescription(''); setCategory(''); setDate(new Date().toISOString().split('T')[0])
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this investment?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTransaction(id) },
    ])
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <Text style={s.pageTitle}>Investments</Text>
            <Text style={s.pageSubtitle}>Build your future</Text>
          </View>
          <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.purple }]} onPress={() => setShowForm(true)}>
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        <View style={[s.totalCard, { borderLeftColor: colors.purple }]}>
          <View style={s.totalCardContent}>
            <View>
              <Text style={s.totalLabel}>Total Investments</Text>
              <Text style={[s.totalValue, { color: colors.purple }]}>{formatCurrency(total, user)}</Text>
              <View style={s.row}>
                <Target size={14} color={colors.purple} />
                <Text style={[s.totalSub, { marginLeft: 4 }]}>Building your future</Text>
              </View>
            </View>
            <View style={[s.totalIcon, { backgroundColor: colors.purpleLight }]}>
              <Briefcase size={28} color={colors.purple} />
            </View>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Investment History</Text>
          {investTransactions.length === 0 ? (
            <View style={s.empty}>
              <Briefcase size={36} color={colors.gray300} />
              <Text style={s.emptyText}>No investments yet</Text>
              <Text style={s.emptySubtext}>Start building your portfolio</Text>
            </View>
          ) : (
            investTransactions.map(txn => {
              const cat = state.categories.find(c => c.name === txn.category)
              return (
                <View key={txn.id} style={s.txnRow}>
                  <View style={[s.txnIcon, { backgroundColor: (cat?.color || colors.purple) + '22' }]}>
                    <Text style={{ fontSize: 18 }}>{cat?.icon || '📊'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txnDesc} numberOfLines={1}>{txn.description}</Text>
                    <Text style={s.txnCat}>{txn.category}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                    <Text style={[s.txnAmount, { color: colors.purple }]}>→{formatCurrency(txn.amount, user)}</Text>
                    <Text style={s.txnDate}>{formatDate(txn.date, user)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(txn.id)} style={s.deleteBtn}>
                    <Trash2 size={16} color={colors.gray400} />
                  </TouchableOpacity>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modalSafe}>
          <ScrollView contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Investment</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}><X size={24} color={colors.gray500} /></TouchableOpacity>
            </View>
            <Text style={s.fieldLabel}>Amount</Text>
            <TextInput style={s.input} placeholder="0.00" placeholderTextColor={colors.gray400} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Description</Text>
            <TextInput style={s.input} placeholder="e.g., Stock purchase, Bond" placeholderTextColor={colors.gray400} value={description} onChangeText={setDescription} />
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Category</Text>
            <PickerModal value={category} options={categoryOptions} onChange={setCategory} placeholder="Select category" />
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Date (YYYY-MM-DD)</Text>
            <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.gray400} />
            <TouchableOpacity style={[s.submitBtn, { backgroundColor: colors.purple }]} onPress={handleSubmit}>
              <Plus size={18} color={colors.white} />
              <Text style={s.submitBtnText}>Add Investment</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray50 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.gray900 },
  pageSubtitle: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  totalCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  totalCardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, color: colors.gray500, marginBottom: 4 },
  totalValue: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
  totalSub: { fontSize: 12, color: colors.gray500 },
  totalIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.gray900, marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.gray600, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: colors.gray400, marginTop: 4 },
  txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  txnIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txnDesc: { fontSize: 14, fontWeight: '600', color: colors.gray800 },
  txnCat: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  txnAmount: { fontSize: 14, fontWeight: '700' },
  txnDate: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  deleteBtn: { padding: 8 },
  modalSafe: { flex: 1, backgroundColor: colors.white },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.gray900 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.gray700, marginBottom: 8 },
  input: { height: 50, borderWidth: 1, borderColor: colors.gray200, borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: colors.gray900, backgroundColor: colors.gray50 },
  submitBtn: { marginTop: 28, height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
})

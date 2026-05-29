import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Plus, Target, TrendingDown, TrendingUp, AlertTriangle, Trash2, Edit3, X, Save } from 'lucide-react-native'
import { useBudget } from '../context/BudgetContext'
import { formatCurrency, formatPercentage } from '../utils/formatters'
import { colors } from '../theme'
import PickerModal from '../components/PickerModal'
import type { Budget } from '../types'

export default function BudgetScreen() {
  const { state, addBudget, updateBudget, deleteBudget } = useBudget()
  const { user } = state
  const [showForm, setShowForm] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const expenseCategories = useMemo(() => state.categories.filter(c => c.type === 'expense'), [state.categories])
  const categoryOptions = useMemo(() => expenseCategories.map(c => ({ label: `${c.icon} ${c.name}`, value: c.name })), [expenseCategories])
  const periodOptions = [{ label: 'Monthly', value: 'monthly' }, { label: 'Yearly', value: 'yearly' }]

  const totalBudget = useMemo(() => state.budgets.reduce((s, b) => s + b.amount, 0), [state.budgets])
  const totalSpent = useMemo(() => state.budgets.reduce((s, b) => s + b.spent, 0), [state.budgets])
  const budgetUsage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  const getCategorySpent = (categoryName: string) => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    return state.transactions
      .filter(t => t.type === 'expense' && t.category === categoryName && t.date.startsWith(currentMonth))
      .reduce((s, t) => s + t.amount, 0)
  }

  const resetForm = () => { setCategory(''); setAmount(''); setPeriod('monthly') }

  const handleSubmit = async () => {
    if (!category || !amount) { Alert.alert('Error', 'Please fill in all fields'); return }
    await addBudget({ category, amount: parseFloat(amount), spent: 0, period, startDate: new Date().toISOString() })
    resetForm(); setShowForm(false)
  }

  const handleEditSubmit = async () => {
    if (!editingBudget || !category || !amount) { Alert.alert('Error', 'Please fill in all fields'); return }
    await updateBudget({ ...editingBudget, category, amount: parseFloat(amount), period })
    resetForm(); setEditingBudget(null)
  }

  const startEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setCategory(budget.category)
    setAmount(budget.amount.toString())
    setPeriod(budget.period)
  }

  const handleDelete = (id: string) => {
    Alert.alert('Delete Budget', 'Remove this budget?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBudget(id) },
    ])
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View>
            <Text style={s.pageTitle}>Budget</Text>
            <Text style={s.pageSubtitle}>Set and track spending limits</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(true)}>
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Overview Cards */}
        <View style={s.overviewRow}>
          <View style={[s.overviewCard, { borderTopColor: colors.primary }]}>
            <Target size={20} color={colors.primary} />
            <Text style={s.overviewLabel}>Total Budget</Text>
            <Text style={[s.overviewValue, { color: colors.primary }]}>{formatCurrency(totalBudget, user)}</Text>
          </View>
          <View style={[s.overviewCard, { borderTopColor: colors.warning }]}>
            <TrendingDown size={20} color={colors.warning} />
            <Text style={s.overviewLabel}>Total Spent</Text>
            <Text style={[s.overviewValue, { color: colors.warning }]}>{formatCurrency(totalSpent, user)}</Text>
          </View>
          <View style={[s.overviewCard, { borderTopColor: budgetUsage > 100 ? colors.danger : budgetUsage > 80 ? colors.warning : colors.success }]}>
            <AlertTriangle size={20} color={budgetUsage > 80 ? colors.danger : colors.success} />
            <Text style={s.overviewLabel}>Usage</Text>
            <Text style={[s.overviewValue, { color: budgetUsage > 100 ? colors.danger : budgetUsage > 80 ? colors.warning : colors.success }]}>
              {formatPercentage(budgetUsage)}
            </Text>
          </View>
        </View>

        {/* Budgets */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Budget Categories</Text>
          {state.budgets.length === 0 ? (
            <View style={s.empty}>
              <Target size={36} color={colors.gray300} />
              <Text style={s.emptyText}>No budgets set yet</Text>
              <Text style={s.emptySubtext}>Add your first budget to track limits</Text>
            </View>
          ) : (
            state.budgets.map(budget => {
              const cat = state.categories.find(c => c.name === budget.category)
              const spent = getCategorySpent(budget.category)
              const usage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
              const fillColor = usage > 100 ? colors.danger : usage > 80 ? colors.warning : colors.success

              return (
                <View key={budget.id} style={s.budgetItem}>
                  <View style={s.budgetHeader}>
                    <View style={s.row}>
                      <View style={[s.catIcon, { backgroundColor: (cat?.color || colors.primary) + '22' }]}>
                        <Text style={{ fontSize: 18 }}>{cat?.icon || '💰'}</Text>
                      </View>
                      <View>
                        <Text style={s.budgetCategory}>{budget.category}</Text>
                        <Text style={s.budgetPeriod}>{budget.period} budget</Text>
                      </View>
                    </View>
                    <View style={s.row}>
                      <TouchableOpacity onPress={() => startEdit(budget)} style={s.iconBtn}>
                        <Edit3 size={16} color={colors.gray400} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(budget.id)} style={s.iconBtn}>
                        <Trash2 size={16} color={colors.gray400} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={s.budgetAmounts}>
                    <Text style={s.amountLabel}>Spent: {formatCurrency(spent, user)}</Text>
                    <Text style={s.amountLabel}>Budget: {formatCurrency(budget.amount, user)}</Text>
                  </View>
                  <View style={s.progressBar}>
                    <View style={[s.progressFill, { width: `${Math.min(usage, 100)}%`, backgroundColor: fillColor }]} />
                  </View>
                  <View style={s.row}>
                    <Text style={[s.usageText, { color: fillColor }]}>{formatPercentage(usage)} used</Text>
                    {usage > 100 && (
                      <Text style={s.overBudget}>{formatCurrency(spent - budget.amount, user)} over</Text>
                    )}
                  </View>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>

      {/* Add Budget Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modalSafe}>
          <ScrollView contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Add Budget</Text>
              <TouchableOpacity onPress={() => { resetForm(); setShowForm(false) }}><X size={24} color={colors.gray500} /></TouchableOpacity>
            </View>
            <Text style={s.fieldLabel}>Category</Text>
            <PickerModal value={category} options={categoryOptions} onChange={setCategory} placeholder="Select category" />
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Amount</Text>
            <TextInput style={s.input} placeholder="0.00" placeholderTextColor={colors.gray400} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Period</Text>
            <PickerModal value={period} options={periodOptions} onChange={v => setPeriod(v as 'monthly' | 'yearly')} />
            <TouchableOpacity style={[s.submitBtn, { backgroundColor: colors.primary }]} onPress={handleSubmit}>
              <Plus size={18} color={colors.white} />
              <Text style={s.submitBtnText}>Add Budget</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Budget Modal */}
      <Modal visible={!!editingBudget} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={s.modalSafe}>
          <ScrollView contentContainerStyle={s.modalContent} keyboardShouldPersistTaps="handled">
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Edit Budget</Text>
              <TouchableOpacity onPress={() => { resetForm(); setEditingBudget(null) }}><X size={24} color={colors.gray500} /></TouchableOpacity>
            </View>
            <Text style={s.fieldLabel}>Category</Text>
            <PickerModal value={category} options={categoryOptions} onChange={setCategory} placeholder="Select category" />
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Amount</Text>
            <TextInput style={s.input} placeholder="0.00" placeholderTextColor={colors.gray400} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Period</Text>
            <PickerModal value={period} options={periodOptions} onChange={v => setPeriod(v as 'monthly' | 'yearly')} />
            <TouchableOpacity style={[s.submitBtn, { backgroundColor: colors.success }]} onPress={handleEditSubmit}>
              <Save size={18} color={colors.white} />
              <Text style={s.submitBtnText}>Save Changes</Text>
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
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  overviewRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  overviewCard: { flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 12, alignItems: 'center', borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  overviewLabel: { fontSize: 11, color: colors.gray500, marginTop: 6, textAlign: 'center' },
  overviewValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.gray900, marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.gray600, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: colors.gray400, marginTop: 4 },
  budgetItem: { borderBottomWidth: 1, borderBottomColor: colors.gray100, paddingVertical: 16 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  catIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  budgetCategory: { fontSize: 15, fontWeight: '600', color: colors.gray900 },
  budgetPeriod: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  iconBtn: { padding: 8 },
  budgetAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  amountLabel: { fontSize: 12, color: colors.gray500 },
  progressBar: { height: 8, backgroundColor: colors.gray100, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', borderRadius: 4 },
  usageText: { fontSize: 12, fontWeight: '600', flex: 1 },
  overBudget: { fontSize: 12, fontWeight: '600', color: colors.danger, backgroundColor: colors.dangerLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  modalSafe: { flex: 1, backgroundColor: colors.white },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.gray900 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.gray700, marginBottom: 8 },
  input: { height: 50, borderWidth: 1, borderColor: colors.gray200, borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: colors.gray900, backgroundColor: colors.gray50 },
  submitBtn: { marginTop: 28, height: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
})

import React, { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Modal,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PieChart, BarChart } from 'react-native-chart-kit'
import { TrendingUp, TrendingDown, DollarSign, Target, Plus, X, PieChart as PieChartIcon } from 'lucide-react-native'
import { format, subMonths } from 'date-fns'
import { useBudget } from '../context/BudgetContext'
import { formatCurrency } from '../utils/formatters'
import { colors } from '../theme'
import PickerModal from '../components/PickerModal'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CHART_WIDTH = SCREEN_WIDTH - 48

export default function DashboardScreen() {
  const { state, addTransaction } = useBudget()
  const { transactions, categories, user } = state

  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('expense')
  const [formAmount, setFormAmount] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])

  const currentMonth = useMemo(() => format(new Date(), 'yyyy-MM'), [])

  const monthlyTransactions = useMemo(
    () => transactions.filter(t => t.date.startsWith(currentMonth)),
    [transactions, currentMonth]
  )

  const monthlyStats = useMemo(() => {
    const totalIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const totalInvestments = monthlyTransactions.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0)
    const balance = totalIncome - totalExpenses - totalInvestments
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0
    return { totalIncome, totalExpenses, totalInvestments, balance, savingsRate }
  }, [monthlyTransactions])

  const expenseByCategory = useMemo(() => {
    return categories
      .filter(cat => cat.type === 'expense')
      .map(cat => {
        const total = monthlyTransactions
          .filter(t => t.type === 'expense' && t.category === cat.name)
          .reduce((s, t) => s + t.amount, 0)
        return { name: cat.name, amount: total, color: cat.color || '#8884d8', legendFontColor: colors.gray600, legendFontSize: 11 }
      })
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
  }, [categories, monthlyTransactions])

  const last6Months = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i)
      const key = format(date, 'yyyy-MM')
      const txns = transactions.filter(t => t.date.startsWith(key))
      return {
        month: format(date, 'MMM'),
        income: txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expenses: txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      }
    })
  }, [transactions])

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    [transactions]
  )

  const filteredCategories = useMemo(
    () => categories.filter(cat => cat.type === formType),
    [categories, formType]
  )

  const categoryOptions = useMemo(
    () => filteredCategories.map(c => ({ label: `${c.icon} ${c.name}`, value: c.name })),
    [filteredCategories]
  )

  const typeOptions = [
    { label: 'Expense', value: 'expense' },
    { label: 'Income', value: 'income' },
    { label: 'Investment', value: 'investment' },
  ]

  const handleAddTransaction = useCallback(async () => {
    if (!formAmount || !formDescription || !formCategory) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    await addTransaction({
      type: formType as 'income' | 'expense' | 'investment',
      amount: parseFloat(formAmount),
      description: formDescription,
      category: formCategory,
      date: formDate,
    })
    setFormAmount('')
    setFormDescription('')
    setFormCategory('')
    setShowForm(false)
  }, [formType, formAmount, formDescription, formCategory, formDate, addTransaction])

  const chartConfig = {
    backgroundColor: colors.white,
    backgroundGradientFrom: colors.white,
    backgroundGradientTo: colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: () => colors.gray500,
    style: { borderRadius: 16 },
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Dashboard</Text>
            <Text style={styles.pageSubtitle}>{format(new Date(), 'MMMM yyyy')}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowForm(true)}
            activeOpacity={0.8}
          >
            <Plus size={20} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
          <StatCard label="Income" value={formatCurrency(monthlyStats.totalIncome, user)} color={colors.success} colorLight={colors.successLight} icon={<TrendingUp size={20} color={colors.success} />} />
          <StatCard label="Expenses" value={formatCurrency(monthlyStats.totalExpenses, user)} color={colors.danger} colorLight={colors.dangerLight} icon={<TrendingDown size={20} color={colors.danger} />} />
          <StatCard label="Invested" value={formatCurrency(monthlyStats.totalInvestments, user)} color={colors.purple} colorLight={colors.purpleLight} icon={<PieChartIcon size={20} color={colors.purple} />} />
          <StatCard label="Balance" value={formatCurrency(monthlyStats.balance, user)} color={monthlyStats.balance >= 0 ? colors.primary : colors.danger} colorLight={colors.primaryLight} icon={<DollarSign size={20} color={colors.primary} />} />
          <StatCard label="Savings Rate" value={`${monthlyStats.savingsRate.toFixed(1)}%`} color={colors.warning} colorLight={colors.warningLight} icon={<Target size={20} color={colors.warning} />} />
        </ScrollView>

        {/* Expense Pie Chart */}
        {expenseByCategory.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Expenses by Category</Text>
            <PieChart
              data={expenseByCategory.map(d => ({
                name: d.name,
                amount: d.amount,
                color: d.color,
                legendFontColor: d.legendFontColor,
                legendFontSize: d.legendFontSize,
              }))}
              width={CHART_WIDTH}
              height={180}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="0"
              hasLegend={true}
              style={{ marginLeft: -16 }}
            />
          </View>
        )}

        {/* Monthly Overview Bar Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>6-Month Overview</Text>
          <BarChart
            data={{
              labels: last6Months.map(m => m.month),
              datasets: [{ data: last6Months.map(m => m.expenses) }],
            }}
            width={CHART_WIDTH}
            height={180}
            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})` }}
            style={{ marginLeft: -16 }}
            yAxisLabel=""
            yAxisSuffix=""
            showValuesOnTopOfBars={false}
          />
          <View style={styles.legend}>
            <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
            <Text style={styles.legendText}>Monthly Expenses</Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Transactions</Text>
          </View>
          {recentTransactions.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Tap + to add your first transaction</Text>
            </View>
          ) : (
            recentTransactions.map(txn => {
              const cat = categories.find(c => c.name === txn.category)
              return (
                <View key={txn.id} style={styles.txnRow}>
                  <View style={[styles.txnIcon, { backgroundColor: (cat?.color || '#8884d8') + '22' }]}>
                    <Text style={{ fontSize: 18 }}>{cat?.icon || '💰'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txnDesc} numberOfLines={1}>{txn.description}</Text>
                    <Text style={styles.txnCat}>{txn.category}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.txnAmount, { color: txn.type === 'income' ? colors.success : txn.type === 'investment' ? colors.purple : colors.danger }]}>
                      {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount, user)}
                    </Text>
                    <Text style={styles.txnDate}>{format(new Date(txn.date), 'MMM dd')}</Text>
                  </View>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>

      {/* Add Transaction Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Transaction</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <X size={24} color={colors.gray500} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Type</Text>
            <PickerModal
              value={formType}
              options={typeOptions}
              onChange={v => { setFormType(v); setFormCategory('') }}
            />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Amount</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.gray400}
              value={formAmount}
              onChangeText={setFormAmount}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="What was this for?"
              placeholderTextColor={colors.gray400}
              value={formDescription}
              onChangeText={setFormDescription}
            />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Category</Text>
            <PickerModal
              value={formCategory}
              options={categoryOptions}
              onChange={setFormCategory}
              placeholder="Select category"
            />

            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={formDate}
              onChangeText={setFormDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.gray400}
            />

            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: formType === 'income' ? colors.success : formType === 'investment' ? colors.purple : colors.danger }
              ]}
              onPress={handleAddTransaction}
              activeOpacity={0.8}
            >
              <Plus size={18} color={colors.white} />
              <Text style={styles.submitBtnText}>
                Add {formType === 'income' ? 'Income' : formType === 'investment' ? 'Investment' : 'Expense'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

function StatCard({ label, value, color, colorLight, icon }: { label: string; value: string; color: string; colorLight: string; icon: React.ReactNode }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={[styles.statIcon, { backgroundColor: colorLight }]}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray50 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.gray900 },
  pageSubtitle: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  statsScroll: { marginBottom: 16 },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginRight: 12,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statLabel: { fontSize: 12, color: colors.gray500, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.gray900, marginBottom: 12 },
  legend: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: colors.gray500 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.gray700, marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: colors.gray400 },
  txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  txnIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txnDesc: { fontSize: 14, fontWeight: '600', color: colors.gray800 },
  txnCat: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  txnAmount: { fontSize: 14, fontWeight: '700' },
  txnDate: { fontSize: 11, color: colors.gray400, marginTop: 2 },
  modalSafe: { flex: 1, backgroundColor: colors.white },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.gray900 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.gray700, marginBottom: 8 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.gray900,
    backgroundColor: colors.gray50,
  },
  submitBtn: {
    marginTop: 28,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
})

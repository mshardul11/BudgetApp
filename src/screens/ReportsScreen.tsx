import React, { useMemo } from 'react'
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit'
import { format, subMonths } from 'date-fns'
import { TrendingUp, TrendingDown, BarChart3, PieChart as PieIcon } from 'lucide-react-native'
import { useBudget } from '../context/BudgetContext'
import { formatCurrency, formatPercentage } from '../utils/formatters'
import { colors } from '../theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CHART_WIDTH = SCREEN_WIDTH - 48

export default function ReportsScreen() {
  const { state } = useBudget()
  const { transactions, categories, user } = state

  const monthlyData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i)
      const key = format(date, 'yyyy-MM')
      const txns = transactions.filter(t => t.date.startsWith(key))
      const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      const investments = txns.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0)
      return {
        month: format(date, 'MMM'),
        income, expenses, investments,
        balance: income - expenses - investments,
        savingsRate: income > 0 ? ((income - expenses - investments) / income) * 100 : 0,
      }
    })
  }, [transactions])

  const expenseBreakdown = useMemo(() => {
    const currentMonth = format(new Date(), 'yyyy-MM')
    return categories
      .filter(cat => cat.type === 'expense')
      .map(cat => {
        const total = transactions
          .filter(t => t.type === 'expense' && t.date.startsWith(currentMonth) && t.category === cat.name)
          .reduce((s, t) => s + t.amount, 0)
        return { name: cat.name, amount: total, color: cat.color || '#8884d8', legendFontColor: colors.gray600, legendFontSize: 10 }
      })
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6)
  }, [transactions, categories])

  const avgMonthlyIncome = useMemo(() => monthlyData.reduce((s, m) => s + m.income, 0) / 6, [monthlyData])
  const avgMonthlyExpenses = useMemo(() => monthlyData.reduce((s, m) => s + m.expenses, 0) / 6, [monthlyData])
  const avgSavingsRate = useMemo(() => monthlyData.reduce((s, m) => s + m.savingsRate, 0) / 6, [monthlyData])

  const chartConfig = {
    backgroundColor: colors.white,
    backgroundGradientFrom: colors.white,
    backgroundGradientTo: colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: () => colors.gray500,
    style: { borderRadius: 16 },
    propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary },
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.pageTitle}>Reports</Text>
        <Text style={s.pageSubtitle}>6-month financial analysis</Text>

        {/* Summary Stats */}
        <View style={s.statsRow}>
          <View style={s.summaryCard}>
            <TrendingUp size={18} color={colors.success} />
            <Text style={s.summaryLabel}>Avg Monthly Income</Text>
            <Text style={[s.summaryValue, { color: colors.success }]}>{formatCurrency(avgMonthlyIncome, user)}</Text>
          </View>
          <View style={s.summaryCard}>
            <TrendingDown size={18} color={colors.danger} />
            <Text style={s.summaryLabel}>Avg Monthly Expense</Text>
            <Text style={[s.summaryValue, { color: colors.danger }]}>{formatCurrency(avgMonthlyExpenses, user)}</Text>
          </View>
          <View style={s.summaryCard}>
            <BarChart3 size={18} color={colors.primary} />
            <Text style={s.summaryLabel}>Avg Savings Rate</Text>
            <Text style={[s.summaryValue, { color: colors.primary }]}>{formatPercentage(avgSavingsRate)}</Text>
          </View>
        </View>

        {/* Income vs Expenses Bar Chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Income vs Expenses</Text>
          <BarChart
            data={{
              labels: monthlyData.map(m => m.month),
              datasets: [{ data: monthlyData.map(m => m.income), color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})` }],
            }}
            width={CHART_WIDTH}
            height={180}
            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})` }}
            style={{ marginLeft: -16 }}
            yAxisLabel=""
            yAxisSuffix=""
            showValuesOnTopOfBars={false}
          />
          <View style={s.legendRow}>
            <View style={[s.legendDot, { backgroundColor: colors.success }]} />
            <Text style={s.legendText}>Income</Text>
          </View>
        </View>

        {/* Expenses Trend Line Chart */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Expense Trend</Text>
          <LineChart
            data={{
              labels: monthlyData.map(m => m.month),
              datasets: [{ data: monthlyData.map(m => m.expenses.toFixed(0) as any) }],
            }}
            width={CHART_WIDTH}
            height={180}
            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})` }}
            style={{ marginLeft: -16 }}
            bezier
          />
        </View>

        {/* Savings Rate */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Savings Rate Trend</Text>
          <LineChart
            data={{
              labels: monthlyData.map(m => m.month),
              datasets: [{ data: monthlyData.map(m => parseFloat(m.savingsRate.toFixed(1))) }],
            }}
            width={CHART_WIDTH}
            height={180}
            chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})` }}
            style={{ marginLeft: -16 }}
            bezier
            yAxisSuffix="%"
          />
        </View>

        {/* Expense Breakdown Pie Chart */}
        {expenseBreakdown.length > 0 && (
          <View style={s.card}>
            <View style={s.cardHeaderRow}>
              <PieIcon size={16} color={colors.primary} />
              <Text style={[s.cardTitle, { marginBottom: 0, marginLeft: 6 }]}>This Month's Breakdown</Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <PieChart
                data={expenseBreakdown.map(d => ({ name: d.name, amount: d.amount, color: d.color, legendFontColor: d.legendFontColor, legendFontSize: d.legendFontSize }))}
                width={CHART_WIDTH}
                height={180}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="0"
                hasLegend
                style={{ marginLeft: -16 }}
              />
            </View>
          </View>
        )}

        {/* Monthly Breakdown Table */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Monthly Breakdown</Text>
          <View style={s.tableHeader}>
            <Text style={[s.tableCell, s.tableHeaderText]}>Month</Text>
            <Text style={[s.tableCell, s.tableHeaderText]}>Income</Text>
            <Text style={[s.tableCell, s.tableHeaderText]}>Expenses</Text>
            <Text style={[s.tableCell, s.tableHeaderText]}>Balance</Text>
          </View>
          {monthlyData.map((m, i) => (
            <View key={i} style={[s.tableRow, i % 2 === 0 && { backgroundColor: colors.gray50 }]}>
              <Text style={s.tableCell}>{m.month}</Text>
              <Text style={[s.tableCell, { color: colors.success }]}>{formatCurrency(m.income, user)}</Text>
              <Text style={[s.tableCell, { color: colors.danger }]}>{formatCurrency(m.expenses, user)}</Text>
              <Text style={[s.tableCell, { color: m.balance >= 0 ? colors.success : colors.danger }]}>{formatCurrency(m.balance, user)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray50 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.gray900, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: colors.gray500, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryCard: { flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  summaryLabel: { fontSize: 10, color: colors.gray500, marginTop: 6, textAlign: 'center' },
  summaryValue: { fontSize: 13, fontWeight: '700', marginTop: 3 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.gray900, marginBottom: 12 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 0 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: colors.gray500 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.gray200, paddingBottom: 8, marginBottom: 4 },
  tableHeaderText: { fontWeight: '700', color: colors.gray700 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, borderRadius: 6 },
  tableCell: { flex: 1, fontSize: 11, color: colors.gray700, textAlign: 'center' },
})

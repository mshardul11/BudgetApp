import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useBudget } from '../contexts/BudgetContext'
import { useAuth } from '../contexts/AuthContext'
import { StackNavigationProp } from '@react-navigation/stack'
import { NavigationParams } from '../types'

type DashboardScreenNavigationProp = StackNavigationProp<NavigationParams, 'Dashboard'>

interface Props {
  navigation: DashboardScreenNavigationProp
}

export default function DashboardScreen({ navigation }: Props) {
  const { state, syncData } = useBudget()
  const { currentUser } = useAuth()
  const [refreshing, setRefreshing] = React.useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    try {
      await syncData()
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: state.user?.currency || 'USD',
    }).format(amount)
  }

  const recentTransactions = state.transactions.slice(0, 5)

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Good morning</Text>
              <Text style={styles.userName}>{currentUser?.displayName || 'User'}</Text>
            </View>
            <TouchableOpacity style={styles.syncButton} onPress={onRefresh}>
              <Ionicons 
                name={state.syncStatus === 'syncing' ? 'sync' : 'refresh'} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(state.stats.balance)}</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceItemLabel}>Income</Text>
                <Text style={[styles.balanceItemAmount, styles.incomeText]}>
                  {formatCurrency(state.stats.totalIncome)}
                </Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceItemLabel}>Expenses</Text>
                <Text style={[styles.balanceItemAmount, styles.expenseText]}>
                  {formatCurrency(state.stats.totalExpenses)}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.incomeCard]}
              onPress={() => navigation.navigate('AddTransaction', { type: 'income' })}
            >
              <Ionicons name="add-circle" size={32} color="#10B981" />
              <Text style={styles.actionText}>Add Income</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionCard, styles.expenseCard]}
              onPress={() => navigation.navigate('AddTransaction', { type: 'expense' })}
            >
              <Ionicons name="remove-circle" size={32} color="#EF4444" />
              <Text style={styles.actionText}>Add Expense</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionCard, styles.investmentCard]}
              onPress={() => navigation.navigate('AddTransaction', { type: 'investment' })}
            >
              <Ionicons name="trending-up" size={32} color="#8B5CF6" />
              <Text style={styles.actionText}>Add Investment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionCard, styles.budgetCard]}
              onPress={() => navigation.navigate('Budget')}
            >
              <Ionicons name="pie-chart" size={32} color="#F59E0B" />
              <Text style={styles.actionText}>View Budget</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color="#10B981" />
              <Text style={styles.statValue}>{state.stats.savingsRate.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>Savings Rate</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="receipt" size={24} color="#6B7280" />
              <Text style={styles.statValue}>{state.transactions.length}</Text>
              <Text style={styles.statLabel}>Transactions</Text>
            </View>
            
            <View style={styles.statCard}>
              <Ionicons name="wallet" size={24} color="#F59E0B" />
              <Text style={styles.statValue}>
                {Math.round((state.stats.budgetUsed / state.stats.monthlyBudget) * 100)}%
              </Text>
              <Text style={styles.statLabel}>Budget Used</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction) => (
              <View key={transaction.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    transaction.type === 'income' && styles.incomeIcon,
                    transaction.type === 'expense' && styles.expenseIcon,
                    transaction.type === 'investment' && styles.investmentIcon,
                  ]}>
                    <Ionicons
                      name={
                        transaction.type === 'income' ? 'add' :
                        transaction.type === 'expense' ? 'remove' : 'trending-up'
                      }
                      size={16}
                      color="white"
                    />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                    <Text style={styles.transactionCategory}>{transaction.category}</Text>
                  </View>
                </View>
                <Text style={[
                  styles.transactionAmount,
                  transaction.type === 'income' && styles.incomeText,
                  transaction.type === 'expense' && styles.expenseText,
                  transaction.type === 'investment' && styles.investmentText,
                ]}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No transactions yet</Text>
              <Text style={styles.emptyStateSubtext}>Start by adding your first transaction</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  userName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  syncButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#111827',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flex: 1,
  },
  balanceItemLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 4,
  },
  balanceItemAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  incomeText: {
    color: '#10B981',
  },
  expenseText: {
    color: '#EF4444',
  },
  investmentText: {
    color: '#8B5CF6',
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  investmentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  budgetCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  transactionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  incomeIcon: {
    backgroundColor: '#10B981',
  },
  expenseIcon: {
    backgroundColor: '#EF4444',
  },
  investmentIcon: {
    backgroundColor: '#8B5CF6',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
})
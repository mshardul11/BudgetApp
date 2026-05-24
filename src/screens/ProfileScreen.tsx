import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { User, Globe, DollarSign, Bell, Settings, Save, Edit3, LogOut, Target } from 'lucide-react-native'
import { useBudget } from '../context/BudgetContext'
import { useAuth } from '../context/AuthContext'
import type { User as UserType } from '../types'
import { formatCurrency } from '../utils/formatters'
import { colors } from '../theme'
import PickerModal from '../components/PickerModal'

const TAB_IDS = ['profile', 'goals', 'notifications', 'preferences'] as const
type TabId = typeof TAB_IDS[number]

const TAB_LABELS: Record<TabId, string> = {
  profile: 'Profile',
  goals: 'Goals',
  notifications: 'Notifications',
  preferences: 'Preferences',
}

export default function ProfileScreen() {
  const { state, updateUser } = useBudget()
  const { currentUser, logout } = useAuth()
  const { user } = state
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<UserType>(user)
  const [activeTab, setActiveTab] = useState<TabId>('profile')

  useEffect(() => { setFormData(user) }, [user])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateUser({ ...formData, updatedAt: new Date().toISOString() })
      setIsEditing(false)
    } catch {
      Alert.alert('Error', 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ])
  }

  const currencyOptions = [
    { label: 'USD ($)', value: 'USD' },
    { label: 'EUR (€)', value: 'EUR' },
    { label: 'GBP (£)', value: 'GBP' },
    { label: 'INR (₹)', value: 'INR' },
    { label: 'JPY (¥)', value: 'JPY' },
    { label: 'CAD (C$)', value: 'CAD' },
  ]

  const timezoneOptions = [
    { label: 'Eastern Time (US)', value: 'America/New_York' },
    { label: 'Central Time (US)', value: 'America/Chicago' },
    { label: 'Mountain Time (US)', value: 'America/Denver' },
    { label: 'Pacific Time (US)', value: 'America/Los_Angeles' },
    { label: 'London (UK)', value: 'Europe/London' },
    { label: 'Paris (France)', value: 'Europe/Paris' },
    { label: 'Mumbai (India)', value: 'Asia/Kolkata' },
    { label: 'Tokyo (Japan)', value: 'Asia/Tokyo' },
  ]

  const themeOptions = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'Auto (System)', value: 'auto' },
  ]

  const languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Hindi (हिंदी)', value: 'hi' },
    { label: 'Spanish (Español)', value: 'es' },
    { label: 'French (Français)', value: 'fr' },
    { label: 'German (Deutsch)', value: 'de' },
    { label: 'Japanese (日本語)', value: 'ja' },
  ]

  const dateFormatOptions = [
    { label: 'MM/DD/YYYY (US)', value: 'MM/dd/yyyy' },
    { label: 'DD/MM/YYYY (India/UK)', value: 'dd/MM/yyyy' },
    { label: 'YYYY-MM-DD (ISO)', value: 'yyyy-MM-dd' },
  ]

  const displayName = currentUser?.displayName || user.name || 'User'
  const displayEmail = currentUser?.email || user.email || ''
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={s.profileHeader}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.displayName}>{displayName}</Text>
            <Text style={s.displayEmail}>{displayEmail}</Text>
            <View style={s.metaRow}>
              <Globe size={12} color={colors.gray400} />
              <Text style={s.metaText}>{user.timezone}</Text>
              <DollarSign size={12} color={colors.gray400} style={{ marginLeft: 8 }} />
              <Text style={s.metaText}>{user.currency}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={s.actionRow}>
          {!isEditing ? (
            <TouchableOpacity style={s.editBtn} onPress={() => setIsEditing(true)}>
              <Edit3 size={16} color={colors.primary} />
              <Text style={s.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={[s.editBtn, { backgroundColor: colors.success }]} onPress={handleSave} disabled={isSaving}>
                <Save size={16} color={colors.white} />
                <Text style={[s.editBtnText, { color: colors.white }]}>{isSaving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.editBtn, { backgroundColor: colors.gray100 }]} onPress={() => { setFormData(user); setIsEditing(false) }}>
                <Text style={s.editBtnText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={[s.editBtn, { backgroundColor: colors.dangerLight, marginLeft: 'auto' }]} onPress={handleLogout}>
            <LogOut size={16} color={colors.danger} />
            <Text style={[s.editBtnText, { color: colors.danger }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll}>
          {TAB_IDS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{TAB_LABELS[tab]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Content */}
        <View style={s.card}>
          {activeTab === 'profile' && (
            <View>
              <Text style={s.fieldLabel}>Full Name</Text>
              <TextInput
                style={[s.input, !isEditing && s.inputDisabled]}
                value={formData.name || displayName}
                onChangeText={v => setFormData({ ...formData, name: v })}
                editable={isEditing}
                placeholderTextColor={colors.gray400}
              />
              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Email</Text>
              <TextInput
                style={[s.input, s.inputDisabled]}
                value={displayEmail}
                editable={false}
              />
              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Currency</Text>
              {isEditing
                ? <PickerModal value={formData.currency} options={currencyOptions} onChange={v => setFormData({ ...formData, currency: v })} />
                : <View style={[s.input, s.inputDisabled, { justifyContent: 'center' }]}>
                    <Text style={s.pickerDisplay}>{currencyOptions.find(o => o.value === formData.currency)?.label || formData.currency}</Text>
                  </View>
              }
              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Timezone</Text>
              {isEditing
                ? <PickerModal value={formData.timezone} options={timezoneOptions} onChange={v => setFormData({ ...formData, timezone: v })} />
                : <View style={[s.input, s.inputDisabled, { justifyContent: 'center' }]}>
                    <Text style={s.pickerDisplay}>{timezoneOptions.find(o => o.value === formData.timezone)?.label || formData.timezone}</Text>
                  </View>
              }
            </View>
          )}

          {activeTab === 'goals' && (
            <View>
              <Text style={s.sectionDesc}>Set your monthly financial targets</Text>
              <Text style={s.fieldLabel}>Monthly Income Goal</Text>
              <TextInput
                style={[s.input, !isEditing && s.inputDisabled]}
                value={(formData.monthlyIncomeGoal ?? 0).toString()}
                onChangeText={v => setFormData({ ...formData, monthlyIncomeGoal: parseFloat(v) || 0 })}
                editable={isEditing}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.gray400}
              />
              {!isEditing && <Text style={s.goalDisplay}>{formatCurrency(user.monthlyIncomeGoal || 0, user)}</Text>}
              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Monthly Expense Goal</Text>
              <TextInput
                style={[s.input, !isEditing && s.inputDisabled]}
                value={(formData.monthlyExpenseGoal ?? 0).toString()}
                onChangeText={v => setFormData({ ...formData, monthlyExpenseGoal: parseFloat(v) || 0 })}
                editable={isEditing}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.gray400}
              />
              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Savings Goal</Text>
              <TextInput
                style={[s.input, !isEditing && s.inputDisabled]}
                value={(formData.savingsGoal ?? 0).toString()}
                onChangeText={v => setFormData({ ...formData, savingsGoal: parseFloat(v) || 0 })}
                editable={isEditing}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.gray400}
              />
            </View>
          )}

          {activeTab === 'notifications' && (
            <View>
              <Text style={s.sectionDesc}>Control which notifications you receive</Text>
              {(Object.entries(formData.notifications) as [keyof typeof formData.notifications, boolean][]).map(([key, value]) => (
                <View key={key} style={s.notifRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.notifLabel}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                    <Text style={s.notifDesc}>
                      {key === 'email' ? 'Receive email notifications' :
                       key === 'push' ? 'Receive push notifications' :
                       key === 'budgetAlerts' ? 'Alerts when approaching budget limits' :
                       'Weekly financial summary reports'}
                    </Text>
                  </View>
                  <Switch
                    value={value}
                    onValueChange={v => setFormData({ ...formData, notifications: { ...formData.notifications, [key]: v } })}
                    disabled={!isEditing}
                    trackColor={{ false: colors.gray200, true: colors.primary }}
                    thumbColor={colors.white}
                  />
                </View>
              ))}
            </View>
          )}

          {activeTab === 'preferences' && (
            <View>
              <Text style={s.fieldLabel}>Theme</Text>
              {isEditing
                ? <PickerModal value={formData.preferences.theme} options={themeOptions} onChange={v => setFormData({ ...formData, preferences: { ...formData.preferences, theme: v as 'light' | 'dark' | 'auto' } })} />
                : <View style={[s.input, s.inputDisabled, { justifyContent: 'center' }]}>
                    <Text style={s.pickerDisplay}>{themeOptions.find(o => o.value === formData.preferences.theme)?.label}</Text>
                  </View>
              }
              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Language</Text>
              {isEditing
                ? <PickerModal value={formData.preferences.language} options={languageOptions} onChange={v => setFormData({ ...formData, preferences: { ...formData.preferences, language: v } })} />
                : <View style={[s.input, s.inputDisabled, { justifyContent: 'center' }]}>
                    <Text style={s.pickerDisplay}>{languageOptions.find(o => o.value === formData.preferences.language)?.label}</Text>
                  </View>
              }
              <Text style={[s.fieldLabel, { marginTop: 16 }]}>Date Format</Text>
              {isEditing
                ? <PickerModal value={formData.preferences.dateFormat} options={dateFormatOptions} onChange={v => setFormData({ ...formData, preferences: { ...formData.preferences, dateFormat: v } })} />
                : <View style={[s.input, s.inputDisabled, { justifyContent: 'center' }]}>
                    <Text style={s.pickerDisplay}>{dateFormatOptions.find(o => o.value === formData.preferences.dateFormat)?.label}</Text>
                  </View>
              }
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Quick Stats</Text>
          <View style={s.statsGrid}>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{state.transactions.length}</Text>
              <Text style={s.statLabel}>Total Transactions</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{state.budgets.length}</Text>
              <Text style={s.statLabel}>Active Budgets</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statNumber}>{state.categories.length}</Text>
              <Text style={s.statLabel}>Categories</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.gray50 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  profileHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarText: { fontSize: 22, fontWeight: '700', color: colors.white },
  displayName: { fontSize: 18, fontWeight: '700', color: colors.gray900 },
  displayEmail: { fontSize: 13, color: colors.gray500, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  metaText: { fontSize: 11, color: colors.gray400, marginLeft: 3 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.primaryLight },
  editBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  tabsScroll: { marginBottom: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 6, borderRadius: 20, backgroundColor: colors.gray100 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: colors.gray600 },
  tabTextActive: { color: colors.white, fontWeight: '600' },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.gray900, marginBottom: 14 },
  sectionDesc: { fontSize: 13, color: colors.gray500, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.gray700, marginBottom: 8 },
  input: { height: 48, borderWidth: 1, borderColor: colors.gray200, borderRadius: 12, paddingHorizontal: 14, fontSize: 15, color: colors.gray900, backgroundColor: colors.white },
  inputDisabled: { backgroundColor: colors.gray50, color: colors.gray500 },
  pickerDisplay: { fontSize: 15, color: colors.gray700 },
  goalDisplay: { fontSize: 12, color: colors.success, marginTop: 4 },
  notifRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  notifLabel: { fontSize: 14, fontWeight: '600', color: colors.gray800, textTransform: 'capitalize' },
  notifDesc: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.gray500, marginTop: 4, textAlign: 'center' },
})

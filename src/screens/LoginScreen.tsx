import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DollarSign, Mail, Lock, Eye, EyeOff, TrendingUp, Target, Shield } from 'lucide-react-native'
import { useAuth } from '../context/AuthContext'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AuthStackParamList } from '../navigation/AppNavigator'
import { colors } from '../theme'

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>

export default function LoginScreen() {
  const { currentUser, signInWithEmail } = useAuth()
  const navigation = useNavigation<Nav>()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (currentUser) navigation.replace('Login')
  }, [currentUser])

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    try {
      setLoading(true)
      await signInWithEmail(email, password)
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <DollarSign size={32} color={colors.white} />
            </View>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your budget account</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color={colors.gray400} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Enter your email"
                placeholderTextColor={colors.gray400}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={colors.gray400} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Enter your password"
                placeholderTextColor={colors.gray400}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                {showPassword
                  ? <EyeOff size={18} color={colors.gray400} />
                  : <Eye size={18} color={colors.gray400} />
                }
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, { marginTop: 24 }]}
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.btnText}>Sign In</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>Create one here</Text>
            </TouchableOpacity>
          </View>

          {/* Features */}
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>Why choose Budget App?</Text>
            <View style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.successLight }]}>
                <TrendingUp size={16} color={colors.success} />
              </View>
              <Text style={styles.featureText}>Smart expense tracking</Text>
            </View>
            <View style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.primaryLight }]}>
                <Target size={16} color={colors.primary} />
              </View>
              <Text style={styles.featureText}>Budget goal setting</Text>
            </View>
            <View style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.purpleLight }]}>
                <Shield size={16} color={colors.purple} />
              </View>
              <Text style={styles.featureText}>Secure data protection</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.gray50 },
  container: { padding: 24, flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '700', color: colors.gray900, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.gray500 },
  form: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.gray700, marginBottom: 8 },
  inputWrapper: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 10 },
  inputWithIcon: { flex: 1, fontSize: 15, color: colors.gray900 },
  eyeBtn: { padding: 4 },
  btnPrimary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  footerText: { color: colors.gray500, fontSize: 14 },
  link: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  featuresCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  featuresTitle: { fontSize: 15, fontWeight: '600', color: colors.gray900, marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureText: { fontSize: 13, color: colors.gray600 },
})

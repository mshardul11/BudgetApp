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
import { DollarSign, Mail, Lock, Eye, EyeOff, User } from 'lucide-react-native'
import { useAuth } from '../context/AuthContext'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { AuthStackParamList } from '../navigation/AppNavigator'
import { colors } from '../theme'

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>

export default function RegisterScreen() {
  const { currentUser, signUpWithEmail } = useAuth()
  const navigation = useNavigation<Nav>()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (currentUser) navigation.replace('Login')
  }, [currentUser])

  const getPasswordStrength = () => ({
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  })

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters')
      return
    }
    try {
      setLoading(true)
      await signUpWithEmail(email, password, name)
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const strength = getPasswordStrength()
  const strengthScore = Object.values(strength).filter(Boolean).length

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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Start tracking your finances today</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <User size={18} color={colors.gray400} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Enter your full name"
                placeholderTextColor={colors.gray400}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <Text style={[styles.label, { marginTop: 16 }]}>Email Address</Text>
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
                placeholder="Create a password (min 8 chars)"
                placeholderTextColor={colors.gray400}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                {showPassword ? <EyeOff size={18} color={colors.gray400} /> : <Eye size={18} color={colors.gray400} />}
              </TouchableOpacity>
            </View>

            {password.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <View style={styles.strengthBar}>
                  {[0, 1, 2, 3].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.strengthSegment,
                        i < strengthScore && {
                          backgroundColor: strengthScore <= 1 ? colors.danger
                            : strengthScore <= 2 ? colors.warning
                            : colors.success
                        }
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.strengthText}>
                  {strengthScore <= 1 ? 'Weak' : strengthScore <= 2 ? 'Fair' : strengthScore <= 3 ? 'Good' : 'Strong'}
                </Text>
              </View>
            )}

            <Text style={[styles.label, { marginTop: 16 }]}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={18} color={colors.gray400} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Confirm your password"
                placeholderTextColor={colors.gray400}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)} style={styles.eyeBtn}>
                {showConfirmPassword ? <EyeOff size={18} color={colors.gray400} /> : <Eye size={18} color={colors.gray400} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, { marginTop: 24 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.btnText}>Create Account</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Sign in here</Text>
            </TouchableOpacity>
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
  strengthBar: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
  },
  strengthText: { fontSize: 11, color: colors.gray500 },
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
})

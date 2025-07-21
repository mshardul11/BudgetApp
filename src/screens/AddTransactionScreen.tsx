
import { View, Text, StyleSheet } from 'react-native'

export default function AddTransactionScreen() {
  return (
    <View style={styles.container}>
      <Text>Add Transaction Screen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
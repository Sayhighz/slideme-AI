import { StyleSheet } from 'react-native';
import { colors, fonts, spacing, shadows } from './theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white
  },
  
  // สไตล์ข้อความ
  title: {
    fontFamily: fonts.regular,
    fontSize: fonts.sizes.xxl,
    color: colors.dark,
    marginBottom: spacing.md
  },
  
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fonts.sizes.lg,
    color: colors.gray[700],
    marginBottom: spacing.sm
  },
  
  text: {
    fontFamily: fonts.regular,
    fontSize: fonts.sizes.md,
    color: colors.dark
  },
  
  textSmall: {
    fontFamily: fonts.regular,
    fontSize: fonts.sizes.sm,
    color: colors.gray[600]
  },
  
  // สไตล์การ์ด
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md
  },
  
  // สไตล์ปุ่ม
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  buttonText: {
    fontFamily: fonts.regular,
    fontSize: fonts.sizes.md,
    color: colors.white
  },
  
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  buttonOutlineText: {
    fontFamily: fonts.regular,
    fontSize: fonts.sizes.md,
    color: colors.primary
  },
  
  // สไตล์อินพุต
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fonts.sizes.md,
    color: colors.dark,
    marginBottom: spacing.md
  },
  
  // สไตล์ส่วนหัว
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    ...shadows.sm
  },
  
  // อื่นๆ
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  
  divider: {
    height: 1,
    backgroundColor: colors.gray[300],
    marginVertical: spacing.md
  }
});
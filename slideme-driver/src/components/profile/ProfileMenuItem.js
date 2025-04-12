import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FONTS, COLORS } from '../../constants';

/**
 * ProfileMenuItem Component
 * @param {Object} props
 * @param {string} props.label - Text to display for the menu item
 * @param {string} props.iconName - Name of the icon from MaterialCommunityIcons
 * @param {function} props.onPress - Function to call when the item is pressed
 * @param {boolean} props.isLast - Whether this is the last item (removes bottom border)
 * @param {boolean} props.isWarning - Whether to style this as a warning item (red color)
 * @param {string} props.badgeText - Optional badge text to show (e.g. for notifications)
 * @param {React.ReactNode} props.rightContent - Optional custom content to show on the right
 */
const ProfileMenuItem = ({ 
  label, 
  iconName, 
  onPress, 
  isLast = false, 
  isWarning = false,
  badgeText,
  rightContent,
  disabled = false
}) => {
  // Color based on state
  const getColor = () => {
    if (disabled) return COLORS.GRAY_400;
    if (isWarning) return COLORS.DANGER;
    return COLORS.PRIMARY;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !isLast && styles.borderBottom,
        disabled && styles.disabled
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${getColor()}10` }]}>
          <Icon 
            name={iconName} 
            size={22} 
            color={getColor()} 
          />
        </View>
        
        <Text style={[
          styles.label,
          isWarning && styles.warningText,
          disabled && styles.disabledText,
        ]}>
          {label}
        </Text>
        
        {/* Badge if provided */}
        {badgeText && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        )}

        {/* Custom right content or default chevron */}
        <View style={styles.rightContainer}>
          {rightContent || (
            <Icon 
              name="chevron-right" 
              size={20} 
              color={disabled ? COLORS.GRAY_400 : COLORS.GRAY_600} 
            />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  warningText: {
    color: COLORS.DANGER,
  },
  badge: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  rightContainer: {
    marginLeft: 'auto',
  },
  disabled: {
    opacity: 0.7,
  },
  disabledText: {
    color: COLORS.GRAY_500,
  },
});

export default ProfileMenuItem;
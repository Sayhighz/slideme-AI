import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import tw from 'twrnc';
import { FONTS, COLORS } from '../../constants';

const { width } = Dimensions.get('window');
const dynamicFontSize = (size) => Math.max(16, (size * width) / 375);

/**
 * Logo component for authentication screens
 * 
 * @param {Object} props
 * @param {string} [props.tagline] - Tagline to display below logo
 * @param {string} [props.style] - Additional style for logo container
 */
const AuthLogo = ({ tagline, style }) => {
  return (
    <View style={tw`flex items-center justify-center ${style}`}>
      <Text
        style={{
          fontFamily: FONTS.FAMILY.REGULAR,
          ...tw.style('text-center', {
            fontSize: dynamicFontSize(52),
            color: COLORS.PRIMARY,
            lineHeight: dynamicFontSize(58),
          }),
        }}
      >
        SLIDE
      </Text>
      <Text
        style={{
          fontFamily: FONTS.FAMILY.REGULAR,
          ...tw.style('text-center', {
            fontSize: dynamicFontSize(80),
            color: COLORS.PRIMARY,
            lineHeight: dynamicFontSize(88),
          }),
        }}
      >
        ME
      </Text>
      
      {tagline && (
        <Text
          style={{
            fontFamily: FONTS.FAMILY.REGULAR,
            ...tw.style(`text-lg text-[${COLORS.PRIMARY}]`, {
              lineHeight: dynamicFontSize(24),
            }),
          }}
        >
          {tagline}
        </Text>
      )}
    </View>
  );
};

export default AuthLogo;
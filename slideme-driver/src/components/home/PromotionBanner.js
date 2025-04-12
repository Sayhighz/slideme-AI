import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  Platform,
  ImageBackground,
  StyleSheet
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';

// Constants
import { FONTS, COLORS, DIMENSIONS } from '../../constants';

const { width } = Dimensions.get('window');
const bannerHeight = 180;

const PromotionBanner = ({ onPress }) => {
  // Platform specific shadow
  const cardShadow = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 5,
    },
  });

  return (
    <View style={tw`px-5 py-3`}>
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={onPress}
        style={[
          tw`rounded-2xl overflow-hidden`,
          cardShadow,
          { height: bannerHeight }
        ]}
      >
        {/* Banner Background with Gradient */}
        <View style={[
          tw`w-full h-full`,
          { backgroundColor: COLORS.PRIMARY }
        ]}>
          {/* Pattern decoration */}
          <View style={styles.patternContainer}>
            <View style={styles.circle1} />
            <View style={styles.circle2} />
            <View style={styles.circle3} />
          </View>
          
          {/* Content */}
          <View style={tw`p-6 flex-row z-10`}>
            <View style={tw`flex-1 justify-center`}>
              <Text style={[
                tw`text-white text-2xl mb-2`,
                { fontFamily: FONTS.FAMILY.MEDIUM }
              ]}>
                รับงานมากขึ้น{'\n'}รายได้เพิ่มขึ้น
              </Text>
              
              <Text style={[
                tw`text-white opacity-90 text-base mb-4`,
                { fontFamily: FONTS.FAMILY.REGULAR }
              ]}>
                แนะนำเพื่อนมาร่วมงานกับเรา{'\n'}รับโบนัสทันที 500 บาท
              </Text>
              
              <TouchableOpacity 
                style={tw`bg-white flex-row items-center justify-center py-2.5 px-4 rounded-lg mt-2 w-44 shadow-sm`}
                activeOpacity={0.8}
              >
                <Text style={[
                  tw`text-green-600 font-medium mr-1`,
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}>
                  ดูรายละเอียด
                </Text>
                <Icon name="chevron-right" size={16} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            </View>
            
            <View style={tw`w-24 items-center justify-center`}>
              <View style={styles.giftIconContainer}>
                <Icon name="gift-outline" size={64} color="white" />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  patternContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -30,
  },
  circle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -30,
    right: 60,
  },
  circle3: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: 40,
    right: 40,
  },
  giftIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default PromotionBanner;
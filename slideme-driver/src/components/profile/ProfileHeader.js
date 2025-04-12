import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import tw from 'twrnc';
import { IMAGE_URL } from '../../config';
import { FONTS, COLORS } from '../../constants';
import { useDriverScore } from '../../utils/hooks';

const ProfileHeader = ({ userData, onEditPress }) => {
  const { driverScore, loading } = useDriverScore(userData?.driver_id);
  
  // Fallback image if profile picture is missing
  const profileImage = userData?.profile_picture 
    ? { uri: `${IMAGE_URL}${userData.profile_picture}`, headers: { pragma: 'no-cache' } }
    : require('../../assets/images/default-avatar.png'); // Make sure to add this default image
  
  // Generate stars based on rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Icon key={`full-${i}`} name="star" size={16} color="#FFC107" style={tw`mx-0.5`} />
      );
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <Icon key="half" name="star-half" size={16} color="#FFC107" style={tw`mx-0.5`} />
      );
    }

    // Add empty stars to make 5 stars total
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Icon key={`empty-${i}`} name="star-outline" size={16} color="#FFC107" style={tw`mx-0.5`} />
      );
    }

    return stars;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        <View style={styles.avatarContainer}>
          <Image
            source={profileImage}
            style={styles.avatar}
            defaultSource={require('../../assets/images/default-avatar.png')} // Fallback during loading
          />
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.greeting}>
            สวัสดี!
          </Text>
          <Text style={styles.name}>
            {`${userData?.first_name || "ไม่พบข้อมูล"} ${userData?.last_name || ""}`}
          </Text>
          
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {loading ? (
                <Text style={styles.loadingText}>กำลังโหลด...</Text>
              ) : (
                renderStars(parseFloat(driverScore) || 0)
              )}
            </View>
            <Text style={styles.ratingText}>
              {loading ? "-" : (driverScore || "0.0")}
            </Text>
          </View>
        </View>

        {onEditPress && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={onEditPress}
          >
            <Icon name="edit" size={20} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.PRIMARY,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  infoContainer: {
    marginLeft: 16,
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#9e9e9e',
    fontFamily: FONTS.FAMILY.REGULAR,
    marginBottom: 2,
  },
  name: {
    fontSize: 20,
    color: COLORS.PRIMARY,
    fontFamily: FONTS.FAMILY.BOLD || FONTS.FAMILY.REGULAR,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#757575',
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  loadingText: {
    fontSize: 12,
    color: '#9e9e9e',
    fontFamily: FONTS.FAMILY.REGULAR,
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
});

export default ProfileHeader;
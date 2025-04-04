import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import tw from 'twrnc';
import { getRequest } from '../../services/api';
import { FONTS, COLORS } from '../../constants';
import { formatDate } from '../../utils/formatters';

const ReviewItem = ({ review }) => {
  // Generate stars based on rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Icon key={`full-${i}`} name="star" size={16} color="orange" style={tw`mr-1`} />
      );
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(
        <Icon key="half" name="star-half" size={16} color="orange" style={tw`mr-1`} />
      );
    }

    // Add empty stars to make 5 stars total
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Icon key={`empty-${i}`} name="star-outline" size={16} color="orange" style={tw`mr-1`} />
      );
    }

    return stars;
  };

  return (
    <View style={tw`bg-white p-4 rounded-lg shadow-sm mb-3`}>
      <View style={tw`flex-row justify-between items-center mb-2`}>
        <View style={tw`flex-row items-center`}>
          {renderStars(review.rating)}
          <Text 
            style={[
              tw`ml-1 text-gray-700`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            {review.rating.toFixed(1)}
          </Text>
        </View>
        <Text 
          style={[
            tw`text-gray-500 text-xs`, 
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          {formatDate(review.review_date)}
        </Text>
      </View>
      
      {review.review_text && (
        <Text 
          style={[
            tw`text-gray-700`, 
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          "{review.review_text}"
        </Text>
      )}
      
      <Text 
        style={[
          tw`text-gray-500 mt-2 text-xs`, 
          { fontFamily: FONTS.FAMILY.REGULAR }
        ]}
      >
        โดย: {review.customer_name || 'ลูกค้า'}
      </Text>
    </View>
  );
};

const DriverReviews = ({ driverId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDriverReviews = async () => {
      if (!driverId) {
        setLoading(false);
        return;
      }

      try {
        // This is a placeholder API endpoint - adjust to match your actual API
        const response = await getRequest(`driver/reviews/${driverId}`);
        if (response && response.Status) {
          setReviews(response.Result || []);
        } else {
          // If no reviews yet, set empty array
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching driver reviews:', error);
        setError('ไม่สามารถดึงข้อมูลรีวิวได้');
      } finally {
        setLoading(false);
      }
    };

    fetchDriverReviews();
  }, [driverId]);

  if (loading) {
    return (
      <View style={tw`py-4 items-center`}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={tw`py-4 items-center`}>
        <Text 
          style={[
            tw`text-red-500`, 
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          {error}
        </Text>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={tw`py-4 items-center`}>
        <Text 
          style={[
            tw`text-gray-500`, 
            { fontFamily: FONTS.FAMILY.REGULAR }
          ]}
        >
          ยังไม่มีรีวิว
        </Text>
      </View>
    );
  }

  return (
    <View style={tw`mt-2`}>
      <FlatList
        data={reviews}
        renderItem={({ item }) => <ReviewItem review={item} />}
        keyExtractor={(item, index) => `review-${item.review_id || index}`}
        ListHeaderComponent={
          <Text 
            style={[
              tw`text-lg mb-3 text-gray-700`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            รีวิวจากลูกค้า
          </Text>
        }
        ListEmptyComponent={
          <Text 
            style={[
              tw`text-gray-500 text-center py-4`, 
              { fontFamily: FONTS.FAMILY.REGULAR }
            ]}
          >
            ยังไม่มีรีวิว
          </Text>
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );
};

export default DriverReviews;
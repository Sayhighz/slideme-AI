import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import tw from 'twrnc';
import { getRequest } from '../../services/api';
import { FONTS, COLORS } from '../../constants';

// Import Components
import HeaderWithBackButton from '../../components/common/HeaderWithBackButton';
import DriverReviews from '../../components/profile/DriverReviews';

const ReviewsScreen = ({ navigation, route }) => {
  const { userData = {} } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingsBreakdown, setRatingsBreakdown] = useState({
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  });

  useEffect(() => {
    const fetchReviewStats = async () => {
      if (!userData?.driver_id) {
        setLoading(false);
        return;
      }

      try {
        // This would be your actual API endpoint for getting driver rating stats
        const response = await getRequest(`driver/rating-stats/${userData.driver_id}`);
        if (response && response.Status) {
          setAvgRating(response.Result.average_rating || 0);
          setTotalReviews(response.Result.total_reviews || 0);
          
          // Set ratings breakdown if available
          if (response.Result.breakdown) {
            setRatingsBreakdown(response.Result.breakdown);
          }
        }
      } catch (error) {
        console.error('Error fetching review stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviewStats();
  }, [userData?.driver_id]);

  // Render rating breakdown bar
  const renderRatingBar = (stars, percentage) => (
    <View style={tw`flex-row items-center mb-2`}>
      <Text style={[tw`w-6 text-gray-600`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
        {stars}
      </Text>
      <View style={tw`flex-1 h-3 bg-gray-200 rounded-full mx-2`}>
        <View 
          style={[
            tw`h-3 bg-[${COLORS.PRIMARY}] rounded-full`, 
            { width: `${percentage}%` }
          ]} 
        />
      </View>
      <Text style={[tw`w-8 text-right text-gray-600`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
        {percentage}%
      </Text>
    </View>
  );

  // Calculate percentages for rating breakdown
  const calculatePercentages = () => {
    if (totalReviews === 0) return ratingsBreakdown;
    
    const percentages = {};
    for (const key in ratingsBreakdown) {
      percentages[key] = Math.round((ratingsBreakdown[key] / totalReviews) * 100);
    }
    return percentages;
  };

  const percentages = calculatePercentages();

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <HeaderWithBackButton
        showBackButton={true}
        title="รีวิวของฉัน"
        onPress={() => navigation.goBack()}
      />

      <View style={tw`px-4 py-4`}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        ) : (
          <>
            {/* Rating Summary */}
            <View style={tw`bg-white rounded-lg shadow-sm p-4 mb-4 items-center`}>
              <Text 
                style={[
                  tw`text-3xl text-[${COLORS.PRIMARY}] font-bold`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                {avgRating.toFixed(1)}
              </Text>
              <Text 
                style={[
                  tw`text-gray-500`, 
                  { fontFamily: FONTS.FAMILY.REGULAR }
                ]}
              >
                จาก 5 คะแนน ({totalReviews} รีวิว)
              </Text>
              
              {/* Rating Breakdown */}
              <View style={tw`w-full mt-4`}>
                {renderRatingBar(5, percentages[5])}
                {renderRatingBar(4, percentages[4])}
                {renderRatingBar(3, percentages[3])}
                {renderRatingBar(2, percentages[2])}
                {renderRatingBar(1, percentages[1])}
              </View>
            </View>

            {/* Reviews List */}
            <DriverReviews driverId={userData?.driver_id} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ReviewsScreen;
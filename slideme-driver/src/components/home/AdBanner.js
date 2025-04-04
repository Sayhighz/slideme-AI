import React from 'react';
import { View, Image } from 'react-native';
import Swiper from 'react-native-swiper';
import tw from 'twrnc';
import { IMAGE_URL } from '../../config';

const AdBanner = ({ ads = [] }) => {
  // If no ads provided, use default empty array to prevent errors
  const displayAds = ads.length > 0 ? ads : [
    { id: 1, image: 'default_ad1.png' },
    { id: 2, image: 'default_ad2.png' },
  ];

  return (
    <View style={tw`w-19/20 mx-auto h-40 bg-gray-200 mt-4 rounded-lg`}>
      <Swiper
        autoplay
        autoplayTimeout={3}
        showsPagination
        loop
        activeDotColor="green"
        dotColor="gray"
        dotStyle={tw`w-2 h-2 bg-gray-600 rounded-full`}
        activeDotStyle={tw`w-3 h-3 bg-[#60B876] rounded-full`}
      >
        {displayAds.map((ad) => (
          <View 
            key={ad.id} 
            style={tw`flex items-center justify-center w-full h-full`}
          >
            <Image
              source={{ uri: `${IMAGE_URL}${ad.image}` }}
              style={tw`w-full h-full`}
              resizeMode="cover"
            />
          </View>
        ))}
      </Swiper>
    </View>
  );
};

export default AdBanner;
import React from "react";
import { View, Image } from "react-native";
import Swiper from "react-native-swiper";
import tw from "twrnc";

const AdBanner = ({ ads }) => {
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
        {ads.map((ad) => (
          <View key={ad.id} style={tw`flex items-center justify-center w-full h-full`}>
            <Image
              source={{ uri: ad.image }}
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

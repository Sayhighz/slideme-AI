import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import tw from 'twrnc';
import { getRequest } from '../../services/api';
import { API_ENDPOINTS } from '../../constants';
import { formatNumberWithCommas, truncateText } from '../../utils/formatters';

const OffersList = ({ driverId, navigation }) => {
  const [offersData, setOffersData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const data = await getRequest(`${API_ENDPOINTS.JOBS.GET_OFFERS}?driver_id=${driverId}`);
        if (data.Status && Array.isArray(data.Result)) {
          setOffersData(data.Result);
        }
      } catch (error) {
        console.error("Error fetching offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [driverId]);

  const getFormattedStatus = (status) => {
    switch (status) {
      case "pending":
        return (
          <Text style={[tw`text-yellow-500 text-xs`, { fontFamily: 'Mitr-Regular' }]}>
            รออนุมัติ
          </Text>
        );
      case "accepted":
        return (
          <Text style={[tw`text-green-500 text-xs`, { fontFamily: 'Mitr-Regular' }]}>
            อยู่ระหว่างการทำงาน
          </Text>
        );
      default:
        return <Text style={{ fontFamily: 'Mitr-Regular' }}>{status}</Text>;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => {
        if (item.offer_status === "accepted") {
          navigation.navigate("JobWorkingPickup", { request_id: item.request_id });
        } else {
          // Maybe navigate to offer details or show modal
        }
      }}
      style={tw`p-2 bg-white rounded-lg mb-2 shadow-md border border-gray-300 mx-3 flex-row justify-between`}
    >
      <View style={tw`flex-1`}>
        <View style={tw`flex-row items-center mb-1`}>
          <Icon name="map-marker" size={13} color="gray" />
          <Text style={[tw`text-xs ml-1`, { fontFamily: 'Mitr-Regular' }]}>
            {truncateText(item.location_from)}
          </Text>
        </View>
        <View style={tw`flex-row items-center`}>
          <Icon name="map-marker" size={13} color="gray" />
          <Text style={[tw`text-xs ml-1`, { fontFamily: 'Mitr-Regular' }]}>
            {truncateText(item.location_to)}
          </Text>
        </View>
      </View>
      <View style={tw`flex-1 justify-center items-center`}>
        {getFormattedStatus(item.offer_status)}
        <Text style={[tw`text-xs mt-1`, { fontFamily: 'Mitr-Regular' }]}>
          {truncateText(item.vehicle_type)}
        </Text>
      </View>
      <View style={tw`flex-1 justify-center items-end`}>
        <Text style={[tw`text-blue-500 text-xs`, { fontFamily: 'Mitr-Regular' }]}>
          ราคาที่เสนอ
        </Text>
        <Text style={[tw`text-xs mt-1`, { fontFamily: 'Mitr-Regular' }]}>
          {item.offered_price
            ? `฿${formatNumberWithCommas(item.offered_price)}`
            : "N/A"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <View style={tw`w-19/20 mx-auto mt-4 p-4`}>
        <Text style={[tw`text-gray-600 text-xl mb-2 text-center`, { fontFamily: 'Mitr-Regular' }]}>
          รายการเสนอราคา
        </Text>
      </View>
      <FlatList
        data={offersData}
        keyExtractor={(item) => item.offer_id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? (
            <Text style={[tw`text-center text-gray-500`, { fontFamily: 'Mitr-Regular' }]}>
              กำลังโหลด...
            </Text>
          ) : (
            <Text style={[tw`text-center text-gray-500`, { fontFamily: 'Mitr-Regular' }]}>
              ไม่มีข้อมูลเสนอราคา
            </Text>
          )
        }
      />
    </>
  );
};

export default OffersList;
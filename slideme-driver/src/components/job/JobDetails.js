import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker } from 'react-native-maps';
import tw from 'twrnc';
import { FONTS } from '../../constants';
import { formatJobDetails } from '../../utils/formatters/job';
import { openGoogleMaps } from '../../utils/helpers';

const JobDetails = ({ job, onAccept }) => {
  const formattedJob = formatJobDetails(job);

  return (
    <ScrollView style={tw`flex-1 bg-white`}>
      {/* Map Preview */}
      <TouchableOpacity 
        onPress={() => openGoogleMaps(job.pickup_lat, job.pickup_long)}
        style={tw`h-64 bg-gray-200 mb-4`}
      >
        <MapView
          style={tw`flex-1`}
          initialRegion={{
            latitude: parseFloat(job.pickup_lat),
            longitude: parseFloat(job.pickup_long),
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: parseFloat(job.pickup_lat),
              longitude: parseFloat(job.pickup_long),
            }}
            title="จุดรับ"
          />
        </MapView>
      </TouchableOpacity>

      {/* Job Information */}
      <View style={tw`p-4`}>
        {/* Locations */}
        <View style={tw`mb-4`}>
          <View style={tw`flex-row items-center mb-2`}>
            <Icon name="map-marker" size={24} color="green" />
            <Text 
              style={[
                tw`ml-2 text-gray-700`, 
                { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.M }
              ]}
            >
              ต้นทาง
            </Text>
          </View>
          <Text 
            style={[
              tw`ml-8 text-gray-600`, 
              { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.S }
            ]}
          >
            {job.location_from}
          </Text>

          <View style={tw`flex-row items-center mb-2 mt-4`}>
            <Icon name="map-marker" size={24} color="red" />
            <Text 
              style={[
                tw`ml-2 text-gray-700`, 
                { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.M }
              ]}
            >
              ปลายทาง
            </Text>
          </View>
          <Text 
            style={[
              tw`ml-8 text-gray-600`, 
              { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.S }
            ]}
          >
            {job.location_to}
          </Text>
        </View>

        {/* Job Additional Info */}
        <View style={tw`bg-gray-100 p-4 rounded-lg`}>
          <View style={tw`flex-row justify-between mb-2`}>
            <Text 
              style={[
                tw`text-gray-700`, 
                { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.S }
              ]}
            >
              ประเภทรถ
            </Text>
            <Text 
              style={[
                tw`text-gray-600`, 
                { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.S }
              ]}
            >
              {job.vehicle_type || 'ไม่ระบุ'}
            </Text>
          </View>
          <View style={tw`flex-row justify-between mb-2`}>
            <Text 
              style={[
                tw`text-gray-700`, 
                { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.S }
              ]}
            >
              ระยะทาง
            </Text>
            <Text 
              style={[
                tw`text-blue-500`, 
                { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.S }
              ]}
            >
              {job.distance} กิโลเมตร
            </Text>
          </View>
          <View style={tw`flex-row justify-between`}>
            <Text 
              style={[
                tw`text-gray-700`, 
                { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.S }
              ]}
            >
              ราคา
            </Text>
            <Text 
              style={[
                tw`text-green-500`, 
                { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.M }
              ]}
            >
              ฿{formattedJob.formattedPrice}
            </Text>
          </View>
        </View>

        {/* Customer Message */}
        {job.customer_message && (
          <View style={tw`mt-4`}>
            <Text 
              style={[
                tw`text-gray-700 mb-2`, 
                { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.S }
              ]}
            >
              ข้อความจากลูกค้า
            </Text>
            <Text 
              style={[
                tw`text-gray-600 p-3 bg-gray-100 rounded-lg`, 
                { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.S }
              ]}
            >
              {job.customer_message}
            </Text>
          </View>
        )}
      </View>

      {/* Accept Button */}
      <TouchableOpacity 
        style={tw`m-4 p-4 bg-[#60B876] rounded-lg`}
        onPress={onAccept}
      >
        <Text 
          style={[
            tw`text-white text-center`, 
            { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.M }
          ]}
        >
          ยื่นข้อเสนอ
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default JobDetails;
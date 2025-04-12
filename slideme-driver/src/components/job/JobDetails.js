import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import tw from 'twrnc';
import { FONTS, COLORS } from '../../constants';
import { formatJobDetails } from '../../utils/formatters/job';
import { openGoogleMaps } from '../../utils/helpers';

const JobDetails = ({ job, onAccept }) => {
  const formattedJob = formatJobDetails(job);

  // Handle navigation to Google Maps
  const navigateToPickup = () => {
    openGoogleMaps(job.pickup_lat, job.pickup_long);
  };

  return (
    <ScrollView style={tw`flex-1 bg-white`} showsVerticalScrollIndicator={false}>
      {/* Map Preview with Label */}
      <View>
        <View style={tw`absolute top-4 left-4 z-10 bg-white py-1 px-3 rounded-full shadow-md flex-row items-center`}>
          <Icon name="map-marker" size={16} color={COLORS.PRIMARY} />
          <Text style={[tw`ml-1 text-gray-800`, { fontFamily: FONTS.FAMILY.MEDIUM }]}>
            จุดรับรถ
          </Text>
        </View>
        
        <TouchableOpacity 
          onPress={navigateToPickup}
          style={tw`h-56`}
          activeOpacity={0.9}
        >
          <MapView
            provider={PROVIDER_GOOGLE}
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
            >
              <View style={tw`items-center`}>
                <View style={tw`bg-green-600 p-2 rounded-full border-2 border-white`}>
                  <Icon name="map-marker" size={20} color="white" />
                </View>
              </View>
            </Marker>
          </MapView>
          
          <View style={tw`absolute bottom-3 right-3`}>
            <TouchableOpacity 
              style={tw`bg-white p-2 rounded-full shadow-md`}
              onPress={navigateToPickup}
            >
              <Icon name="directions" size={24} color={COLORS.PRIMARY} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>

      {/* Job Information */}
      <View style={tw`px-4 pt-6 pb-4`}>
        <View style={tw`mb-6`}>
          <Text style={[tw`text-lg mb-4 text-gray-800`, { fontFamily: FONTS.FAMILY.MEDIUM }]}>
            รายละเอียดเส้นทาง
          </Text>
          
          {/* Origin */}
          <View style={[tw`flex-row mb-4`, styles.locationContainer]}>
            <View style={tw`items-center mr-3`}>
              <View style={tw`w-10 h-10 rounded-full bg-green-100 items-center justify-center`}>
                <Icon name="map-marker" size={20} color="green" />
              </View>
              <View style={tw`h-14 w-0.5 bg-gray-300 mt-1 mb-1`} />
            </View>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-gray-500 mb-1`, { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.XS }]}>
                ต้นทาง
              </Text>
              <Text style={[tw`text-gray-800`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
                {job.location_from}
              </Text>
            </View>
          </View>
          
          {/* Destination */}
          <View style={[tw`flex-row`, styles.locationContainer]}>
            <View style={tw`items-center mr-3`}>
              <View style={tw`w-10 h-10 rounded-full bg-red-100 items-center justify-center`}>
                <Icon name="map-marker" size={20} color="red" />
              </View>
            </View>
            <View style={tw`flex-1`}>
              <Text style={[tw`text-gray-500 mb-1`, { fontFamily: FONTS.FAMILY.REGULAR, fontSize: FONTS.SIZE.XS }]}>
                ปลายทาง
              </Text>
              <Text style={[tw`text-gray-800`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
                {job.location_to}
              </Text>
            </View>
          </View>
        </View>

        {/* Job Details Card */}
        <View style={[tw`bg-gray-50 p-4 rounded-xl mb-6`, styles.detailsCard]}>
          <Text style={[tw`text-gray-800 mb-3`, { fontFamily: FONTS.FAMILY.MEDIUM }]}>
            รายละเอียดงาน
          </Text>
          
          <View style={tw`flex-row justify-between mb-3`}>
            <View style={tw`flex-row items-center`}>
              <Icon name="car" size={18} color={COLORS.GRAY_600} />
              <Text style={[tw`ml-2 text-gray-600`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
                ประเภทรถ
              </Text>
            </View>
            <Text style={[tw`text-gray-800`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
              {job.vehicle_type || 'ไม่ระบุ'}
            </Text>
          </View>
          
          <View style={tw`flex-row justify-between mb-3`}>
            <View style={tw`flex-row items-center`}>
              <Icon name="map-marker-distance" size={18} color={COLORS.GRAY_600} />
              <Text style={[tw`ml-2 text-gray-600`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
                ระยะทาง
              </Text>
            </View>
            <Text style={[tw`text-blue-500`, { fontFamily: FONTS.FAMILY.MEDIUM }]}>
              {job.distance} กิโลเมตร
            </Text>
          </View>
          
          <View style={tw`flex-row justify-between`}>
            <View style={tw`flex-row items-center`}>
              <Icon name="cash" size={18} color={COLORS.GRAY_600} />
              <Text style={[tw`ml-2 text-gray-600`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
                ราคา
              </Text>
            </View>
            <Text style={[tw`text-[${COLORS.PRIMARY}] text-lg`, { fontFamily: FONTS.FAMILY.MEDIUM }]}>
              ฿{formattedJob.formattedPrice}
            </Text>
          </View>
        </View>

        {/* Customer Message */}
        {job.customer_message && (
          <View style={tw`mb-6`}>
            <Text style={[tw`text-gray-800 mb-2`, { fontFamily: FONTS.FAMILY.MEDIUM }]}>
              ข้อความจากลูกค้า
            </Text>
            <View style={[tw`p-4 bg-blue-50 rounded-xl border border-blue-100`, styles.messageCard]}>
              <View style={tw`flex-row items-start`}>
                <Icon name="message-text-outline" size={20} color={COLORS.SECONDARY} style={tw`mt-1 mr-3`} />
                <Text style={[tw`text-gray-700 flex-1`, { fontFamily: FONTS.FAMILY.REGULAR }]}>
                  {job.customer_message}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Accept Button */}
      <View style={tw`px-4 pb-6`}>
        <TouchableOpacity 
          style={[
            tw`p-4 bg-[${COLORS.PRIMARY}] rounded-xl items-center`, 
            styles.acceptButton
          ]}
          onPress={onAccept}
          activeOpacity={0.8}
        >
          <Text 
            style={[
              tw`text-white text-center text-lg`, 
              { fontFamily: FONTS.FAMILY.MEDIUM }
            ]}
          >
            ยื่นข้อเสนอ
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  locationContainer: {
    position: 'relative',
  },
  detailsCard: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  messageCard: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  acceptButton: {
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  }
});

export default JobDetails;
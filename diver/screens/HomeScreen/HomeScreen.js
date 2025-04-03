import React, { useState } from "react";
import { SafeAreaView, View, Alert, TouchableOpacity, Text } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import tw from "twrnc";
import { getRequest, postRequest } from "../../lib/axios"; // ใช้ฟังก์ชันที่สร้างไว้

// Import Components ที่แยกออกมาแล้ว
import Header from "../../components/HomeScreen/Header";
import ProfitDisplay from "../../components/HomeScreen/ProfitDisplay";
import OffersList from "../../components/HomeScreen/OffersList";
import AdBanner from "../../components/HomeScreen/AdBanner";
import OfferModal from "../../components/HomeScreen/OfferModal";

// Component NotificationRequest ยังคงอยู่ใน HomeScreen.js
import NotificationRequest from "../NotificationRequest";

export default function HomeScreen({ route }) {
  const navigation = useNavigation();
  const { userData = {} } = route.params || {};

  const [offersData, setOffersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [notificationKey, setNotificationKey] = useState(0);
  const [profitToday, setProfitToday] = useState(0);
  const [driverScore, setDriverScore] = useState(0);

  // Array สำหรับโฆษณาที่จะแสดงใน AdBanner
  const notice = [
    { id: 1, image: `/fetch_image?filename=ads1.png` },
    { id: 2, image: `/fetch_image?filename=ads2.png` },
    { id: 3, image: `/fetch_image?filename=ads3.png` },
  ];

  // เรียก API ดึงยอดรายได้วันนี้
  useFocusEffect(
    React.useCallback(() => {
      const fetchProfitToday = async () => {
        try {
          const data = await getRequest(`/driver/profitToday?driver_id=${userData?.driver_id}`);
          setProfitToday(data.Status && data.Result.length > 0 ? data.Result[0].profit_today : 0);
        } catch (error) {
          console.error("เกิดข้อผิดพลาดขณะดึงข้อมูลรายได้วันนี้:", error);
          Alert.alert("ข้อผิดพลาด", "ไม่สามารถดึงข้อมูลรายได้วันนี้ได้ กรุณาลองใหม่อีกครั้ง");
          setProfitToday(0);
        }
      };

      fetchProfitToday();
    }, [userData?.driver_id])
  );

  // เรียก API ดึงคะแนนของผู้ขับ
  useFocusEffect(
    React.useCallback(() => {
      const fetchDriverScore = async () => {
        try {
          const data = await getRequest(`/driver/score?driver_id=${userData?.driver_id}`);
          setDriverScore(data.Status && data.Result.length > 0 ? data.Result[0].Score : 0);
        } catch (error) {
          console.error("เกิดข้อผิดพลาดขณะดึงคะแนนของผู้ขับ:", error);
          Alert.alert("ข้อผิดพลาด", "ไม่สามารถดึงคะแนนของผู้ขับได้ กรุณาลองใหม่อีกครั้ง");
          setDriverScore(0);
        }
      };

      fetchDriverScore();
    }, [userData?.driver_id])
  );

  // เรียก API ดึงรายการข้อเสนอ
  useFocusEffect(
    React.useCallback(() => {
      const fetchOffers = async () => {
        try {
          const data = await getRequest(`/driver/getOffersFromDriver?driver_id=${userData?.driver_id}`);
          if (data.Status && Array.isArray(data.Result)) {
            setOffersData(data.Result);
          } else {
            throw new Error("ข้อมูลที่ได้รับไม่ถูกต้อง");
          }
        } catch (error) {
          console.error("เกิดข้อผิดพลาดขณะดึงข้อมูลข้อเสนอ:", error);
          Alert.alert("ข้อผิดพลาด", "ไม่สามารถดึงข้อมูลข้อเสนอได้ กรุณาลองใหม่อีกครั้ง");
          setOffersData([]);
        } finally {
          setLoading(false);
        }
      };

      fetchOffers();
      setNotificationKey((prevKey) => prevKey + 1); // รีโหลด NotificationRequest
    }, [userData?.driver_id])
  );

  // เมื่อผู้ใช้กดที่รายการข้อเสนอ
  const handleOfferPress = (offer) => {
    if (offer.offer_status === "accepted") {
      navigation.navigate("JobWorking_Pickup", {
        request_id: offer.request_id,
      });
    } else {
      setSelectedOffer(offer);
      setModalVisible(true);
    }
  };

  // ฟังก์ชันสำหรับยกเลิกข้อเสนอ
  const handleCancelOffer = async (offerId) => {
    try {
      const data = await postRequest(`/driver/cancel_offer`, { offer_id: offerId });

      if (data.Status) {
        Alert.alert("สำเร็จ", "การยกเลิกข้อเสนอสำเร็จ");
        setOffersData((prevData) => prevData.filter((offer) => offer.offer_id !== offerId));
        setModalVisible(false);
      } else {
        throw new Error(data.message || "ไม่สามารถยกเลิกข้อเสนอได้");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดขณะยกเลิกข้อเสนอ:", error);
      Alert.alert("ข้อผิดพลาด", "ไม่สามารถยกเลิกข้อเสนอได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header Component */}
      <Header userData={userData} driverScore={driverScore} />

      {/* ProfitDisplay Component */}
      <ProfitDisplay profitToday={profitToday} />

      {/* OffersList Component */}
      <OffersList offersData={offersData} loading={loading} handleOfferPress={handleOfferPress} />

      {/* AdBanner Component */}
      <AdBanner ads={notice.map((ad) => ({ ...ad, image: `/fetch_image?filename=${ad.image}` }))} />

      {/* OfferModal Component */}
      <OfferModal visible={modalVisible} selectedOffer={selectedOffer} onClose={() => setModalVisible(false)} onCancelOffer={handleCancelOffer} />

      <View style={tw`flex-1 h-4`} />

      {/* Bottom Action/Button */}
      <View style={tw`absolute bottom-4 w-full items-center`}>
        <TouchableOpacity
          style={[
            tw`w-11/12 bg-[#60B876] rounded p-2 items-center`,
            offersData.length >= 2 && tw`bg-gray-400`,
          ]}
          disabled={offersData.length >= 2}
          onPress={() => navigation.navigate("JobsScreen", { driver_id: userData?.driver_id })}
        >
          <Text style={[{ fontFamily: "Mitr-Regular" }, tw`text-white text-lg`]}>ค้นหางาน</Text>
        </TouchableOpacity>
        <NotificationRequest key={notificationKey} driver_id={userData?.driver_id} status={false} />
      </View>
    </SafeAreaView>
  );
}

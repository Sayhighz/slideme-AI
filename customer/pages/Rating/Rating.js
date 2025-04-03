import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import StarRating from "react-native-star-rating-widget";
import { IP_ADDRESS } from "../../config";
import { MaterialIcons } from "@expo/vector-icons";

import tw from "twrnc";
import { useRoute } from "@react-navigation/native";
import HeaderWithBackButton from "../../components/HeaderWithBackButton";

const Rating = ({ navigation }) => {
  const route = useRoute();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceData, setServiceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const requestId = route.params.requestId;
  const inputRef = useRef(null);

  const { width, height } = Dimensions.get("window");
  const responsiveWidth = width * 0.9;
  const responsiveHeight = height * 0.2;

  useEffect(() => {
    // Automatically focus the TextInput when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const getRatingText = (rating) => {
    switch (rating) {
      case 1:
        return "ควรปรับปรุง";
      case 2:
        return "ไม่ค่อยดี";
      case 3:
        return "พอใช้";
      case 4:
        return "ดีมาก";
      case 5:
        return "ยอดเยี่ยม";
      default:
        return "";
    }
  };

  useEffect(() => {
    // Fetch data from the API
    const fetchServiceInfo = async () => {
      try {
        const response = await fetch(
          `http://${IP_ADDRESS}:3000/auth/customer/getServiceInfo?request_id=${requestId}`
        );
        const data = await response.json();
        console.log("Service data:", data);
        setServiceData(data.Result[0]); // Assuming data is an array with one object
      } finally {
        setLoading(false);
      }
    };

    fetchServiceInfo();
  }, []);

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const handleSubmitReview = async () => {
    if (rating === 0) {
      Alert.alert("Error", "Please provide a rating and a review");

      return;
    }

    setIsSubmitting(true);

    const newReview = {
      request_id: route.params.requestId, // Replace with actual request_id as needed
      customer_id: route.params.customer_id_request, // Replace with actual customer_id as needed
      driver_id: route.params.driver_id, // Replace with actual driver_id as needed
      rating: rating,
      review_text: review.trim(),
    };

    try {
      const response = await fetch(
        `http://${IP_ADDRESS}:3000/auth/add_reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newReview),
        }
      );
      // Simulate sending review to database
      console.log("Submitted Review:", newReview); // Replace this with your database call

      const result = await response.json();

      if (result.Status) {
        Alert.alert(
          "Success",
          "Thank you for your review!",
          [{ text: "OK", onPress: () => navigation.navigate("HomePage") }],
          { cancelable: false }
        );
        setReview("");
        setRating(0);
      } else {
        Alert.alert("Error", `Failed to submit review: ${result.Error}`);
      }
    } catch (error) {
      Alert.alert("Error", `Something went wrong: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const truncateText = (text, maxLength = 22) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  return (
    <>
    <HeaderWithBackButton showBackButton={true} title="" onPress={() => navigation.navigate("HomePage")} />
    <View style={tw`flex-1 p-4 items-center`}>
      <Text style={[styles.globalText,tw`text-2xl mt-2 text-center`]}>ขอบคุณที่ใช้บริการ</Text>
      <Text style={[styles.globalText,tw`text-xl mb-2 text-center text-gray-600`]}>ให้คะแนนกับคนขับเพื่อให้การบริการดียิ่งขึ้น</Text>
      <View
        style={[
          tw`flex bg-white p-4 rounded-lg border border-gray-300 w-11/12 shadow-md `,
        ]}
      >
        

        <Text style={styles.globalText}>{`คนขับ: ${truncateText(
          serviceData.first_name
        )} ${truncateText(serviceData.last_name)}`}</Text>
        <View style={tw`flex-row items-center`}> 
          
        <Text style={[styles.globalText]} >
          {`คะแนน: ${serviceData.average_rating?.toFixed(1) ? serviceData.average_rating.toFixed(1) : 0}`}
        </Text>
          <MaterialIcons name="star" size={17} color="orange"/>
        </View>
        
        <Text style={styles.globalText}>
          {`ราคา: ${serviceData.price}`} บาท
        </Text>
        <Text
          style={[styles.globalText]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          <MaterialIcons name="location-on" size={17} color="red" />
          {`ต้นทาง: ${serviceData.location_from}`}
        </Text>
        <Text style={styles.globalText} numberOfLines={1} ellipsizeMode="tail">
          <MaterialIcons name="location-on" size={17} color="green" />
          {`ปลายทาง: ${serviceData.location_to}`}
        </Text>
      </View>
      <Text
        style={[styles.globalText, tw`text-3xl mb-1 mt-5 text-center pt-2`]}
      >
        {getRatingText(rating)}
      </Text>
      <StarRating
        rating={rating}
        onChange={setRating}
        starSize={40}
        color="orange" // Optional: Customize color
        emptyColor="#d4d4d4" // Optional: Customize empty star color
        enableHalfStar={false}
      />
      <TextInput
        style={[
          styles.globalText,
          tw`border border-gray-300 rounded p-2 w-full mb-4 mt-2 h-20`,
        ]}
        placeholder="คำแนะนำให้คนขับ..."
        value={review}
        onChangeText={setReview}
        editable={!isSubmitting}
        multiline={true}
        textAlignVertical="top"
      />
      <View style={tw`w-full mb-4`}>
        <TouchableOpacity
          onPress={handleSubmitReview}
          disabled={isSubmitting}
          style={tw`bg-${
            isSubmitting ? "[#60B876]" : "[#60B876]"
          } text-white rounded p-2`}
        >
          <Text style={[styles.globalText, tw`text-center text-white text-xl`]}>
            {isSubmitting ? "Submitting..." : "ส่งรีวิว"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  globalText: {
    fontFamily: "Mitr-Regular",
  },
});

export default Rating;

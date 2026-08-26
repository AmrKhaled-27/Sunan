import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PaperBackground } from "@/components/ui/PaperBackground";
import { palette } from "@/constants/theme";
import { useSunnah } from "@/context/SunnahContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Image,
	Platform,
	ScrollView,
	Text,
	TouchableOpacity,
	Vibration,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlreadyDoingModal } from "./components/AlreadyDoingModal";
import { MilestoneBanner } from "./components/MilestoneBanner";
import { SkipModal } from "./components/SkipModal";
import { StreakCompleteModal } from "./components/StreakCompleteModal";
import { StreakDots } from "./components/StreakDots";

const HADITH_CHAR_LIMIT = 120;

function getTruncatedHadith(text: string, limit: number): string {
	if (text.length <= limit) return text;
	const sliced = text.slice(0, limit);
	const lastSpace = sliced.lastIndexOf(" ");
	return (lastSpace > 20 ? sliced.slice(0, lastSpace) : sliced) + "...";
}

export default function ActiveSunnahScreen() {
	const insets = useSafeAreaInsets();
	const {
		currentSunnah,
		streakCount,
		hasMarkedToday,
		streakBrokenToday,
		markDoneToday,
		markAlreadyDoing,
		skipSunnah,
		isLoading,
	} = useSunnah();

	const [showAlreadyConfirm, setShowAlreadyConfirm] = useState(false);
	const [showSkipConfirm, setShowSkipConfirm] = useState(false);
	const [showCelebration, setShowCelebration] = useState(false);
	const [celebrationTitle, setCelebrationTitle] = useState("");
	const [hadithExpanded, setHadithExpanded] = useState(false);

	// Reset hadith expand state when sunnah changes
	useEffect(() => {
		setHadithExpanded(false);
	}, [currentSunnah?.id]);

	const handleMarkDone = () => {
		if (hasMarkedToday) return;
		const completingStreak = streakCount === 6;
		const completedTitle = currentSunnah?.title;

		try {
			if (Platform.OS === "ios") {
				void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			} else {
				void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
				Vibration.vibrate(80);
			}
		} catch {
			Vibration.vibrate(80);
		}

		markDoneToday();
		if (completingStreak && completedTitle) {
			setCelebrationTitle(completedTitle);
			setShowCelebration(true);
		}
	};

	if (isLoading) {
		return (
			<PaperBackground>
				<View className="flex-1 justify-center items-center">
					<ActivityIndicator size="large" color={palette.warmGold} />
				</View>
			</PaperBackground>
		);
	}

	if (!currentSunnah) {
		return (
			<PaperBackground>
				<View
					className="flex-1 justify-center items-center p-6"
					style={{ paddingTop: insets.top }}
				>
					<Image
						source={require("@/assets/images/app-icon.png")}
						className="w-24 h-24 rounded-2xl mb-6 opacity-80"
						resizeMode="contain"
					/>
					<Text className="font-tajawal-bold text-warmBrown text-2xl text-center mb-2">
						أتممت جميع السنن!
					</Text>
					<Text className="font-tajawal text-warmBrownLight text-lg text-center leading-8">
						جزاك الله خيراً، انتظر إضافة سنن جديدة
					</Text>
				</View>

				<StreakCompleteModal
					visible={showCelebration}
					sunnahTitle={celebrationTitle}
					onClose={() => setShowCelebration(false)}
				/>
			</PaperBackground>
		);
	}

	const categoryLabels: Record<string, string> = {
		prayer: "صلاة",
		eating: "طعام",
		sleeping: "نوم",
		dhikr: "ذكر",
		social: "معاملات",
		hygiene: "نظافة",
		general: "عام",
	};

	const isLongHadith = (currentSunnah.hadith?.length ?? 0) > HADITH_CHAR_LIMIT;

	return (
		<PaperBackground>
			{/* Broken streak banner */}
			{streakBrokenToday && (
				<View
					className="mx-5 mt-2 px-4 py-3 rounded-xl bg-red-100 border border-red-300"
					style={{ marginTop: insets.top + 8 }}
				>
					<Text className="font-tajawal-bold text-red-700 text-center text-base">
						انقطعت سلسلتك بسبب يوم فائت. ابدأ من جديد!
					</Text>
				</View>
			)}

			<ScrollView
				className="flex-1"
				contentContainerClassName="p-5 pb-[100px]"
				contentContainerStyle={{
					paddingTop: streakBrokenToday ? 12 : insets.top + 12,
				}}
			>
				{/* Title */}
				<Text className="font-tajawal-bold text-[26px] text-warmBrown text-center mb-2">
					سنة اليوم
				</Text>

				{/* Category badge */}
				<View className="flex-row justify-center items-center mb-5">
					<View className="px-3 py-1 rounded-full bg-warmGold/10 border border-warmGold/20">
						<Text className="font-tajawal text-warmGold text-sm">
							{categoryLabels[currentSunnah.category] ?? currentSunnah.category}
						</Text>
					</View>
				</View>

				{/* Milestone banner */}
				<MilestoneBanner count={streakCount} />

				{/* Streak dots */}
				<StreakDots count={streakCount} />

				{/* Sunnah Card */}
				<Card variant="home" className="mb-4">
					<Text className="font-amiri-bold text-[28px] text-warmBrown text-center mb-4 leading-[44px]">
						{currentSunnah.title}
					</Text>

					{/* Explanation (Action) */}
					{currentSunnah.action && (
						<Text className="font-tajawal-bold text-lg text-warmBrownLight text-center leading-8 mb-5">
							{currentSunnah.action}
						</Text>
					)}

					<View className="flex-row items-center justify-center mb-4">
						<View className="flex-1 h-[0.5px] bg-warmGold/30" />
						<View className="mx-3">
							<Ionicons name="moon-outline" size={16} color={palette.warmGold} />
						</View>
						<View className="flex-1 h-[0.5px] bg-warmGold/30" />
					</View>

					{/* Hadith */}
					<Text
						className="font-amiri text-lg text-warmBrownLight/80 text-center leading-[32px]"
						onPress={() => {
							if (isLongHadith) setHadithExpanded((prev) => !prev);
						}}
					>
						{isLongHadith && !hadithExpanded
							? getTruncatedHadith(currentSunnah.hadith, HADITH_CHAR_LIMIT)
							: currentSunnah.hadith}
					</Text>

					{isLongHadith && (
						<TouchableOpacity
							onPress={() => setHadithExpanded((prev) => !prev)}
							accessibilityRole="button"
							accessibilityLabel={hadithExpanded ? "عرض أقل للحديث" : "اقرأ المزيد من الحديث"}
							activeOpacity={0.7}
							className="mt-2 py-1 self-center flex-row items-center justify-center gap-1.5"
						>
							<Text className="font-tajawal-bold text-sm text-warmGold">
								{hadithExpanded ? "عرض أقل" : "اقرأ المزيد..."}
							</Text>
							<Ionicons
								name={hadithExpanded ? "chevron-up" : "chevron-down"}
								size={14}
								color={palette.warmGold}
							/>
						</TouchableOpacity>
					)}

					{/* Reward */}
					{currentSunnah.reward && (
						<View className="mt-6 bg-warmGold/10 px-4 py-3 rounded-xl border border-warmGold/20">
							<View className="flex-row items-center justify-center mb-2 gap-1">
								<Ionicons name="gift-outline" size={18} color={palette.warmGold} />
								<Text className="font-tajawal-bold text-warmGold text-sm">
									الثواب والأجر
								</Text>
							</View>
							<Text className="font-tajawal-bold text-base text-warmBrown text-center leading-7">
								{currentSunnah.reward}
							</Text>
							{currentSunnah.rewardSource && (
								<Text className="font-tajawal text-xs text-warmBrownLight text-center mt-2 opacity-80 leading-5">
									{currentSunnah.rewardSource}
								</Text>
							)}
						</View>
					)}
				</Card>

				{/* Primary Action */}
				<View className="mt-2">
					<Button
						title={hasMarkedToday ? "تم إنجازها اليوم" : "فعلتها اليوم"}
						onPress={handleMarkDone}
						color={palette.oliveGreen}
						colorEnd={palette.oliveGreenDark}
						textColor={palette.white}
						disabled={hasMarkedToday}
					/>
				</View>

				{/* Secondary Actions */}
				<View className="flex-row justify-center items-center gap-6 mt-2 mb-2">
					<TouchableOpacity
						onPress={() => setShowAlreadyConfirm(true)}
						accessibilityRole="button"
						accessibilityLabel="أفعلها بالفعل"
						accessibilityHint="تحديد أنك ملتزم بهذه السنة مسبقاً والانتقال للسنة التالية"
						className="py-2"
					>
						<Text className="font-tajawal text-warmBrownLight text-sm underline">
							أفعلها بالفعل
						</Text>
					</TouchableOpacity>

					<View className="w-[1px] h-4 bg-warmBrownLight/30" />

					<TouchableOpacity
						onPress={() => setShowSkipConfirm(true)}
						accessibilityRole="button"
						accessibilityLabel="تخطي هذه السنة"
						accessibilityHint="تخطي هذه السنة مؤقتاً والانتقال للسنة التالية"
						className="py-2"
					>
						<Text className="font-tajawal text-warmBrownLight text-sm underline">
							تخطي
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>

			{/* Already Doing Confirm Modal */}
			<AlreadyDoingModal
				visible={showAlreadyConfirm}
				sunnahTitle={currentSunnah.title}
				onConfirm={() => {
					setShowAlreadyConfirm(false);
					markAlreadyDoing();
				}}
				onClose={() => setShowAlreadyConfirm(false)}
			/>

			{/* Skip Confirm Modal */}
			<SkipModal
				visible={showSkipConfirm}
				onConfirm={() => {
					setShowSkipConfirm(false);
					skipSunnah();
				}}
				onClose={() => setShowSkipConfirm(false)}
			/>

			<StreakCompleteModal
				visible={showCelebration}
				sunnahTitle={celebrationTitle}
				onClose={() => setShowCelebration(false)}
			/>
		</PaperBackground>
	);
}

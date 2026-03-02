import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../../components/common/Button';
import type { OnboardingScreenProps } from '../../types/navigation';

const { width } = Dimensions.get('window');

interface SlideData {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const SLIDES: SlideData[] = [
  {
    icon: 'card-outline',
    title: 'Link Your Cards',
    description: 'Connect your credit and debit cards to start tracking rewards across all your accounts.',
  },
  {
    icon: 'analytics-outline',
    title: 'AI Recommendations',
    description: 'Our AI analyzes your spending and recommends the best card for every purchase category.',
  },
  {
    icon: 'rocket-outline',
    title: 'Maximize Returns',
    description: 'Earn more cashback, points, and rewards without changing how you spend.',
  },
];

export function OnboardingWelcomeScreen({ navigation }: OnboardingScreenProps<'OnboardingWelcome'>) {
  const { theme } = useTheme();
  const { colors } = theme;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate('ConnectBank');
    }
  };

  const renderSlide = ({ item }: { item: SlideData }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight + '15' }]}>
        <Ionicons name={item.icon} size={64} color={colors.primary} />
      </View>
      <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>{item.title}</Text>
      <Text style={[styles.slideDesc, { color: colors.textSecondary }]}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      <View style={styles.pagination}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === currentIndex ? colors.primary : colors.border,
                width: i === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          title={currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          fullWidth
          size="lg"
        />
        {currentIndex < SLIDES.length - 1 && (
          <Button
            title="Skip"
            onPress={() => navigation.navigate('ConnectBank')}
            variant="ghost"
            fullWidth
            style={{ marginTop: 8 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDesc: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  actions: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});

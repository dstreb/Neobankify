import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CardsStackParamList } from '../types/navigation';
import { CardsScreen } from '../screens/cards/CardsScreen';
import { CardDetailScreen } from '../screens/cards/CardDetailScreen';
import { AddCardScreen } from '../screens/cards/AddCardScreen';

const Stack = createNativeStackNavigator<CardsStackParamList>();

export function CardsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CardsList" component={CardsScreen} />
      <Stack.Screen name="CardDetail" component={CardDetailScreen} />
      <Stack.Screen name="AddCard" component={AddCardScreen} />
    </Stack.Navigator>
  );
}

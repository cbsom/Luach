import { AppRegistry } from 'react-native';
import { StackNavigator } from 'react-navigation';
import HomeScreen from './GUI/Screens/HomeScreen';
import SettingsScreen from './GUI/Screens/SettingsScreen';
import NewOccasionScreen from './GUI/Screens/NewOccasionScreen';
import OccasionsScreen from './GUI/Screens/OccasionsScreen';
import KavuahScreen from './GUI/Screens/KavuahScreen';
import EntryScreen from './GUI/Screens/EntryScreen';
import FlaggedDatesScreen from './GUI/Screens/FlaggedDatesScreen';
import NewEntryScreen from './GUI/Screens/NewEntryScreen';
import NewKavuahScreen from './GUI/Screens/NewKavuahScreen';
import DateDetailsScreen from './GUI/Screens/DateDetailsScreen';
import FindKavuahScreen from './GUI/Screens/FindKavuahScreen';
import FindLocationScreen from './GUI/Screens/FindLocationScreen';
import MontheViewScreen from './GUI/Screens/MonthViewScreen';
import BrowserScreen from './GUI/Screens/BrowserScreen';

//If not in __DEV__  turn off the built-in logger
const navOptions = __DEV__ ? undefined : { onNavigationStateChange: null };

AppRegistry.registerComponent('LuachAndroid', () => StackNavigator({
    Home: { screen: HomeScreen },
    Settings: { screen: SettingsScreen },
    NewOccasion: { screen: NewOccasionScreen },
    Occasions: { screen: OccasionsScreen },
    Kavuahs: { screen: KavuahScreen },
    Entries: { screen: EntryScreen },
    NewEntry: { screen: NewEntryScreen },
    NewKavuah: { screen: NewKavuahScreen },
    FlaggedDates: { screen: FlaggedDatesScreen },
    DateDetails: { screen: DateDetailsScreen },
    FindKavuahs: { screen: FindKavuahScreen },
    FindLocation: { screen: FindLocationScreen },
    MonthView: { screen: MontheViewScreen },
    Browser: { screen: BrowserScreen }
}, navOptions));

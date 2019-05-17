import React, { Component } from 'react';
import {
    ScrollView,
    TouchableHighlight,
    View,
    Text,
    TextInput,
    Switch,
    StyleSheet,
} from 'react-native';
import { Icon } from 'react-native-elements';
import SideMenu from '../Components/SideMenu';
import Location from '../../Code/JCal/Location';
import Utils from '../../Code/JCal/Utils';
import { NightDay } from '../../Code/Chashavshavon/Onah';
import { setDefault, range, isNullishOrFalse } from '../../Code/GeneralUtils';
import TimeInput from '../Components/TimeInput';
import ModalSelector from 'react-native-modal-selector';
import {
    removeAllDayOnahReminders,
    removeAllNightOnahReminders,
    cancelMikvaAlarm,
    cancelAllAfternoonBedikaAlarms,
    cancelAllMorningBedikaAlarms,
    resetDayOnahReminders,
    resetNightOnahReminders,
} from '../../Code/Notifications';
import { GeneralStyles } from '../styles';

export default class SettingsScreen extends Component {
    static navigationOptions = ({ navigation }) => {
        const { appData, onUpdate } = navigation.state.params;
        return {
            title: 'Settings',
            headerRight: (
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-around',
                    }}>
                    <TouchableHighlight
                        onPress={() =>
                            navigation.navigate('ExportData', {
                                appData,
                                dataSet: 'Settings',
                            })
                        }>
                        <View style={{ marginRight: 10 }}>
                            <Icon name="import-export" color="#aca" size={25} />
                            <Text style={{ fontSize: 10, color: '#797' }}>
                                Export Data
                            </Text>
                        </View>
                    </TouchableHighlight>
                    <TouchableHighlight
                        onPress={() =>
                            navigation.navigate('Browser', {
                                appData,
                                onUpdate,
                                url: 'index.html',
                                title: 'Help',
                            })
                        }>
                        <View style={{ marginRight: 3 }}>
                            <Icon name="help" color="#aac" size={25} />
                            <Text style={{ fontSize: 10, color: '#aac' }}>
                                Luach Help
                            </Text>
                        </View>
                    </TouchableHighlight>
                </View>
            ),
        };
    };
    constructor(props) {
        super(props);
        this.navigate = this.props.navigation.navigate;
        const { appData, onUpdate } = this.props.navigation.state.params;
        this.appData = appData;
        this.update = ad => {
            ad = ad || this.appData;
            this.setState({ settings: ad.Settings });
            if (onUpdate) {
                onUpdate(ad);
            }
        };
        this.state = {
            settings: appData.Settings,
            //The enteredPin is instead of settings.PIN in case the entered PIN is invalid.
            //We still want to display it, but not to change the setting.
            enteredPin: appData.Settings.PIN,
        };
        this.changeSetting = this.changeSetting.bind(this);
        this.changePIN = this.changePIN.bind(this);
    }
    changeSetting(name, value) {
        const settings = this.state.settings;
        settings[name] = value;
        settings.save();
        this.appData.Settings = settings;

        switch (name) {
            case 'remindBedkMornTime':
                if (!value) {
                    cancelAllMorningBedikaAlarms(
                        this.appData.TaharaEvents[
                            this.appData.TaharaEvents.length - 1
                        ]
                    );
                }
                break;
            case 'remindBedkAftrnHour':
                if (!value) {
                    cancelAllAfternoonBedikaAlarms(
                        this.appData.TaharaEvents[
                            this.appData.TaharaEvents.length - 1
                        ]
                    );
                }
                break;
            case 'remindMikvahTime':
                if (!value) {
                    cancelMikvaAlarm();
                }
                break;
            case 'remindDayOnahHour':
                if (value) {
                    const now = Utils.nowAtLocation(settings.location);

                    resetDayOnahReminders(
                        this.appData.ProblemOnahs.filter(
                            po =>
                                po.NightDay === NightDay.Day &&
                                po.jdate.Abs >= now.Abs
                        ),
                        value,
                        settings.location,
                        settings.discreet
                    );
                } else {
                    removeAllDayOnahReminders();
                }
                break;
            case 'remindNightOnahHour':
                if (value) {
                    const now = Utils.nowAtLocation(settings.location);

                    resetNightOnahReminders(
                        this.appData.ProblemOnahs.filter(
                            po =>
                                po.NightDay === NightDay.Night &&
                                po.jdate.Abs >= now.Abs
                        ),
                        value,
                        settings.location,
                        settings.discreet
                    );
                } else {
                    removeAllNightOnahReminders();
                }
                break;
        }

        this.update(this.appData);
    }
    editLocation() {
        this.navigate('NewLocation', {
            appData: this.appData,
            location: this.appData.Settings.location,
            onUpdate: this.update,
        });
    }
    changePIN(pin) {
        const validPin = /^\d{4}$/.test(pin);
        if (validPin) {
            this.changeSetting('PIN', pin);
        }
        this.setState({ invalidPin: !validPin, enteredPin: pin });
    }
    getPickerInit(val, unit) {
        return Math.abs(val) + ' ' + unit + (Math.abs(val) > 1 ? 's' : '');
    }
    getPickerOptions(num, unit) {
        return range(num).map(n => ({
            label: n.toString() + ' ' + unit + (n > 1 ? 's' : ''),
            key: n,
        }));
    }
    render() {
        const settings = this.state.settings,
            location = settings.location || Location.getLakewood(),
            showOhrZeruah = setDefault(settings.showOhrZeruah, true),
            keepThirtyOne = setDefault(settings.keepThirtyOne, true),
            onahBeinunis24Hours = settings.onahBeinunis24Hours,
            numberMonthsAheadToWarn = settings.numberMonthsAheadToWarn || 12,
            keepLongerHaflagah = setDefault(settings.keepLongerHaflagah, true),
            dilugChodeshPastEnds = setDefault(
                settings.dilugChodeshPastEnds,
                true
            ),
            haflagaOfOnahs = settings.haflagaOfOnahs,
            kavuahDiffOnahs = settings.kavuahDiffOnahs,
            calcKavuahsOnNewEntry = setDefault(
                settings.calcKavuahsOnNewEntry,
                true
            ),
            showProbFlagOnHome = setDefault(settings.showProbFlagOnHome, true),
            showEntryFlagOnHome = setDefault(
                settings.showEntryFlagOnHome,
                true
            ),
            navigateBySecularDate = settings.navigateBySecularDate,
            showIgnoredKavuahs = settings.showIgnoredKavuahs,
            noProbsAfterEntry = setDefault(settings.noProbsAfterEntry, true),
            hideHelp = settings.hideHelp,
            discreet = setDefault(settings.discreet, true),
            remindBedkMornTime = settings.remindBedkMornTime,
            remindBedkAftrnHour = settings.remindBedkAftrnHour,
            remindMikvahTime = settings.remindMikvahTime,
            remindDayOnahHour = settings.remindDayOnahHour,
            remindNightOnahHour = settings.remindNightOnahHour,
            requirePIN = setDefault(settings.requirePIN, true);

        return (
            <View style={GeneralStyles.container}>
                <View style={{ flexDirection: 'row', flex: 1 }}>
                    <SideMenu
                        onUpdate={this.update}
                        appData={this.appData}
                        navigator={this.props.navigation}
                        hideSettings={true}
                        helpUrl="Settings.html"
                        helpTitle="Settings"
                    />
                    <ScrollView style={{ flex: 1 }}>
                        <View style={GeneralStyles.headerView}>
                            <Text style={GeneralStyles.headerText}>
                                Halachic Settings
                            </Text>
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Choose your location
                            </Text>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}>
                                <TouchableHighlight
                                    underlayColor="#9f9"
                                    onPress={() =>
                                        this.navigate('FindLocation', {
                                            onUpdate: this.update,
                                            appData: this.appData,
                                        })
                                    }
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#dfd',
                                    }}>
                                    <View style={GeneralStyles.centeredRow}>
                                        <Icon
                                            name="edit-location"
                                            color="#484"
                                            size={35}
                                        />
                                        <Text>{location.Name}</Text>
                                    </View>
                                </TouchableHighlight>
                                <Icon
                                    name="edit"
                                    color="#888"
                                    size={15}
                                    containerStyle={{
                                        paddingRight: 12,
                                        paddingLeft: 12,
                                    }}
                                    onPress={() => this.editLocation(location)}
                                />
                            </View>
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Flag previous onah (The "Ohr Zaruah")
                            </Text>
                            <Switch
                                style={GeneralStyles.switch}
                                onValueChange={value =>
                                    this.changeSetting('showOhrZeruah', value)
                                }
                                value={!!showOhrZeruah}
                            />
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Keep Onah Beinonis (30, 31 and Yom HaChodesh)
                                for a full 24 Hours
                            </Text>
                            <Switch
                                style={GeneralStyles.switch}
                                onValueChange={value =>
                                    this.changeSetting(
                                        'onahBeinunis24Hours',
                                        value
                                    )
                                }
                                value={!!onahBeinunis24Hours}
                            />
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Keep day Thirty One for Onah Beinonis
                            </Text>
                            <Switch
                                style={GeneralStyles.switch}
                                onValueChange={value =>
                                    this.changeSetting('keepThirtyOne', value)
                                }
                                value={!!keepThirtyOne}
                            />
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Haflaga is only cancelled by a longer one
                            </Text>
                            <Switch
                                style={GeneralStyles.switch}
                                onValueChange={value =>
                                    this.changeSetting(
                                        'keepLongerHaflagah',
                                        value
                                    )
                                }
                                value={!!keepLongerHaflagah}
                            />
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Continue incrementing Dilug Yom Hachodesh
                                Kavuahs into another month
                            </Text>
                            <Switch
                                style={GeneralStyles.switch}
                                onValueChange={value =>
                                    this.changeSetting(
                                        'dilugChodeshPastEnds',
                                        value
                                    )
                                }
                                value={!!dilugChodeshPastEnds}
                            />
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Calculate Haflagas by counting Onahs
                            </Text>
                            <Switch
                                style={GeneralStyles.switch}
                                onValueChange={value =>
                                    this.changeSetting('haflagaOfOnahs', value)
                                }
                                value={!!haflagaOfOnahs}
                            />
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Flag Kavuahs even if not all the same Onah
                            </Text>
                            <Switch
                                style={GeneralStyles.switch}
                                onValueChange={value =>
                                    this.changeSetting('kavuahDiffOnahs', value)
                                }
                                value={!!kavuahDiffOnahs}
                            />
                        </View>
                        <View style={GeneralStyles.headerView}>
                            <Text style={GeneralStyles.headerText}>
                                Application Settings
                            </Text>
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Number of Months ahead to warn
                            </Text>
                            <View>
                                <ModalSelector
                                    initValue={this.getPickerInit(
                                        numberMonthsAheadToWarn,
                                        'month'
                                    )}
                                    onChange={o =>
                                        this.changeSetting(
                                            'numberMonthsAheadToWarn',
                                            o.key
                                        )
                                    }
                                    data={this.getPickerOptions(24, 'month')}
                                />
                            </View>
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Automatically Calculate Kavuahs upon addition of
                                an Entry
                            </Text>
                            <Switch
                                style={GeneralStyles.switch}
                                onValueChange={value =>
                                    this.changeSetting(
                                        'calcKavuahsOnNewEntry',
                                        value
                                    )
                                }
                                value={!!calcKavuahsOnNewEntry}
                            />
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Show Entry, Hefsek Tahara and Mikva information?
                            </Text>
                            <Switch
                                style={GeneralStyles.switch}
                                onValueChange={value =>
                                    this.changeSetting(
                                        'showEntryFlagOnHome',
                                        value
                                    )
                                }
                                value={!!showEntryFlagOnHome}
                            />
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Discreetly worded system reminders?
                            </Text>
                            <Switch
                                style={GeneralStyles.switch}
                                onValueChange={value =>
                                    this.changeSetting('discreet', value)
                                }
                                value={!!discreet}
                            />
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Show flags for problem dates on Main Screen?
                            </Text>
                            <Switch
                                style={GeneralStyles.switch}
                                onValueChange={value =>
                                    this.changeSetting(
                                        'showProbFlagOnHome',
                                        value
                                    )
                                }
                                value={!!showProbFlagOnHome}
                            />
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Remind me about the morning Bedikah during Shiva
                                Neki'im'?
                            </Text>
                            <View style={localStyles.switchView}>
                                <Text>Don't add reminder</Text>
                                <Switch
                                    style={GeneralStyles.switch}
                                    onValueChange={value =>
                                        this.changeSetting(
                                            'remindBedkMornTime',
                                            value && { hour: 7, minute: 0 }
                                        )
                                    }
                                    value={!!remindBedkMornTime}
                                />
                                <Text>Add reminder</Text>
                            </View>
                            {remindBedkMornTime && (
                                <View style={localStyles.innerView}>
                                    <Text>Show reminder at </Text>
                                    <TimeInput
                                        selectedTime={remindBedkMornTime}
                                        onConfirm={remindBedkMornTime =>
                                            this.changeSetting(
                                                'remindBedkMornTime',
                                                remindBedkMornTime
                                            )
                                        }
                                    />
                                    <Text> each day</Text>
                                </View>
                            )}
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Remind me about the afternoon Bedikah during
                                Shiva Neki'im'?
                            </Text>
                            <View style={localStyles.switchView}>
                                <Text>Don't add reminder</Text>
                                <Switch
                                    style={GeneralStyles.switch}
                                    onValueChange={value =>
                                        this.changeSetting(
                                            'remindBedkAftrnHour',
                                            value && -1
                                        )
                                    }
                                    value={
                                        !isNullishOrFalse(remindBedkAftrnHour)
                                    }
                                />
                                <Text>Add reminder</Text>
                            </View>
                            {!isNullishOrFalse(remindBedkAftrnHour) && (
                                <View style={localStyles.innerView}>
                                    <Text>Show reminder </Text>
                                    <ModalSelector
                                        initValue={this.getPickerInit(
                                            remindBedkAftrnHour,
                                            'hour'
                                        )}
                                        onChange={value => {
                                            this.changeSetting(
                                                'remindBedkAftrnHour',
                                                -value.key
                                            );
                                        }}
                                        data={this.getPickerOptions(12, 'hour')}
                                    />
                                    <Text>{' before sunset'}</Text>
                                </View>
                            )}
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Remind me about the Mikvah on the last day of
                                Shiva Neki'im'?
                            </Text>
                            <View style={localStyles.switchView}>
                                <Text>Don't add reminder</Text>
                                <Switch
                                    style={GeneralStyles.switch}
                                    onValueChange={value =>
                                        this.changeSetting(
                                            'remindMikvahTime',
                                            value && { hour: 18, minute: 0 }
                                        )
                                    }
                                    value={!!remindMikvahTime}
                                />
                                <Text>Add reminder</Text>
                            </View>
                            {remindMikvahTime && (
                                <View style={localStyles.innerView}>
                                    <Text>Show reminder at </Text>
                                    <TimeInput
                                        selectedTime={remindMikvahTime}
                                        onConfirm={remindMikvahTime =>
                                            this.changeSetting(
                                                'remindMikvahTime',
                                                remindMikvahTime
                                            )
                                        }
                                    />
                                </View>
                            )}
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Remind me about Daytime flagged dates?
                            </Text>
                            <View style={localStyles.switchView}>
                                <Text>Don't add reminder</Text>
                                <Switch
                                    style={GeneralStyles.switch}
                                    onValueChange={value =>
                                        this.changeSetting(
                                            'remindDayOnahHour',
                                            value && -8
                                        )
                                    }
                                    value={!isNullishOrFalse(remindDayOnahHour)}
                                />
                                <Text>Add reminder</Text>
                            </View>
                            {!isNullishOrFalse(remindDayOnahHour) && (
                                <View style={localStyles.innerView}>
                                    <Text>Show the reminder </Text>
                                    <ModalSelector
                                        initValue={this.getPickerInit(
                                            remindDayOnahHour,
                                            'hour'
                                        )}
                                        onChange={value => {
                                            this.changeSetting(
                                                'remindDayOnahHour',
                                                -value.key
                                            );
                                        }}
                                        data={this.getPickerOptions(24, 'hour')}
                                    />
                                    <Text>{' before sunrise'}</Text>
                                </View>
                            )}
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Remind me about Nighttime flagged dates?
                            </Text>
                            <View style={localStyles.switchView}>
                                <Text>Don't add reminder</Text>
                                <Switch
                                    style={GeneralStyles.switch}
                                    onValueChange={value =>
                                        this.changeSetting(
                                            'remindNightOnahHour',
                                            value && -1
                                        )
                                    }
                                    value={
                                        !isNullishOrFalse(remindNightOnahHour)
                                    }
                                />
                                <Text>Add reminder</Text>
                            </View>
                            {!isNullishOrFalse(remindNightOnahHour) && (
                                <View style={localStyles.innerView}>
                                    <Text>Show the reminder </Text>
                                    <ModalSelector
                                        initValue={this.getPickerInit(
                                            remindNightOnahHour,
                                            'hour'
                                        )}
                                        onChange={value => {
                                            this.changeSetting(
                                                'remindNightOnahHour',
                                                -value.key
                                            );
                                        }}
                                        data={this.getPickerOptions(24, 'hour')}
                                    />
                                    <Text>{' before sunset'}</Text>
                                </View>
                            )}
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Calendar displays current:
                            </Text>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingLeft: 15,
                                }}>
                                <Text>Jewish Date</Text>
                                <Switch
                                    style={GeneralStyles.switch}
                                    onValueChange={value =>
                                        this.changeSetting(
                                            'navigateBySecularDate',
                                            value
                                        )
                                    }
                                    value={!!navigateBySecularDate}
                                />
                                <Text>Secular Date</Text>
                            </View>
                            {navigateBySecularDate && (
                                <Text
                                    style={{
                                        fontSize: 11,
                                        color: '#b55',
                                        paddingLeft: 10,
                                        paddingBottom: 5,
                                    }}>
                                    Please Note: If the current time is between
                                    sunset and midnight, the current Jewish date
                                    will be incorrect.
                                </Text>
                            )}
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Show explicitly ignored Kavuahs in the Kavuah
                                list
                            </Text>
                            <Switch
                                style={GeneralStyles.switch}
                                onValueChange={value =>
                                    this.changeSetting(
                                        'showIgnoredKavuahs',
                                        value
                                    )
                                }
                                value={!!showIgnoredKavuahs}
                            />
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Don't show Flagged dates for a week after Entry
                            </Text>
                            <Switch
                                style={GeneralStyles.switch}
                                onValueChange={value =>
                                    this.changeSetting(
                                        'noProbsAfterEntry',
                                        value
                                    )
                                }
                                value={!!noProbsAfterEntry}
                            />
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Hide Help Button
                            </Text>
                            <Switch
                                style={GeneralStyles.switch}
                                onValueChange={value =>
                                    this.changeSetting('hideHelp', value)
                                }
                                value={!!hideHelp}
                            />
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                Require PIN to open application?
                            </Text>
                            <Switch
                                style={GeneralStyles.switch}
                                onValueChange={value =>
                                    this.changeSetting('requirePIN', value)
                                }
                                value={!!requirePIN}
                            />
                        </View>
                        <View style={GeneralStyles.formRow}>
                            <Text style={GeneralStyles.label}>
                                4 digit PIN Number
                            </Text>
                            <View
                                style={{
                                    display: this.state.invalidPin
                                        ? 'flex'
                                        : 'none',
                                    marginTop: 5,
                                    marginLeft: 10,
                                }}>
                                <Text
                                    style={{
                                        color: '#f55',
                                        fontSize: 12,
                                        fontWeight: 'bold',
                                    }}>
                                    PIN must have 4 digits
                                </Text>
                            </View>
                            <TextInput
                                style={GeneralStyles.textInput}
                                keyboardType="numeric"
                                returnKeyType="next"
                                maxLength={4}
                                onChangeText={value => {
                                    this.changePIN(value);
                                }}
                                value={this.state.enteredPin}
                            />
                        </View>
                    </ScrollView>
                </View>
            </View>
        );
    }
}
const localStyles = StyleSheet.create({
    innerView: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#eef',
    },
    switchView: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 15,
    },
});

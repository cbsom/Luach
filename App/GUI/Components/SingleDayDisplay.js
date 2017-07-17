import React, { Component } from 'react';
import { Button, StyleSheet, Text, View, TouchableWithoutFeedback, TouchableOpacity, TouchableHighlight, Modal } from 'react-native';
import { Icon } from 'react-native-elements';
import Utils from '../../Code/JCal/Utils';
import Zmanim from '../../Code/JCal/Zmanim';
import { log, popUpMessage } from '../../Code/GeneralUtils';
import { UserOccasion } from '../../Code/JCal/UserOccasion';
/**
 * Display a home screen box for a single jewish date.
 *
 * PROPS ------------------------------
 *   jdate
 *   sdate - only supplied if there is a chance that the jdate is after sunset
 *   isToday
 *   appData
 *   navigator
 *   onUpdate
 *   lastEntryDate
 *   isHefeskDay
 */
export default class SingleDayDisplay extends Component {
    constructor(props) {
        super(props);
        this.navigator = props.navigator;
        this.state = { showMenu: false };
        this.newEntry = this.newEntry.bind(this);
        this.newOccasion = this.newOccasion.bind(this);
        this.showDateDetails = this.showDateDetails.bind(this);
        this.showProblems = this.showProblems.bind(this);
        this.monthView = this.monthView.bind(this);
        this.changeLocation = this.changeLocation.bind(this);
        this._openMenu = this._openMenu.bind(this);
        this._closeMenu = this._closeMenu.bind(this);
    }
    componentWillUpdate(nextProps) {
        const prevAppData = this.props.appData,
            newAppData = nextProps.appData;
        if (!(prevAppData || newAppData)) {
            log('Refreshed Single Day:( - either new appdata or old appdata was nuthin`');
            return true;
        }
        if (!prevAppData.Settings.isSameSettings(newAppData.Settings)) {
            log('Refreshed Single Day:( - Settings were not the same');
            return true;
        }
        if (prevAppData.UserOccasions.length !== newAppData.UserOccasions.length) {
            log('Refreshed Single Day:( - User Occasions list were not the same length');
            return true;
        }
        if (!prevAppData.UserOccasions.every(uo =>
            newAppData.UserOccasions.some(uon => uon.isSameOccasion(uo)))) {
            log('Refreshed Single Day:( - Occasions were not all the same');
            return true;
        }
        if (prevAppData.EntryList.list.length !== newAppData.EntryList.list.length) {
            log('Refreshed Single Day:( - Entries list were not the same length');
            return true;
        }
        if (!prevAppData.EntryList.list.every(e =>
            newAppData.EntryList.list.some(en => en.isSameEntry(e)))) {
            log('Refreshed Single Day:( - Entries were not all the same');
            return true;
        }
        if (prevAppData.ProblemOnahs.length !== newAppData.ProblemOnahs.length) {
            log('Refreshed Single Day:( - Probs list were not the same length');
            return true;
        }
        if (!prevAppData.ProblemOnahs.every(po =>
            newAppData.ProblemOnahs.some(pon => pon.isSameProb(po)))) {
            log('Refreshed Single Day:( - Probs were not all the same');
            return true;
        }
        log('Single Day Refresh Prevented');
        return false;
    }
    newEntry() {
        this._closeMenu();
        this.navigator.navigate('NewEntry', this.props);
    }
    newOccasion() {
        this._closeMenu();
        this.navigator.navigate('NewOccasion', this.props);
    }
    monthView() {
        this._closeMenu();
        this.navigator.navigate('MonthView', this.props);
    }
    showDateDetails() {
        this._closeMenu();
        this.navigator.navigate('DateDetails', this.props);
    }
    showProblems() {
        this._closeMenu();
        this.navigator.navigate('FlaggedDates', this.props);
    }
    changeLocation() {
        this._closeMenu();
        this.navigator.navigate('FindLocation', this.props);
    }
    editEntry(entry) {
        const hasKavuah = this.props.appData.KavuahList.some(k =>
            (!k.ignore) && k.settingEntry.isSameEntry(entry));
        if (hasKavuah) {
            popUpMessage('This Entry has been set as "Setting Entry" for a Kavuah and can not be changed.',
                'Entry cannot be changed');
        }
        else {
            this.navigator.navigate('NewEntry', { entry, ...this.props });
        }
    }
    editOccasion(occasion) {
        this.navigator.navigate('NewOccasion', { occasion, ...this.props });
    }
    _openMenu() {
        const showing = this.state.showMenu;
        this.setState({ showMenu: !showing });
    }
    _closeMenu() {
        this.setState({ showMenu: false });
    }
    render() {
        const { appData, jdate, isToday, systemDate } = this.props,
            location = appData.Settings.location,
            flag = appData.Settings.showProbFlagOnHome &&
                appData.ProblemOnahs.some(po => Utils.isSameJdate(po.jdate, jdate)),
            occasions = appData.UserOccasions.length > 0 ?
                UserOccasion.getOccasionsForDate(jdate, appData.UserOccasions) : [],
            entries = appData.Settings.showEntryFlagOnHome ?
                appData.EntryList.list.filter(e => Utils.isSameJdate(e.date, jdate)) : [],
            sdate = (isToday && systemDate) ? systemDate : jdate.getDate(),
            isDayOff = isToday && systemDate && (systemDate.getDate() !== jdate.getDate().getDate()),
            todayText = isToday && <Text style={styles.todayText}>
                {`TODAY${isDayOff ? '*' : ''}`}</Text>,
            jdateOffText = isDayOff &&
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.dayOffMessage}>
                        {'* NOTE: As it is currently after Sunset,\n' +
                            `  the correct Jewish Day is ${Utils.dowEng[jdate.DayOfWeek]}.`}
                    </Text>
                </View>,
            isSpecialDay = jdate.DayOfWeek === 6 || jdate.getMajorHoliday(location.Israel),
            dailyInfos = jdate.getHolidays(location.Israel),
            dailyInfoText = dailyInfos.length > 0 && <Text>{dailyInfos.join('\n')}</Text>,
            suntimes = Zmanim.getSunTimes(jdate, location, true),
            sunrise = suntimes && suntimes.sunrise ?
                Utils.getTimeString(suntimes.sunrise) : 'Sun does not rise',
            sunset = suntimes && suntimes.sunset ?
                Utils.getTimeString(suntimes.sunset) : 'Sun does not set',
            candleLighting = jdate.hasCandleLighting() &&
                <Text>{'Candle-lighting: ' +
                    Utils.getTimeString(Zmanim.getCandleLightingFromSunTimes(suntimes, location))}</Text>,
            eiruvTavshilin = jdate.hasEiruvTavshilin(location.Israel) &&
                <Text style={{ fontWeight: 'bold' }}>Eiruv Tavshilin</Text>,
            occasionText = occasions && occasions.length > 0 &&
                occasions.map((o, i) =>
                    <TouchableOpacity key={i} onPress={() => this.editOccasion(o)}>
                        <Text style={styles.occasionText} key={i}>{o.title}</Text>
                    </TouchableOpacity>),
            entriesText = entries && entries.length > 0 &&
                entries.map((e, i) => (
                    <TouchableOpacity key={i} onPress={() => this.editEntry(e)}>
                        <Text style={styles.entriesText}>{e.toKnownDateString()}</Text>
                    </TouchableOpacity>));
        let daysSinceLastEntry;
        if (appData.Settings.showEntryFlagOnHome && this.props.lastEntryDate) {
            const dayNum = this.props.lastEntryDate.diffDays(jdate) + 1;
            if (dayNum > 1) {
                daysSinceLastEntry =
                    <View style={styles.additionsViews}>
                        <Text style={{ fontSize: 10 }}>{Utils.toSuffixed(dayNum) +
                            ' day of last Entry'}</Text>
                    </View>;
            }
        }
        return (
            <View
                style={[styles.container, {
                    backgroundColor:
                    (entries && entries.length > 0 ? '#fee' :
                        (flag ? '#fe9' :
                            (this.props.isHefeskDay ? '#f1fff1' :
                                (isToday ? '#e2e2f0' :
                                    (isSpecialDay ? '#eef' : '#fff')))))
                }]}>
                {this.state.showMenu &&
                    <Modal animationType='slide' visible={this.state.showMenu} onRequestClose={this._closeMenu} transparent={true}>
                        <View style={styles.menuView}>
                            <TouchableWithoutFeedback onPress={this.newEntry}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Icon color='#e5c565' name='list' />
                                    <Text style={{ fontSize: 12, color: '#ca4' }}>New Entry</Text>
                                </View>
                            </TouchableWithoutFeedback>
                            <TouchableWithoutFeedback onPress={this.newOccasion}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Icon color='#e5c565' name='event' />
                                    <Text style={{ fontSize: 12, color: '#ca4' }}>New Event</Text>
                                </View>
                            </TouchableWithoutFeedback>
                            <TouchableWithoutFeedback onPress={this.showDateDetails}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Icon color='#e5c565' name='info' />
                                    <Text style={{ fontSize: 12, color: '#ca4' }}>View Zmanim</Text>
                                </View>
                            </TouchableWithoutFeedback>
                            <TouchableWithoutFeedback onPress={this.monthView}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Icon color='#e5c565' name='calendar' type='octicon' />
                                    <Text style={{ fontSize: 12, color: '#ca4' }}>Month View</Text>
                                </View>
                            </TouchableWithoutFeedback>
                            <Button title='Close' onPress={this._closeMenu}>Close</Button>
                        </View>
                    </Modal>
                }
                <TouchableWithoutFeedback onPress={this._openMenu}>
                    <View>
                        <View style={{ margin: 15, flex: 1 }}>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.dateNumEng}>{sdate.getDate().toString()}</Text>
                                {todayText}
                                <Text style={styles.dateNumHeb}>{Utils.toJNum(jdate.Day)}</Text>
                            </View>
                            <Text style={styles.date}>
                                <Text style={styles.dateHeb}>
                                    {jdate.toString()}</Text>
                                <Text>{'\n'}</Text>
                                <Text style={styles.dateEng}>
                                    {Utils.toStringDate(sdate, !isDayOff)}</Text>
                            </Text>
                            {dailyInfoText}
                            {candleLighting}
                            {eiruvTavshilin}
                            <Text>{'Sedra of the week: ' + jdate.getSedra(true).map((s) => s.eng).join(' - ')}</Text>
                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ width: '65%', height: 75, flex: 0 }}>
                                    <TouchableOpacity onPress={this.changeLocation}>
                                        <Text style={styles.location}>{'In ' + location.Name}</Text>
                                    </TouchableOpacity>
                                    <Text>{'Sunrise: ' + sunrise}</Text>
                                    <Text>{'Sunset: ' + sunset}</Text>
                                </View>
                                <View style={{
                                    flex: 0,
                                    width: '35%',
                                    justifyContent: 'center',
                                    alignItems: 'flex-end'
                                }}>
                                    {flag &&
                                        <TouchableWithoutFeedback style={styles.additionsViews} onPress={this.showProblems}>
                                            <View style={styles.additionsViews}>
                                                <View style={{
                                                    backgroundColor: '#f00',
                                                    alignItems: 'center',
                                                    borderRadius: 40,
                                                    padding: 6
                                                }}>
                                                    <Icon
                                                        size={15}
                                                        name='flag'
                                                        color={'#fff'} />
                                                </View>
                                            </View>
                                        </TouchableWithoutFeedback>
                                    }
                                    {daysSinceLastEntry}
                                </View>
                            </View>
                            {entries && entries.length > 0 &&
                                <View style={styles.additionsViews}>
                                    {entriesText}
                                </View>
                            }
                            {occasions && occasions.length > 0 &&
                                <View style={styles.additionsViews}>
                                    {occasionText}
                                </View>
                            }
                        </View>
                        {jdateOffText}
                    </View>
                </TouchableWithoutFeedback>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexWrap: 'wrap',
        borderWidth: 1,
        borderColor: '#777',
        borderRadius: 6,
        padding: 0,
        marginTop: 5,
        marginLeft: 10,
        marginRight: 10,
        backgroundColor: '#fff'
    },
    date: {
        fontSize: 15,
        fontWeight: 'bold'
    },
    todayText: {
        color: '#800',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1
    },
    dateNumEng: {
        color: '#080',
        textAlign: 'left',
        fontSize: 23,
        fontWeight: 'bold',
        flex: 1
    },
    dateNumHeb: {
        color: '#008',
        textAlign: 'right',
        fontSize: 23,
        fontWeight: 'bold',
        textAlignVertical: 'top',
        flex: 1
    },
    dateEng: { color: '#080' },
    dateHeb: { color: '#008' },
    location: {
        marginTop: 10,
        color: '#800',
        fontWeight: 'bold'
    },
    btn: { fontSize: 7, height: 25 },
    additionsViews: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 5
    },
    entriesText: {
        color: '#e55',
        fontWeight: 'bold',
        padding: 4
    },
    occasionText: {
        color: '#d87',
        fontWeight: 'bold',
        padding: 4
    },
    dayOffMessage: {
        fontSize: 11,
        color: '#955',
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 5
    },
    menuView: {
        position: 'absolute',
        zIndex: 1,
        flex: 0,
        alignSelf: 'center',
        top: '40%',
        padding: 20,
        backgroundColor: '#f1f0f4',
        borderRadius: 3,
        borderColor: '#557',
        borderWidth: 1
    }
});
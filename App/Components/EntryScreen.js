import React, { Component } from 'react';
import { ScrollView, Text, View, Alert, TouchableHighlight, Image } from 'react-native';
import { List, ListItem, Icon } from 'react-native-elements';
import DataUtils from '../Code/Data/DataUtils';
import JDate from '../Code/JCal/jDate';
import { GeneralStyles } from './styles';
import { NightDay } from '../Code/Chashavshavon/Onah';

export default class EntryScreen extends Component {
    static navigationOptions = {
        title: 'List of Entries'
    };
    constructor(props) {
        super(props);

        this.navigate = this.props.navigation.navigate;

        const { appData, currLocation, onUpdate } = this.props.navigation.state.params;

        this.currLocation = currLocation;
        this.onUpdate = onUpdate;
        this.state = {
            appData: appData
        };
        this.newEntry.bind(this);
    }
    newEntry() {
        this.navigate('NewEntry', {
            jdate: new JDate(),
            location: this.currLocation,
            appData: this.state.appData,
            onUpdate: this.onUpdate
        });
    }
    deleteEntry(entry) {
        const appData = this.state.appData;
        let entryList = appData.EntryList,
            kavuahList = appData.KavuahList;
        if (entryList.contains(entry)) {
            const kavuahs = kavuahList.filter(k => k.settingEntry.isSameEntry(entry));
            Alert.alert(
                'Confirm Entry Removal',
                kavuahs.length ?
                    `The following Kavuah/s were set by this Entry and will need to be removed if you remove this Entry:
                        ${kavuahs.map(k => '\n\t* ' + k.toString())}
                        Are you sure that you want to remove this/these Kavuah/s together with the entry?`:
                    'Are you sure that you want to remove this Entry?',
                [   //Button 1
                    {
                        text: 'Cancel',
                        onPress: () => { return; },
                        style: 'cancel'
                    },
                    //Button 2
                    {
                        text: 'OK', onPress: () => {
                            DataUtils.DeleteEntry(entry).catch(error => {
                                if (__DEV__) {
                                    console.warn('Error trying to delete an entry from the database.');
                                    console.error(error);
                                }
                            });
                            for (let k of kavuahs) {
                                let index = kavuahList.indexOf(k);
                                DataUtils.DeleteKavuah(k).catch(error => {
                                    if (__DEV__) {
                                        console.warn('Error trying to delete a Kavuah from the database.');
                                        console.error(error);
                                    }
                                });
                                kavuahList.splice(index, 1);
                            }
                            entryList.remove(entry, e => {
                                entryList.calulateHaflagas();
                                appData.EntryList = entryList;
                                appData.KavuahList = kavuahList;
                                this.setState({
                                    appData: appData
                                });
                                if (this.onUpdate) {
                                    this.onUpdate(appData);
                                }
                                Alert.alert('Remove entry',
                                    `The entry for ${e.toString()} has been successfully removed.`);
                            });
                        }
                    },
                ]);

        }
    }
    newKavuah(entry) {
        this.navigate('NewKavuah', {
            appData: this.state.appData,
            settingEntry: entry,
            onUpdate: this.onUpdate
        });
    }
    findKavuahs() {
        this.navigate('FindKavuahs', {
            appData: this.state.appData,
            onUpdate: this.onUpdate
        });
    }
    render() {
        return (
            <ScrollView style={GeneralStyles.container}>
                <View style={[GeneralStyles.buttonList, GeneralStyles.headerButtons]}>
                    <TouchableHighlight onPress={this.newEntry.bind(this)} style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Icon
                                size={12}
                                reverse
                                name='add'
                                color='#484'
                            />
                            <Text style={{
                                fontSize: 12,
                                color: '#262',
                                fontStyle: 'italic'
                            }}>New Entry</Text>
                        </View>
                    </TouchableHighlight>
                    <TouchableHighlight onPress={this.findKavuahs.bind(this)} style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Icon
                                size={12}
                                reverse
                                name='search'
                                color='#669'
                            />
                            <Text style={{
                                fontSize: 12,
                                color: '#669',
                                fontStyle: 'italic'
                            }}>Calculate Possible Kavuahs</Text>
                        </View>
                    </TouchableHighlight>
                </View>
                {(this.state.appData.EntryList && this.state.appData.EntryList.list.length &&
                    <List>
                        {this.state.appData.EntryList && this.state.appData.EntryList.descending.map(entry => {
                            const isNight = entry.nightDay === NightDay.Night;
                            return (
                                <ListItem
                                    containerStyle={{ backgroundColor: isNight ? '#d0d0db' : '#fff' }}
                                    key={entry.entryId}
                                    title={entry.toLongString()}
                                    leftIcon={
                                        isNight ?
                                            { name: 'ios-moon', color: 'orange', type: 'ionicon' } :
                                            { name: 'ios-sunny', color: '#fff100', type: 'ionicon', style: { fontSize: 34 } }}
                                    hideChevron
                                    subtitle={
                                        <View style={[GeneralStyles.buttonList, { margin: 15 }]}>
                                            <TouchableHighlight
                                                underlayColor='#faa'
                                                style={{ flex: 1 }}
                                                onPress={() => this.deleteEntry.bind(this)(entry)}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Icon
                                                        name='delete-forever'
                                                        color='#faa'
                                                        size={25} />
                                                    <Text> Remove</Text>
                                                </View>
                                            </TouchableHighlight>
                                            <TouchableHighlight
                                                onPress={() => this.newKavuah.bind(this)(entry)}
                                                underlayColor='#aaf'
                                                style={{ flex: 1 }}>
                                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                                    <Icon
                                                        name='device-hub'
                                                        color='#aaf'
                                                        size={25} />
                                                    <Text> New Kavuah</Text>
                                                </View>
                                            </TouchableHighlight>
                                        </View>}
                                />
                            );
                        })}
                    </List>)
                    ||
                    <View style={GeneralStyles.emptyListView}>
                        <Text style={GeneralStyles.emptyListText}>There are no Entries in the list</Text>
                        <Image source={require('../Images/logo.png')} />
                    </View>
                }
            </ScrollView>);
    }
}
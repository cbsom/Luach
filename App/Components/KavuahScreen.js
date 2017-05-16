import React, { Component } from 'react';
import { ScrollView, View, Alert, Switch, Text, TouchableHighlight } from 'react-native';
import GestureRecognizer from 'react-native-swipe-gestures';
import SideMenu from './SideMenu';
import CustomList from './CustomList';
import { Icon } from 'react-native-elements';
import DataUtils from '../Code/Data/DataUtils';
import { popUpMessage } from '../Code/GeneralUtils';
import { GeneralStyles } from './styles';

export default class KavuahScreen extends Component {
    static navigationOptions = {
        title: 'List of Kavuahs',
        right: <Icon name='add-circle' onPress={this.newKavuah} />,
    };
    constructor(props) {
        super(props);

        this.navigate = this.props.navigation.navigate;

        const { params } = this.props.navigation.state,
            appData = params.appData;
        this.onUpdate = params.onUpdate;
        this.state = {
            appData: appData,
            kavuahList: appData.KavuahList,
            menuWidth: 50
        };
        this.update = this.update.bind(this);
        this.deleteKavuah = this.deleteKavuah.bind(this);
        this.findKavuahs = this.findKavuahs.bind(this);
        this.newKavuah = this.newKavuah.bind(this);
        this.save = this.save.bind(this);
        this.update = this.update.bind(this);
        this.showMenu = this.showMenu.bind(this);
        this.hideMenu = this.hideMenu.bind(this);
    }
    hideMenu() {
        this.setState({ menuWidth: 0 });
    }
    showMenu() {
        this.setState({ menuWidth: 50 });
    }
    update(appData) {
        if (this.onUpdate) {
            this.onUpdate(appData);
        }
        this.setState({
            appData: appData,
            kavuahList: appData.KavuahList
        });
    }
    newKavuah() {
        this.navigate('NewKavuah', {
            appData: this.state.appData,
            onUpdate: this.update
        });
    }
    deleteKavuah(kavuah) {
        const appData = this.state.appData;
        let kavuahList = appData.KavuahList,
            index = kavuahList.indexOf(kavuah);
        if (index > -1 || kavuah.hasId) {
            Alert.alert(
                'Confirm Kavuah Removal',
                'Are you sure that you want to remove this Kavuah?',
                [   //Button 1
                    {
                        text: 'Cancel',
                        onPress: () => { return; },
                        style: 'cancel'
                    },
                    //Button 2
                    {
                        text: 'OK', onPress: () => {
                            if (kavuah.hasId) {
                                DataUtils.DeleteKavuah(kavuah).catch(error => {
                                    if (__DEV__) {
                                        console.warn('Error trying to delete a kavuah from the database.');
                                        console.error(error);
                                    }
                                });
                            }
                            if (index > -1) {
                                kavuahList.splice(index, 1);
                                appData.KavuahList = kavuahList;
                                this.update(appData);
                            }
                            popUpMessage(`The kavuah of ${kavuah.toString()} has been successfully removed.`,
                                'Remove kavuah');
                        }
                    }
                ]);
        }
    }
    findKavuahs() {
        this.navigate('FindKavuahs', {
            appData: this.state.appData,
            onUpdate: this.update
        });
    }
    save(kavuah, name, value) {
        const appData = this.state.appData,
            kav = appData.KavuahList.find(k => k === kavuah);
        kav[name] = value;
        DataUtils.KavuahToDatabase(kav).then(() => {
            this.update(appData);
        });
    }
    render() {
        return (
            <View style={GeneralStyles.container}>
                <GestureRecognizer style={{ flexDirection: 'row', flex: 1 }}
                    onSwipeLeft={this.hideMenu}
                    onSwipeRight={this.showMenu}>
                    <SideMenu
                        width={this.state.menuWidth}
                        onUpdate={this.onUpdate}
                        appData={this.state.appData}
                        navigate={this.navigate}
                        hideKavuahs={true}
                        hideMonthView={true} />
                    <ScrollView style={{ flex: 1 }}>
                        <View style={[GeneralStyles.buttonList, GeneralStyles.headerButtons]}>
                            <TouchableHighlight onPress={this.newKavuah}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon
                                        size={12}
                                        reverse
                                        name='add'
                                        color='#484' />
                                    <Text style={{
                                        fontSize: 12,
                                        color: '#262',
                                        fontStyle: 'italic'
                                    }}>New Kavuah</Text>
                                </View>
                            </TouchableHighlight>
                            <TouchableHighlight onPress={this.findKavuahs}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon
                                        size={12}
                                        reverse
                                        name='search'
                                        color='#669' />
                                    <Text style={{
                                        fontSize: 12,
                                        color: '#669',
                                        fontStyle: 'italic'
                                    }}>Calculate Possible Kavuahs</Text>
                                </View>
                            </TouchableHighlight>
                        </View>
                        <CustomList
                            data={this.state.kavuahList}
                            title={kavuah => kavuah.toLongString()}
                            iconName='device-hub'
                            emptyListText='There are no Kavuahs in the list'
                            secondSection={kavuah => <View style={GeneralStyles.inItemButtonList}>
                                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                    <Text>Active </Text>
                                    <Switch value={kavuah.active}
                                        onValueChange={value =>
                                            this.save(kavuah, 'active', value)}
                                        title='Active' />
                                </View>
                                <TouchableHighlight
                                    underlayColor='#faa'
                                    style={{ flex: 1 }}
                                    onPress={() => this.deleteKavuah(kavuah)}>
                                    <View style={{ alignItems: 'center' }}>
                                        <Icon
                                            name='delete-forever'
                                            color='#faa'
                                            size={20} />
                                        <Text style={GeneralStyles.inItemLinkText}>Remove</Text>
                                    </View>
                                </TouchableHighlight>
                            </View>}
                        />
                    </ScrollView>
                </GestureRecognizer>
            </View>);
    }
}
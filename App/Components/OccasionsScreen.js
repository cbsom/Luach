import React, { Component } from 'react';
import { ScrollView, Alert, Text, View, Image, TouchableHighlight } from 'react-native';
import { Icon } from 'react-native-elements';
import CustomList from './CustomList';
import DataUtils from '../Code/Data/DataUtils';
import { GeneralStyles } from './styles';

export default class OccasionsScreen extends Component {
    static navigationOptions = {
        title: 'List of Occasions',
    };
    constructor(props) {
        super(props);

        this.navigate = this.props.navigation.navigate;

        const { appData, onUpdate } = this.props.navigation.state.params;
        this.onUpdate = onUpdate;
        this.state = {
            appData: appData,
            occasionList: appData.UserOccasions
        };

        this.deleteOccasion = this.deleteOccasion.bind(this);
    }
    deleteOccasion(occasion) {
        DataUtils.DeleteUserOccasion(occasion).then(() => {
            const appData = this.state.appData;
            let occasionList = appData.UserOccasions,
                index = occasionList.indexOf(occasion);
            if (index > -1) {
                occasionList.splice(index, 1);
                appData.UserOccasions = occasionList;
                if (this.onUpdate) {
                    this.onUpdate(appData);
                }
                this.setState({
                    appData: appData,
                    occasionList: occasionList
                });
                Alert.alert('Remove occasion',
                    `The ocassion ${occasion.title} has been successfully removed.`);
            }
        }
        ).catch(error => {
            if (__DEV__) {
                console.warn('Error trying to delete an occasion from the database.');
                console.error(error);
            }
        });
    }
    render() {
        return (
            <ScrollView style={GeneralStyles.container}>
                    <CustomList
                        data={this.state.occasionList}
                        iconName='list'
                        emptyListText='There are no Occasions in the list'
                        secondSection={occasion => <View style={[GeneralStyles.buttonList, { margin: 15 }]}>
                            <TouchableHighlight
                                underlayColor='#faa'
                                style={{ flex: 1 }}
                                onPress={() => this.deleteOccasion(occasion)}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon
                                        name='delete-forever'
                                        color='#faa'
                                        size={25} />
                                    <Text> Remove</Text>
                                </View>
                            </TouchableHighlight>
                            <TouchableHighlight
                                underlayColor='#696'
                                style={{ flex: 1 }}
                                onPress={() => this.navigate('Home', { currDate: occasion.jdate, appData: this.state.appData })}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon
                                        name='event-note'
                                        color='#696'
                                        size={25} />
                                    <Text> Go to Date</Text>
                                </View>
                            </TouchableHighlight>
                        </View>} />
            </ScrollView>);
    }
}
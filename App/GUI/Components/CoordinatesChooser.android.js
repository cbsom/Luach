import React from 'react';
import { View, Text, TouchableOpacity, Modal, Button, Picker } from 'react-native';
import { range } from '../../Code/GeneralUtils';
import { GeneralStyles } from '../styles';

export const CoordinatesType = Object.freeze({
    Longitude: 0,
    Latitude: 1
}),
    Direction = Object.freeze({
        WestOrNorth: 1,
        EastOrSouth: -1
    });

export class CoordinatesChooser extends React.PureComponent {
    constructor(props) {
        super(props);
        this.coordinatesType = this.props.coordinatesType;
        this.degreesRange = this.coordinatesType === CoordinatesType.Latitude
            ? range(0, 180)
            : range(0, 90);
        this.minsSecsRange = range(0, 60);

        const { degrees, minutes, seconds } = this.degToCoords(this.props.value),
            direction = Math.sign(this.props.value) === 1
                ? Direction.WestOrNorth
                : Direction.EastOrSouth;

        this.state = { modalVisible: false, degrees, minutes, seconds, direction };


        this.setCoordinates = this.setCoordinates.bind(this);
    }
    degToCoords(degreeDecimal) {
        const degrees = Math.floor(degreeDecimal);
        let remainder = degreeDecimal - degrees;
        const minutes = Math.floor((remainder * 100) * 0.6);
        remainder -= (minutes / 100.0);
        const seconds = Math.round((remainder * 100) * 0.6, 2);
        return { degrees, minutes, seconds };
    }
    getCoordsDeg() {
        const { degrees, minutes, seconds } = this.state,
            sixtieth = 0.016666666666666666;
        return this.state.direction *
            (degrees + (minutes * sixtieth) + (seconds * (sixtieth ** 2)));
    }
    getCoordsString() {
        return `${this.state.degrees}° ${this.state.minutes}' ${this.state.seconds}" ${this.getDirectionText()}`;
    }
    getDirectionText() {
        return this.coordinatesType === CoordinatesType.Latitude
            ? this.Direction === Direction.WestOrNorth ? 'North' : 'South'
            : this.Direction === Direction.WestOrNorth ? 'West' : 'East';
    }
    close() {
        this.props.setCoordinates(this.getCoordsDeg());
        this.setState({ modalVisible: false });
    }

    render() {
        return <View>
            <TouchableOpacity onPress={() => this.setState({ modalVisible: true })}>
                <View style={GeneralStyles.textInput}>
                    <Text>{this.getCoordsString()}}</Text>
                </View>
            </TouchableOpacity>
            <Modal
                style={{ flex: 1 }}
                transparent={true}
                visible={this.state.modalVisible}
                onRequestClose={() => this.close()}>
                <View style={{
                    flex: 1,
                    backgroundColor: '#0009',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <View style={{
                        backgroundColor: '#fff',
                        flex: 0,
                        width: 350,
                        maxWidth: '90%'
                    }}>
                        <View style={{
                            backgroundColor: '#88a',
                            paddingTop: 30,
                            paddingBottom: 30,
                            paddingLeft: 10,
                            paddingRight: 10
                        }}>
                            <Text style={{
                                color: '#fff',
                                fontWeight: 'bold',
                                fontSize: 18,
                                textAlign: 'center'
                            }}>
                                {`Select ${this.coordinatesType === CoordinatesType.Latitude
                                    ? 'Latitude'
                                    : 'Longitue'}`}
                            </Text>
                        </View>
                        <View>
                            <Text style={GeneralStyles.label}>Degrees</Text>
                            <Picker style={GeneralStyles.picker}
                                selectedValue={this.state.degrees}
                                onValueChange={degrees => this.setState({ degrees })}>
                                {this.degreesRange.map(d =>
                                    <Picker.Item label={d.toString()} value={d} key={d} />
                                )}
                            </Picker>
                        </View>
                        <View>
                            <Text style={GeneralStyles.label}>Minutes</Text>
                            <Picker style={GeneralStyles.picker}
                                selectedValue={this.state.minutes}
                                onValueChange={minutes => this.setState({ minutes })}>
                                {this.minsSecsRange.map(d =>
                                    <Picker.Item label={d.toString()} value={d} key={d} />
                                )}
                            </Picker>
                        </View>
                        <View>
                            <Text style={GeneralStyles.label}>Seconds</Text>
                            <Picker style={GeneralStyles.picker}
                                selectedValue={this.state.seconds}
                                onValueChange={seconds => this.setState({ seconds })}>
                                {this.minsSecsRange.map(d =>
                                    <Picker.Item label={d.toString()} value={d} key={d} />
                                )}
                            </Picker>
                        </View>
                        <View>
                            <Text style={GeneralStyles.label}>Direction</Text>
                            <Picker style={GeneralStyles.picker}
                                selectedValue={this.state.direction}
                                onValueChange={direction => this.setState({ direction })}>
                                <Picker.Item
                                    label={this.coordinatesType === CoordinatesType.Latitude
                                        ? 'North'
                                        : 'West'}
                                    value={Direction.WestOrNorth} />
                                <Picker.Item
                                    label={this.coordinatesType === CoordinatesType.Latitude
                                        ? 'South'
                                        : 'East'}
                                    value={Direction.EastOrSouth} />
                            </Picker>
                        </View>
                        <View style={{
                            alignItems: 'center',
                            marginBottom: 10
                        }}>
                            <Button onPress={() => this.close()} title='Close' />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>;
    }
}
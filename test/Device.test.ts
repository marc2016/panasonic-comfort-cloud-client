import { Device } from '../src/model/Device.js'
import {
  Power,
  OperationMode,
  FanSpeed,
  AirSwingLR,
  AirSwingUD,
  EcoMode,
  FanAutoMode,
  NanoeMode
} from '../src/domain/enums.js'

describe('Device Model Tests', () => {
  test('should create a device with guid and name', () => {
    const device = new Device('test-guid', 'Test Device')
    expect(device.guid).toBe('test-guid')
    expect(device.name).toBe('Test Device')
  })

  test('should correctly set and get all device parameters', () => {
    const device = new Device('test-guid', 'Test Device')

    device.operate = Power.On
    device.operationMode = OperationMode.Cool
    device.temperatureSet = 21.5
    device.fanSpeed = FanSpeed.High
    device.fanAutoMode = FanAutoMode.AirSwingAuto
    device.airSwingLR = AirSwingLR.Left
    device.airSwingUD = AirSwingUD.Up
    device.ecoMode = EcoMode.Quiet
    device.nanoe = NanoeMode.On
    device.actualNanoe = NanoeMode.On
    device.insideTemperature = 22
    device.outTemperature = 15
    device.ecoNavi = 1
    device.iAuto = 1
    device.airDirection = 2
    device.ecoFunctionData = 3

    expect(device.operate).toBe(Power.On)
    expect(device.operationMode).toBe(OperationMode.Cool)
    expect(device.temperatureSet).toBe(21.5)
    expect(device.fanSpeed).toBe(FanSpeed.High)
    expect(device.fanAutoMode).toBe(FanAutoMode.AirSwingAuto)
    expect(device.airSwingLR).toBe(AirSwingLR.Left)
    expect(device.airSwingUD).toBe(AirSwingUD.Up)
    expect(device.ecoMode).toBe(EcoMode.Quiet)
    expect(device.nanoe).toBe(NanoeMode.On)
    expect(device.actualNanoe).toBe(NanoeMode.On)
    expect(device.insideTemperature).toBe(22)
    expect(device.outTemperature).toBe(15)
    expect(device.ecoNavi).toBe(1)
    expect(device.iAuto).toBe(1)
    expect(device.airDirection).toBe(2)
    expect(device.ecoFunctionData).toBe(3)
  })

  test('should generate correct parameters payload object', () => {
    const device = new Device('test-guid', 'Test Device')
    device.operate = Power.On
    device.operationMode = OperationMode.Heat
    device.temperatureSet = 24
    device.fanSpeed = FanSpeed.Low
    device.airSwingUD = AirSwingUD.Down
    device.airSwingLR = AirSwingLR.Right

    const params = device.parameters
    expect(params).toEqual({
      operate: Power.On,
      operationMode: OperationMode.Heat,
      ecoMode: EcoMode.Auto,
      temperatureSet: 24,
      airSwingUD: AirSwingUD.Down,
      airSwingLR: AirSwingLR.Right,
      fanAutoMode: FanAutoMode.AirSwingAuto,
      fanSpeed: FanSpeed.Low,
      actualNanoe: NanoeMode.Unavailable
    })
  })

  test('should allow setting guid and name via setters', () => {
    const device = new Device('old-guid', 'Old Name')
    device.guid = 'new-guid'
    device.name = 'New Name'

    expect(device.guid).toBe('new-guid')
    expect(device.name).toBe('New Name')
  })
})

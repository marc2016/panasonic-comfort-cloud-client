import {
  Power,
  OperationMode,
  EcoMode,
  AirSwingUD,
  AirSwingLR,
  FanAutoMode,
  FanSpeed,
  NanoeMode
} from '../domain/enums.js'

export interface Parameters {
  [key: string]: any
  operate?: Power
  operationMode?: OperationMode
  ecoMode?: EcoMode
  temperatureSet?: number
  airSwingUD?: AirSwingUD
  airSwingLR?: AirSwingLR
  fanAutoMode?: FanAutoMode
  fanSpeed?: FanSpeed
  actualNanoe?: NanoeMode
}

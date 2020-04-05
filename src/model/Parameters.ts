import {
  Power,
  OperationMode,
  EcoMode,
  AirSwingUD,
  AirSwingLR,
  FanAutoMode,
  FanSpeed
} from '../domain/enums'

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
}

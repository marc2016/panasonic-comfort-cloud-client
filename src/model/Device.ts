/* eslint-disable @typescript-eslint/adjacent-overload-signatures */
/* eslint-disable require-jsdoc */
import {
  Power,
  OperationMode,
  FanSpeed,
  AirSwingLR,
  AirSwingUD,
  EcoMode,
  FanAutoMode,
  NanoeMode
} from '../domain/enums.js'
import { Parameters } from './Parameters.js'

/*
{
                    "deviceGuid": "xxx",
                    "deviceType": "1",
                    "deviceName": "yyy",
                    "permission": 3,
                    "summerHouse": 0,
                    "iAutoX": false,
                    "nanoe": false,
                    "autoMode": true,
                    "heatMode": true,
                    "fanMode": false,
                    "dryMode": true,
                    "coolMode": true,
                    "ecoNavi": true,
                    "powerfulMode": true,
                    "quietMode": true,
                    "airSwingLR": true,
                    "ecoFunction": 0,
                    "temperatureUnit": 0,
                    "modeAvlList": {
                        "autoMode": 1,
                        "fanMode": 1
                    },
                    "parameters": {
                        "operate": 1,
                        "operationMode": 3,
                        "temperatureSet": 19.0,
                        "fanSpeed": 0,
                        "fanAutoMode": 1,
                        "airSwingLR": 0,
                        "airSwingUD": 0,
                        "ecoMode": 0,
                        "ecoNavi": 1,
                        "nanoe": 0,
                        "iAuto": 0,
                        "actualNanoe": 0,
                        "airDirection": 0,
                        "ecoFunctionData": 0
                    }
                }
*/

export class Device {
  private _guid: string
  private _name: string
  private _operate: Power = Power.Off
  private _operationMode: OperationMode = OperationMode.Auto
  private _temperatureSet = 0
  private _fanSpeed: FanSpeed = FanSpeed.Auto
  private _fanAutoMode: FanAutoMode = FanAutoMode.AirSwingAuto
  private _airSwingLR: AirSwingLR = AirSwingLR.Mid
  private _airSwingUD: AirSwingUD = AirSwingUD.Mid
  private _ecoMode: EcoMode = EcoMode.Auto
  private _actualNanoe: NanoeMode = NanoeMode.Unavailable
  private _ecoNavi = 0
  private _nanoe: NanoeMode = NanoeMode.Unavailable
  private _iAuto = 0
  private _airDirection = 0
  private _ecoFunctionData = 0
  private _insideTemperature = 0
  private _outTemperature = 0

  constructor(guid: string, name: string) {
    this._guid = guid
    this._name = name
  }

  public get parameters(): Parameters {
    return {
      operate: this._operate,
      operationMode: this._operationMode,
      ecoMode: this._ecoMode,
      temperatureSet: this._temperatureSet,
      airSwingUD: this._airSwingUD,
      airSwingLR: this._airSwingLR,
      fanAutoMode: this._fanAutoMode,
      fanSpeed: this._fanSpeed,
      actualNanoe: this._actualNanoe
    }
  }

  /**
   * Getter operate
   * @return {Power}
   */
  public get operate(): Power {
    return this._operate
  }

  /**
   * Getter operationMode
   * @return {OperationMode}
   */
  public get operationMode(): OperationMode {
    // eslint-disable-next-line semi
    return this._operationMode
  }

  /**
   * Getter temperatureSet
   * @return {number}
   */
  public get temperatureSet(): number {
    return this._temperatureSet
  }

  /**
   * Getter fanSpeed
   * @return {FanSpeed}
   */
  public get fanSpeed(): FanSpeed {
    return this._fanSpeed
  }

  /**
   * Getter fanAutoMode
   * @return {FanAutoMode}
   */
  public get fanAutoMode(): FanAutoMode {
    return this._fanAutoMode
  }

  /**
   * Getter airSwingLR
   * @return {AirSwingLR}
   */
  public get airSwingLR(): AirSwingLR {
    return this._airSwingLR
  }

  /**
   * Getter airSwingUD
   * @return {AirSwingUD}
   */
  public get airSwingUD(): AirSwingUD {
    return this._airSwingUD
  }

  /**
   * Getter ecoMode
   * @return {EcoMode}
   */
  public get ecoMode(): EcoMode {
    return this._ecoMode
  }

  /**
   * Getter ecoNavi
   * @return {number}
   */
  public get ecoNavi(): number {
    return this._ecoNavi
  }

  /**
   * Getter nanoe
   * @return {NanoeMode}
   */
  public get nanoe(): NanoeMode {
    return this._nanoe
  }

  /**
   * Getter iAuto
   * @return {number}
   */
  public get iAuto(): number {
    return this._iAuto
  }

  /**
   * Getter actualNanoe
   * @return {NanoeMode}
   */
  public get actualNanoe(): NanoeMode {
    return this._actualNanoe
  }

  /**
   * Getter airDirection
   * @return {number}
   */
  public get airDirection(): number {
    return this._airDirection
  }

  /**
   * Getter ecoFunctionData
   * @return {number}
   */
  public get ecoFunctionData(): number {
    return this._ecoFunctionData
  }

  /**
   * Setter operate
   * @param {Power} value
   */
  public set operate(value: Power) {
    this._operate = value
  }

  /**
   * Setter operationMode
   * @param {OperationMode} value
   */
  public set operationMode(value: OperationMode) {
    this._operationMode = value
  }

  /**
   * Setter temperatureSet
   * @param {number} value
   */
  public set temperatureSet(value: number) {
    this._temperatureSet = value
  }

  /**
   * Setter fanSpeed
   * @param {FanSpeed} value
   */
  public set fanSpeed(value: FanSpeed) {
    this._fanSpeed = value
  }

  /**
   * Setter fanAutoMode
   * @param {FanAutoMode} value
   */
  public set fanAutoMode(value: FanAutoMode) {
    this._fanAutoMode = value
  }

  /**
   * Setter airSwingLR
   * @param {AirSwingLR} value
   */
  public set airSwingLR(value: AirSwingLR) {
    this._airSwingLR = value
  }

  /**
   * Setter airSwingUD
   * @param {AirSwingUD} value
   */
  public set airSwingUD(value: AirSwingUD) {
    this._airSwingUD = value
  }

  /**
   * Setter ecoMode
   * @param {EcoMode} value
   */
  public set ecoMode(value: EcoMode) {
    this._ecoMode = value
  }

  /**
   * Setter ecoNavi
   * @param {number} value
   */
  public set ecoNavi(value: number) {
    this._ecoNavi = value
  }

  /**
   * Setter nanoe
   * @param {NanoeMode} value
   */
  public set nanoe(value: NanoeMode) {
    this._nanoe = value
  }

  /**
   * Setter iAuto
   * @param {number} value
   */
  public set iAuto(value: number) {
    this._iAuto = value
  }

  /**
   * Setter actualNanoe
   * @param {NanoeMode} value
   */
  public set actualNanoe(value: NanoeMode) {
    this._actualNanoe = value
  }

  /**
   * Setter airDirection
   * @param {number} value
   */
  public set airDirection(value: number) {
    this._airDirection = value
  }

  /**
   * Setter ecoFunctionData
   * @param {number} value
   */
  public set ecoFunctionData(value: number) {
    this._ecoFunctionData = value
  }

  /**
   * Getter name
   * @return {string}
   */
  public get name(): string {
    return this._name
  }

  /**
   * setter name
   * @param {string} value
   */
  public set name(value: string) {
    this._name = value
  }

  /**
   * Getter guid
   * @return {string}
   */
  public get guid(): string {
    return this._guid
  }

  /**
   * Setter guid
   * @param {string} value
   */
  public set guid(value: string) {
    this._guid = value
  }

  /**
   * Getter insideTemperature
   * @return {number}
   */
  public get insideTemperature(): number {
    return this._insideTemperature
  }

  /**
   * Setter insideTemperature
   * @param {number} value
   */
  public set insideTemperature(value: number) {
    this._insideTemperature = value
  }

  /**
   * Getter outTemperature
   * @return {number}
   */
  public get outTemperature(): number {
    return this._outTemperature
  }

  /**
   * Setter outTemperature
   * @param {number} value
   */
  public set outTemperature(value: number) {
    this._outTemperature = value
  }

}

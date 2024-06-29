export enum Power {
  Off = 0,
  On = 1,
}

export enum OperationMode {
  Auto = 0,
  Dry = 1,
  Cool = 2,
  Heat = 3,
  Fan = 4,
}

export enum AirSwingUD {
  Up = 0,
  UpMid = 3,
  Mid = 2,
  DownMid = 4,
  Down = 1,
}

export enum AirSwingLR {
  Left = 0,
  LeftMid = 4,
  Mid = 2,
  RightMid = 3,
  Right = 1,
}

export enum EcoMode {
  Auto = 0,
  Powerful = 1,
  Quiet = 2,
}

export enum FanSpeed {
  Auto = 0,
  Low = 1,
  LowMid = 2,
  Mid = 3,
  HighMid = 4,
  High = 5,
}

export enum DataMode {
  Day = 0,
  Week = 1,
  Month = 2,
  Year = 4,
}

export enum FanAutoMode {
  Disabled = 1,
  AirSwingAuto = 0,
  AirSwingLR = 3,
  AirSwingUD = 2,
}

export enum NanoeMode {
  Unavailable = 0,
  Off = 1,
  On = 2,
  ModeG = 3,
  All = 4
}

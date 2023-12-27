import { Device } from "./Device.js"

export class Group {
    private _id: number
    private _name: string
    private _devices: Array<Device>

    constructor(id: number, name: string, devices: Array<Device>) {
        this._id = id
        this._name = name
        this._devices = devices
    }

    get devices(): Array<Device> {
        return this._devices
    }

    get id(): number {
        return this._id
    }

    get name(): string {
        return this._name
    }
}

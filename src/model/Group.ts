import { Device } from "./Device.js"

export class Group {
    private _id: number
    private _name: string
    private _devices: Array<Device>

    constructor(id: number, name: string, devices: Array<Device>, private outputMode: 'raw' | 'pretty' = 'raw') {
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

    toJSON(): any {
        switch(this.outputMode) {
            case 'raw': 
                return {
                    '_id': this.id,
                    "_name": this.name,
                    "_devices": this.devices
                }
            
            case 'pretty':
                return {
                    'id': this.id,
                    "name": this.name,
                    "devices": this.devices
                }
        }
    }
}

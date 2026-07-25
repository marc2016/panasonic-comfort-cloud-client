import * as fs from 'fs'
import * as path from 'path'
import { Group } from '../src/model/Group.js'
import { Device } from '../src/model/Device.js'

describe('Live Fixtures Tests', () => {
    let liveFixtures: any;

    beforeAll(() => {
        const fixturePath = path.resolve(__dirname, 'live-fixtures.json');
        const fileData = fs.readFileSync(fixturePath, 'utf8');
        liveFixtures = JSON.parse(fileData);
    });

    test('should contain valid mockGroupResponse with 5 devices', () => {
        expect(liveFixtures.mockGroupResponse).toBeDefined();
        expect(Array.isArray(liveFixtures.mockGroupResponse)).toBeTruthy();
        expect(liveFixtures.mockGroupResponse.length).toBeGreaterThan(0);

        const groupData = liveFixtures.mockGroupResponse[0];
        expect(groupData._name).toBe('Anon Group');
        expect(groupData._devices.length).toBe(5);

        // Check device GUIDs and names
        const guids = groupData._devices.map((d: any) => d.guid);
        expect(guids).toContain('anon-guid-1');
        expect(guids).toContain('anon-guid-2');
        expect(guids).toContain('anon-guid-3');
        expect(guids).toContain('anon-guid-4');
        expect(guids).toContain('anon-guid-5');
    });

    test('should validate mockDeviceResponses for all 5 live devices', () => {
        const deviceResponses = liveFixtures.mockDeviceResponses;
        expect(deviceResponses).toBeDefined();

        for (let i = 1; i <= 5; i++) {
            const guid = `anon-guid-${i}`;
            const deviceData = deviceResponses[guid];
            expect(deviceData).toBeDefined();
            expect(deviceData._guid).toBe(guid);

            // Verify core properties exist on live device responses
            expect(typeof deviceData._temperatureSet).toBe('number');
            expect(typeof deviceData._operationMode).toBe('number');
            expect(typeof deviceData._operate).toBe('number');
            expect(typeof deviceData._fanSpeed).toBe('number');
            expect(typeof deviceData._fanAutoMode).toBe('number');
            expect(typeof deviceData._airSwingLR).toBe('number');
            expect(typeof deviceData._airSwingUD).toBe('number');

            // Verify advanced parameters returned by live API
            expect(deviceData).toHaveProperty('_insideTemperature');
            expect(deviceData).toHaveProperty('_outTemperature');
            expect(deviceData).toHaveProperty('airQuality');
            expect(deviceData).toHaveProperty('fireplace');
            expect(deviceData).toHaveProperty('insideCleaning');
        }
    });

    test('should validate mockHistoryResponses for all 5 live devices', () => {
        const historyResponses = liveFixtures.mockHistoryResponses;
        expect(historyResponses).toBeDefined();

        for (let i = 1; i <= 5; i++) {
            const guid = `anon-guid-${i}`;
            const historyData = historyResponses[guid];
            expect(historyData).toBeDefined();
            expect(historyData.historyDataList).toBeDefined();
            expect(Array.isArray(historyData.historyDataList)).toBeTruthy();
            expect(historyData.historyDataList.length).toBeGreaterThan(0);

            // Check history entry properties returned by live API
            const firstEntry = historyData.historyDataList[0];
            expect(firstEntry).toHaveProperty('dataTime');
            expect(firstEntry).toHaveProperty('consumption');
            expect(firstEntry).toHaveProperty('cost');
            expect(firstEntry).toHaveProperty('heatConsumptionRate');
            expect(firstEntry).toHaveProperty('coolConsumptionRate');
        }
    });
});

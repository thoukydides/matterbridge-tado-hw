// Matterbridge plugin for Tado hot water control
// Copyright © 2025 Alexander Thoukydides

import { AnsiLogger } from 'matterbridge/logger';
import { Device, SetZoneOverlaysArg, Tado, Zone } from 'node-tado-client';
import { Config } from './config-types.js';

// Device types for the Extension Kit or Wireless Receiver
const DEVICE_TYPES_HW = ['BU01', 'EK01'];

// Control of a single Tado hot water zone
export class TadoHWZone {

    // The device(s) in the zone responsible for hot water control
    readonly devices: Device[];

    // Details of the hot water control device
    // (suitable for the Matter Bridged Device Basic Information Cluster)
    deviceName:         string;
    serialNumber:       string;
    productName:        string;
    softwareVersion:    string;

    // Create a new zone instance
    constructor(
        public   log:       AnsiLogger,
        readonly config:    Config,
        readonly tado:      Tado,
        readonly home_id:   number,
        readonly zone:      Zone
    ) {
        // Attempt to identify the device(s) responsible for hot water control
        this.devices = this.getDevices();

        // Extract interesting details about the device
        this.deviceName         = zone.name;
        this.serialNumber       = this.devices[0]?.serialNo         ?? '?';
        this.productName        = this.devices[0]?.deviceType       ?? '?';
        this.softwareVersion    = this.devices[0]?.currentFwVersion ?? '?';
    }

    // Identify the device(s) responsible for hot water control
    getDevices(): Device[] {
        // Note: ZoneDevice is incorrectly derived from Zone (instead of Device)
        // Note: DeviceType only allows "VA02", "SU02" (not "BU01", "EK01" etc)
        const devices = this.zone.devices as unknown as Device[];
        const devicesHW = devices.filter(device => DEVICE_TYPES_HW.includes(device.deviceType));
        if (devicesHW.length !== 1) {
            this.log.warn(`Expected a single hot water control device for ${this.zone.name} but ${devicesHW.length} found`);
            this.log.debug(`Devices:\n${JSON.stringify(devices, null, 4)}`);
        }
        return devicesHW.length ? devicesHW : devices;
    }

    // Identify the hot water zone
    async identify(): Promise<void> {
        for (const device of this.getDevices()) {
            await this.tado.identifyDevice(device.serialNo);
        }
    }

    // Get the current state of the hot water zone
    async getPower(): Promise<boolean> {
        const state = await this.tado.getZoneState(this.home_id, this.zone.id);
        this.log.debug('Zone state:', state);
        return state.setting.power === 'ON';
    }

    // Set the state of the hot water zone (until the next scheduled time block)
    async setPower(on: boolean): Promise<void> {
        // https://github.com/mattdavis90/node-tado-client/issues/127
        const zoneOverlay = {
            zone_id:    this.zone.id,
            power:      on ? 'ON' : 'OFF'
        } satisfies Omit<SetZoneOverlaysArg, 'temperature'> as SetZoneOverlaysArg;
        await this.tado.setZoneOverlays(this.home_id, [zoneOverlay], 'NEXT_TIME_BLOCK');
    }
}

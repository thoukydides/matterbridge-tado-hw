// Matterbridge plugin for Tado hot water control
// Copyright © 2025 Alexander Thoukydides

import {
    bridgedNode,
    MatterbridgeEndpoint,
    OnOff,
    onOffSwitch,
    powerSource
} from 'matterbridge';
import { AnsiLogger } from 'matterbridge/logger';
import { Config } from './config-types.js';
import { PLUGIN_VERSION, VENDOR_ID, VENDOR_NAME } from './settings.js';
import { TadoHWZone } from './tado-zone-hw.js';
import { logError, MS } from './utils.js';

// A Matterbridge hot water control endpoint
export class TadoHWDevice {

    log:            AnsiLogger;
    switch:         MatterbridgeEndpoint;
    pollInterval?:  NodeJS.Timeout;

    // Construct a new endpoint
    constructor(
        readonly config:        Config,
        readonly tadoHWZone:    TadoHWZone
    ) {
        // Create a switch device, using the serial number as its identifier
        // HERE - Consider replacing this by waterHeater
        const uniqueStorageKey = `Tado-${tadoHWZone.serialNumber}`;
        this.switch = new MatterbridgeEndpoint(
            [onOffSwitch, bridgedNode, powerSource],
            { uniqueStorageKey },
            this.config.debug
        );

        // Use the endpoint's logger
        this.tadoHWZone.log = this.log = this.switch.log;

        // Create the clusters for the switch device
        this.switch
            .createDefaultIdentifyClusterServer()
            .createDefaultGroupsClusterServer()
            .createDefaultBridgedDeviceBasicInformationClusterServer(
                tadoHWZone.deviceName,
                tadoHWZone.serialNumber,
                VENDOR_ID,
                VENDOR_NAME,
                tadoHWZone.productName,
                parseInt(this.tadoHWZone.softwareVersion, 10),
                tadoHWZone.softwareVersion,
                parseInt(PLUGIN_VERSION, 10),
                PLUGIN_VERSION
            )
            .createDefaultPowerSourceWiredClusterServer()
            .createDefaultOnOffClusterServer();

        // Add command handlers for the switch device
        this.switch.addCommandHandler('identify',   () => void this.identify());
        this.switch.addCommandHandler('on',         () => void this.setPower(true));
        this.switch.addCommandHandler('off',        () => void this.setPower(false));
    }

    // Get the endpoint (so that the device can be registered)
    get endpoint(): MatterbridgeEndpoint {
        return this.switch;
    }

    // Start polling the device and set the initial state
    start(): void {
        void this.pollPower(true);
        this.pollInterval = setInterval(
            () => void this.pollPower(),
            this.config.pollInterval * MS
        );
    }

    // Stop polling the device
    stop(): void {
        clearInterval(this.pollInterval);
        this.pollInterval = undefined;
    }

    // Identify the hot water zone
    async identify(): Promise<void> {
        try {
            this.log.info('Identifying');
            await this.tadoHWZone.identify();
        } catch (err) {
            logError(this.log, 'Identify', err);
        }
    }

    // Set the state of the hot water zone when changed from Matter
    async setPower(on: boolean): Promise<void> {
        try {
            this.log.info(`Setting power ${on ? 'ON' : 'OFF'}`);
            await this.tadoHWZone.setPower(on);
            await this.switch.setAttribute(OnOff.Cluster.id, 'onOff', on, this.log);
        } catch (err) {
            logError(this.log, 'Set power', err);
        }
    }

    // Poll the hot water zone for its current state
    async pollPower(alwaysSet = false): Promise<void> {
        try {
            const on = await this.tadoHWZone.getPower();
            const matterOn = this.switch.getAttribute(OnOff.Cluster.id, 'onOff', this.log) as unknown;
            if (alwaysSet || matterOn !== on) {
                this.log.info(`Power is ${on ? 'ON' : 'OFF'}`);
                await this.switch.setAttribute(OnOff.Cluster.id, 'onOff', on, this.log);
            }
        } catch (err) {
            logError(this.log, 'Poll power', err);
        }
    }
}
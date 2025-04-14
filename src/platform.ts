// Matterbridge plugin for Tado hot water control
// Copyright © 2025 Alexander Thoukydides

import { Matterbridge, MatterbridgeDynamicPlatform, PlatformConfig} from 'matterbridge';
import { AnsiLogger } from 'matterbridge/logger';
import NodePersist from 'node-persist';
import Path from 'path';
import { checkDependencyVersions } from './check-versions.js';
import { Config } from './config-types.js';
import { checkConfiguration } from './check-configuration.js';
import { TadoHWDevice } from './device-hw.js';
import { TadoAPI } from './tado.js';
import { plural } from './utils.js';

// A Tado hot water control platform
export class TadoHWPlatform extends MatterbridgeDynamicPlatform {

    // Strongly typed configuration
    declare config: Config & PlatformConfig;

    // Persistent storage
    persist:        NodePersist.LocalStorage;

    // Active devices
    devices:        TadoHWDevice[] = [];

    // Constructor
    constructor(matterbridge: Matterbridge, log: AnsiLogger, config: PlatformConfig) {
        super(matterbridge, log, config);

        // Check the dependencies and configuration
        checkDependencyVersions(this);
        checkConfiguration(log, config);
        log.info(`Initialising platform "${this.config.name}"`);

        // Create storage for this plugin (initialised in onStart)
        const persistDir = Path.join(this.matterbridge.matterbridgePluginDirectory, this.config.name, 'persist');
        this.persist = NodePersist.create({ dir: persistDir });
    }

    // Create the device and clusters when Matterbridge loads the plugin
    override async onStart(reason?: string): Promise<void> {
        this.log.info(`Starting "${this.config.name}": ${reason ?? 'none'}`);

        // Wait for the platform to start
        await this.ready;
        await this.clearSelect();

        // Initialise persistent storage
        await this.persist.init();

        // Initialise the Tado API
        const tadoAPI = new TadoAPI(this.log, this.config, this.persist);

        // Create a device for each hot water zone
        const zonesHW = await tadoAPI.getHWZones();
        this.log.info(`${plural(zonesHW.length, 'hot water zone')} found in Tado account`);
        for (const zone of zonesHW) {
            // Create the device
            const device = new TadoHWDevice(this.config, zone);
            const { serialNumber, deviceName } = zone;
            this.setSelectDevice(serialNumber, deviceName, undefined, 'hub');

            // Register the device unless blocked by the black/white lists
            if (this.validateDevice(deviceName)) {
                await this.registerDevice(device.endpoint);
                this.devices.push(device);
            }
        }
    }

    // Configure and initialise the device when the platform is commissioned
    override async onConfigure(): Promise<void> {
        this.log.info(`Configuring "${this.config.name}"`);
        await super.onConfigure();

        // Start polling the devices
        for (const endpoint of this.devices) {
            endpoint.start();
        }
    }

    // Cleanup resources when Matterbridge is shutting down
    override async onShutdown(reason?: string): Promise<void> {
        this.log.info(`Shutting down "${this.config.name}": ${reason ?? 'none'}`);
        await super.onShutdown(reason);

        // Stop polling the devices
        for (const endpoint of this.devices) {
            endpoint.stop();
        }

        // Remove the devices from Matterbridge during development
        if (this.config.unregisterOnShutdown) {
            await this.unregisterAllDevices();
        }
    }
}
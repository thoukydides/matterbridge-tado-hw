// Matterbridge plugin for Tado hot water control
// Copyright © 2025 Alexander Thoukydides

import { AnsiLogger } from 'matterbridge/logger';
import { Tado, Token } from 'node-tado-client';
import { logError } from './utils.js';
import NodePersist from 'node-persist';
import { Config } from './config-types.js';
import { TadoHWZone } from './tado-zone-hw.js';

// Authorise Tado API and enumerate hot water zones
export class TadoAPI {

    tado:   Tado;
    ready:  Promise<void>;
    zones?: TadoHWZone[];

    // Create a new Tado instance
    constructor(
        readonly log:       AnsiLogger,
        readonly config:    Config,
        readonly persist:   NodePersist.LocalStorage
    ) {
        this.tado = new Tado();
        this.ready = this.initAsync();
    }

    // Authenticate with Tado
    async initAsync(): Promise<void> {
        // Save tokens when they are refreshed
        this.tado.setTokenCallback(tokens => void this.saveToken(tokens));

        // Retrieve any saved tokens
        const token = await this.persist.getItem('tado_token') as Token | undefined;

        // Attempt OAuth authorisation
        const [verify, tokenPromise] = await this.tado.authenticate(token?.refresh_token);
        if (verify) {
            this.log.warn(`Authorise Tado account access (within ${verify.expires_in} seconds):`);
            this.log.warn(`  ${verify.verification_uri_complete}`);
        }
        await tokenPromise;
        this.log.info('Tado account access authorised');
    }

    // Save tokens when they are refreshed
    async saveToken(token: Token): Promise<void> {
        try {
            this.log.info(`Tado tokens refreshed (expires ${token.expiry.toISOString()})`);
            await this.persist.setItem('tado_token', token);
        } catch (err) {
            logError(this.log, 'Save Tado token', err);
        }
    }

    // Get the hot water control zones
    async getHWZones(): Promise<TadoHWZone[]> {
        await this.ready;

        // Iterate through the homes in the account
        const me = await this.tado.getMe();
        this.zones = [];
        for (const home of me.homes) {
            // Obtain a list of hot water zones in this home
            const zones = await this.tado.getZones(home.id);
            const zonesHW = zones.filter(zone => zone.type === 'HOT_WATER');

            // Instantiate a controller for each hot water zone
            for (const zone of zonesHW) {
                const tadoHWZone = new TadoHWZone(this.log, this.config, this.tado, home.id, zone);
                this.zones.push(tadoHWZone);
            }
        }
        return this.zones;
    }
}
// Matterbridge plugin for Tado hot water control
// Copyright © 2025 Alexander Thoukydides

import { PlatformConfig } from 'matterbridge';

// The user plugin configuration
export interface PluginConfig {
    // Matterbridge additions
    name:                   string;
    type:                   string;
    version:                string;
    whiteList:              string[];
    blackList:              string[];
    // Plugin configuration
    pollInterval:           number;
    debug:                  boolean;
    unregisterOnShutdown:   boolean;
}
export type Config = PlatformConfig & PluginConfig;
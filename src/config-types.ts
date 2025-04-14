// Matterbridge plugin for Tado hot water control
// Copyright © 2025 Alexander Thoukydides

// The user plugin configuration
export interface Config {
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
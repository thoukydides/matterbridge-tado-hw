// Matterbridge plugin for Tado hot water control
// Copyright © 2025 Alexander Thoukydides

import { Matterbridge, PlatformConfig } from 'matterbridge';
import { AnsiLogger } from 'matterbridge/logger';
import { TadoHWPlatform } from './platform.js';

// Register the platform with Matterbridge
export default function initializePlugin(
    matterbridge:   Matterbridge,
    log:            AnsiLogger,
    config:         PlatformConfig
): TadoHWPlatform {
    return new TadoHWPlatform(matterbridge, log, config);
}

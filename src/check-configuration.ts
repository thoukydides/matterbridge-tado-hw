// Matterbridge plugin for Tado hot water control
// Copyright © 2025 Alexander Thoukydides

import { PlatformConfig } from 'matterbridge';
import { AnsiLogger, LogLevel } from 'matterbridge/logger';
import { checkers } from './ti/config-types.js';
import { IErrorDetail } from 'ts-interface-checker';
import { deepMerge, getValidationTree } from './utils.js';
import { DEFAULT_CONFIG, PLUGIN_NAME } from './settings.js';
import { Config } from './config-types.js';

// Check that the configuration is valid
export function checkConfiguration(log: AnsiLogger, platformConfig: PlatformConfig): Config {
    // Apply default values
    const config = deepMerge(DEFAULT_CONFIG, platformConfig) as PlatformConfig;

    // Ensure that all required fields are provided and are of suitable types
    const checker = checkers.PluginConfig;
    checker.setReportedPath('<PLATFORM_CONFIG>');
    const strictValidation = checker.strictValidate(config);
    if (!checker.test(config)) {
        log.error('Plugin unable to start due to configuration errors:');
        logCheckerValidation(log, config, LogLevel.ERROR, strictValidation);
        throw new Error('Invalid plugin configuration');
    }

    // Warn of extraneous fields in the configuration
    if (strictValidation) {
        log.warn('Unsupported fields in plugin configuration will be ignored:');
        logCheckerValidation(log, config, LogLevel.WARN, strictValidation);
    }

    // Return the checked configuration
    return config;
}

// Log configuration checker validation errors
function logCheckerValidation(log: AnsiLogger, config: PlatformConfig, level: LogLevel, errors: IErrorDetail[] | null): void {
    const errorLines = errors ? getValidationTree(errors) : [];
    errorLines.forEach(line => { log.log(level, line); });
    log.info(`${typeof config.name === 'string' ? config.name : PLUGIN_NAME}.config.json:`);
    const configLines = JSON.stringify(config, null, 4).split('\n');
    configLines.forEach(line => { log.info(`    ${line}`); });
}
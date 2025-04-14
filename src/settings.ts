// Matterbridge plugin for Tado hot water control
// Copyright © 2025 Alexander Thoukydides

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Config } from './config-types.js';

// Read the package.json file
interface PackageJson {
    engines:        Record<string, string>;
    name:           string;
    displayName:    string;
    version:        string;
}
const PACKAGE_JSON = join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
const PACKAGE = JSON.parse(readFileSync(PACKAGE_JSON, 'utf-8')) as PackageJson;

// Platform identifiers
export const ENGINES        = PACKAGE.engines;
export const PLUGIN_NAME    = PACKAGE.name;
export const PLATFORM_NAME  = PACKAGE.displayName;
export const PLUGIN_VERSION = PACKAGE.version;

// Matter identifiers
export const VENDOR_ID      = 0x134E;
export const VENDOR_NAME    = 'Tado°';
export const PRODUCT_NAME   = 'Hot Water';

// Default configuration options
export const DEFAULT_CONFIG: Partial<Config> = {
    whiteList:              [],
    blackList:              [],
    pollInterval:           5 * 60 // 5 minutes
};
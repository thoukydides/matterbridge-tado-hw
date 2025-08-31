// Matterbridge plugin for Tado hot water control
// Copyright © 2025 Alexander Thoukydides

import * as core from '@actions/core';
import assert from 'node:assert';
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Config } from '../dist/config-types.js';
import { once } from 'node:events';
import { wr, er, ft } from 'matterbridge/logger';

// Spawn command to run Matterbridge (-homedir is added later)
const SPAWN_COMMAND = 'node';
const SPAWN_ARGS = ['node_modules/matterbridge/dist/cli.js'];

// Plugin configuration file for running tests
const PLUGIN_CONFIG_FILE = '.matterbridge/matterbridge-tado-hw.config.json';
const PLUGIN_CONFIG_CONTENT: Partial<Config> = {
    debug: true
};

// Log messages indicating success or failure
type Tests = Record<string, RegExp>;
const SUCCESS_TESTS: Tests = {
    'Authorise':    /\[Tado° HW\] Authorise Tado account access \(within 300 seconds\):/
};
const FAILURE_TESTS: Tests = {};

// Regular expression to split into lines (allowing CRLF, CR, or LF)
const LINE_SPLIT_REGEX = /\r\n|(?<!\r)\n|\r(?!\n)/;

// Match ANSI colour codes so that they can be stripped
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE = /\x1B\[[0-9;]*[msuK]/g;

// ANSI colour codes used for warnings and errors
const ANSI_WARNING = new RegExp([wr, er, ft].join('|').replaceAll('\u001B[', '\\x1B\\['));

// Length of time to wait
const TIMEOUT_MATTERBRIDGE_MS = 45 * 1000; // 45 seconds

// Register the plugin with Matterbridge
async function configureAndRegisterPlugin(): Promise<void> {

    // Create a temporary directory for Matterbridge to use as its home directory
    const matterbridgeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'matterbridge-test-'));
    SPAWN_ARGS.push('-homedir', matterbridgeDir);

    // Create a plugin configuration file
    const pluginConfigFile = path.join(matterbridgeDir, PLUGIN_CONFIG_FILE);
    await fs.mkdir(path.dirname(pluginConfigFile), { recursive: true });
    await fs.writeFile(pluginConfigFile, JSON.stringify(PLUGIN_CONFIG_CONTENT, null, 4));

    // Register the plugin with Matterbridge
    const child = spawn(SPAWN_COMMAND, [...SPAWN_ARGS, '-add', '.'], { stdio: 'inherit' });
    const timeout = setTimeout(() => { child.kill('SIGTERM'); }, TIMEOUT_MATTERBRIDGE_MS);
    await once(child, 'exit');
    clearTimeout(timeout);
}

// Run the plugin testlet rawOutput = '';
async function testPlugin(): Promise<void> {
    // Launch Matterbridge, piping stdout and stderr for monitoring
    const child = spawn(SPAWN_COMMAND, SPAWN_ARGS, { stdio: 'pipe' });
    const timeout = setTimeout(() => { child.kill('SIGTERM'); }, TIMEOUT_MATTERBRIDGE_MS);

    // Monitor stdout and stderr until they close
    let successTests = Object.keys(SUCCESS_TESTS);
    const failureTests = new Set<string>();
    const testOutputStream = async (
        child: ChildProcessWithoutNullStreams,
        streamName: 'stdout' | 'stderr'
    ): Promise<void> => {
        const stream = child[streamName];
        stream.setEncoding('utf8');

        const currentWarning: string[] = [];
        const flushWarning = (): void => {
            if (currentWarning.length) {
                failureTests.add(`Log warning: ${currentWarning.join('\n')}`);
                currentWarning.length = 0;
            }
        };

        for await (const chunk of stream) {
            assert(typeof chunk === 'string');
            for (const line of chunk.split(LINE_SPLIT_REGEX)) {
                if (line.trim().length) console.log(line);

                // Check for any of the success or failure log messages
                const cleanLine = line.replace(ANSI_ESCAPE, '');
                if (ANSI_WARNING.test(line) || streamName === 'stderr') currentWarning.push(cleanLine);
                else flushWarning();
                Object.entries(FAILURE_TESTS).filter(([, regexp]) => regexp.test(cleanLine))
                    .forEach(([name]) => failureTests.add(`${name}: ${cleanLine}`));
                successTests = successTests.filter(name => !SUCCESS_TESTS[name].test(cleanLine));
                if (successTests.length === 0) child.kill('SIGTERM');
            }
        }
        flushWarning();
    };
    await Promise.all([
        testOutputStream(child, 'stdout'),
        testOutputStream(child, 'stderr'),
        once(child, 'exit')
    ]);
    clearTimeout(timeout);

    // Check whether the test was successful
    const errors: string[] = [];
    if (child.exitCode) errors.push(`Process exited with code ${child.exitCode}`);
    errors.push(...failureTests);
    errors.push(...successTests.map(test => `Missing: ${test} (expected /${SUCCESS_TESTS[test].source}/)`));
    if (errors.length) throw new AggregateError(errors, 'Test failed');
}

// Run the test
void (async (): Promise<void> => {
    try {

        // Prepare the plugin configuration and register with Matterbridge
        await core.group(
            '🔧 Configuring plugin and registering with Matterbridge...',
            configureAndRegisterPlugin);

        // Run the test
        await core.group(
            '🔍 Running Matterbridge plugin test...',
            testPlugin);

        // If this point is reached, the test was successful
        console.log('🟢 Test successful');

    } catch (err) {

        // The test failed so log the command output
        console.error('🔴 Test failed');

        // Extract and log the individual error messages
        const errs = err instanceof AggregateError ? err.errors : [err];
        const messages = errs.map(e => e instanceof Error ? e.message : String(e));
        for (const message of messages) core.error(message);

        // Return a non-zero exit code
        process.exitCode = 1;
    }
})();
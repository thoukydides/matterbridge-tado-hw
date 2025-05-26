// Matterbridge plugin for Tado hot water control
// Copyright © 2025 Alexander Thoukydides

import assert from 'node:assert';
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';

// Spawn command to run Matterbridge (-homedir is added later)
const SPAWN_COMMAND = 'node';
const SPAWN_ARGS = ['node_modules/matterbridge/dist/cli.js'];

// Log messages indicating success
const SUCCESS_TESTS: { name: string, regexp: RegExp }[] = [
    { name: 'Authorise',    regexp: /\[Tado° HW\] Authorise Tado account access \(within 300 seconds\):/ }
];

// Match ANSI colour codes so that they can be stripped
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE = /\x1B\[[0-9;]*[msuK]/g;

// Length of time to wait
const TIMEOUT_MATTERBRIDGE_MS = 45 * 1000; // 45 seconds

// Register the plugin with Matterbridge
async function configureAndRegisterPlugin(): Promise<void> {

    // Create a temporary directory for Matterbridge to use as its home directory
    const matterbridgeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'matterbridge-test-'));
    SPAWN_ARGS.push('-homedir', matterbridgeDir);

    // Register the plugin with Matterbridge
    const child = spawn(SPAWN_COMMAND, [...SPAWN_ARGS, '-add', '.'], {
        stdio:      'ignore',
        timeout:    TIMEOUT_MATTERBRIDGE_MS
    });
    await once(child, 'exit');
}

// Run the plugin test
let rawOutput = '';
async function testPlugin(): Promise<void> {
    // Launch Matterbridge, piping stdout and stderr for monitoring
    const child = spawn(SPAWN_COMMAND, SPAWN_ARGS, {
        stdio:      'pipe',
        timeout:    TIMEOUT_MATTERBRIDGE_MS
    });

    // Monitor stdout and stderr until they close
    let remainingTests = SUCCESS_TESTS;
    const testOutputStream = async (
        child: ChildProcessWithoutNullStreams,
        streamName: 'stdout' | 'stderr'
    ): Promise<void> => {
        const stream = child[streamName];
        stream.setEncoding('utf8');
        for await (const chunk of stream) {
            assert(typeof chunk === 'string');
            rawOutput += chunk.toString();

            // Check for all of the expected log messages
            const cleanChunk = chunk.toString().replace(ANSI_ESCAPE, '');
            remainingTests = remainingTests.filter(({ regexp }) => !regexp.test(cleanChunk));
            if (remainingTests.length === 0) child.kill('SIGTERM');
        }
    };
    await Promise.all([
        testOutputStream(child, 'stdout'),
        testOutputStream(child, 'stderr')
    ]);

    // Check whether the test was successful
    if (child.exitCode !== null) {
        throw new Error(`Process exited with code ${child.exitCode}`);
    }
    if (remainingTests.length) {
        const failures = remainingTests.map(t => t.name).join(', ');
        throw new Error(`Process terminated with test failures: ${failures}`);
    }
}

// Run the test
void (async (): Promise<void> => {
    try {

        // Prepare the plugin configuration and register with Matterbridge
        console.log('🔧 Configuring plugin and registering with Matterbridge...');
        await configureAndRegisterPlugin();

        // Run the test
        console.log('🔍 Running Matterbridge plugin test...');
        await testPlugin();

        // If this point is reached, the test was successful
        console.log('🟢 Test successful');

    } catch (err) {

        // The test failed so log the command output
        console.log(rawOutput);

        // Extract and log the individual error messages
        const errs = err instanceof AggregateError ? err.errors : [err];
        const messages = errs.map(e => e instanceof Error ? e.message : String(e));
        console.error('🔴 Test failed:\n' + messages.map(m => `    ${m}\n`).join(''));

        // Return a non-zero exit code
        process.exitCode = 1;
    }
})();
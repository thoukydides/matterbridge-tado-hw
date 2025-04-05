// Matterbridge plugin for Tado hot water control
// Copyright © 2025 Alexander Thoukydides

import assert from 'assert';
import { AnsiLogger } from 'matterbridge/logger';
import { IErrorDetail } from 'ts-interface-checker';

// Milliseconds in a second
export const MS = 1000;

// Type assertions
export function assertIsDefined<Type>(value: Type): asserts value is NonNullable<Type> {
    assert.notStrictEqual(value, undefined);
    assert.notStrictEqual(value, null);
}

// Log an error
export function logError(log: AnsiLogger, when: string, err: unknown): void {
    try {
        // Log the error message itself
        log.error(`[${when}] ${String(err)}`);

        // Log any stack backtrace
        if (err instanceof Error && err.stack) log.debug(err.stack);
    } catch { /* empty */ }
}

// Format a counted noun (handling most regular cases automatically)
export function plural(count: number, noun: string | [string, string], showCount = true): string {
    const [singular, plural] = Array.isArray(noun) ? noun : [noun, ''];
    noun = count === 1 ? singular : plural;
    if (!noun) {
        // Apply regular rules
        const rules: [string, string, number][] = [
            ['on$',                 'a',   2], // phenomenon/phenomena criterion/criteria
            ['us$',                 'i',   1], //     cactus/cacti         focus/foci
            ['[^aeiou]y$',          'ies', 1], //        cty/cites         puppy/puppies
            ['(ch|is|o|s|sh|x|z)$', 'es',  0], //       iris/irises        truss/trusses
            ['',                    's',   0]  //        cat/cats          house/houses
        ];
        const rule = rules.find(([ending]) => new RegExp(ending, 'i').test(singular));
        assertIsDefined(rule);
        const matchCase = (s: string): string => singular === singular.toUpperCase() ? s.toUpperCase() : s;
        noun = singular.substring(0, singular.length - rule[2]).concat(matchCase(rule[1]));
    }
    return showCount ? `${count} ${noun}` : noun;
}

// Recursive object assignment, skipping undefined values
export function deepMerge(...objects: object[]): object {
    const isObject = (value: unknown): value is object =>
        value !== undefined && typeof value === 'object' && !Array.isArray(value);
    return objects.reduce((acc: Record<string, unknown>, object: object) => {
        Object.entries(object).forEach(([key, value]) => {
            const accValue = acc[key];
            if (value === undefined) return;
            if (isObject(accValue) && isObject(value)) acc[key] = deepMerge(accValue, value);
            else acc[key] = value;
        });
        return acc;
    }, {});
}

// Convert checker validation error into lines of text
export function getValidationTree(errors: IErrorDetail[]): string[] {
    const lines: string[] = [];
    errors.forEach((error, index) => {
        const prefix = (a: string, b: string): string => index < errors.length - 1 ? a : b;
        lines.push(`${prefix('├─ ', '└─ ')}${error.path} ${error.message}`);
        if (error.nested) {
            const nested = getValidationTree(error.nested);
            lines.push(...nested.map(line => `${prefix('│  ', '   ')} ${line}`));
        }
    });
    return lines;
}
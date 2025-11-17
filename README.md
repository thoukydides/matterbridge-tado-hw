<p align="center">
  <img src="https://raw.githubusercontent.com/wiki/thoukydides/matterbridge-tado-hw/matterbridge-tado-hw.png" height="200">
</p>
<div align=center>

# matterbridge-tado-hw

[![npm](https://img.shields.io/npm/v/matterbridge-tado-hw?label=Latest)](https://www.npmjs.com/package/matterbridge-tado-hw)
[![npm](https://img.shields.io/npm/dt/matterbridge-tado-hw?logo=npm&label=Downloads)](https://www.npmjs.com/package/matterbridge-tado-hw)
[![npm](https://img.shields.io/npm/dw/matterbridge-tado-hw?label=)](https://www.npmjs.com/package/matterbridge-tado-hw)
[![Build and Lint](https://github.com/thoukydides/matterbridge-tado-hw/actions/workflows/build.yml/badge.svg)](https://github.com/thoukydides/matterbridge-tado-hw/actions/workflows/build.yml)
[![Test](https://github.com/thoukydides/matterbridge-tado-hw/actions/workflows/test.yml/badge.svg)](https://github.com/thoukydides/matterbridge-tado-hw/actions/workflows/test.yml)

A [Matterbridge](https://github.com/Luligu/matterbridge) plugin that connects [Tado°](https://www.tado.com/) V2/V3/V3+ hot water control  
to the [Matter](https://csa-iot.org/all-solutions/matter/) smart home ecosystem.

</div>

Tado is a trademark of [tado GmbH](https://www.tado.com/).

## Installation
1. Open the Matterbridge web interface, e.g. at http://localhost:8283/.
1. Under *Install plugins* type `matterbridge-tado-hw` in the *Plugin name or plugin path* search box, and click *Install ⬇️*.
1. The Matterbridge log output will include an authorisation URL. Copy the listed URL into a web browser, login to your tado° account, and approve access.

<details>
<summary>Command Line Installation</summary>

### Installation using Command Line
1. Stop Matterbridge:  
   `sudo systemctl stop matterbridge`
1. Install the plugin:  
   `npm install -g matterbridge-tado-hw`
1. Register it with Matterbridge:  
   `sudo -u matterbridge matterbridge -add matterbridge-tado-hw`
1. Restart Matterbridge:  
   `sudo systemctl start matterbridge`
1. The Matterbridge log output will include an authorisation URL. Copy the listed URL into a web browser, login to your tado° account, and approve access.

#### Example `matterbridge-tado-hw.config.json`

```JSON
{
    "name":                 "matterbridge-tado-hw",
    "type":                 "DynamicPlatform",
    "pollInterval":         300,
    "blackList":            [],
    "whiteList":            [],
    "debug":                false,
    "unregisterOnShutdown": false
}
```

</details>
<details>
<summary>Advanced Configuration Options</summary>

### Advanced Configuration

You can include additional settings in `matterbridge-tado-hw.config.json` to customise the behaviour or enable special debug features:

| Key                     | Default            | Description
| ----------------------- | ------------------ | ---
| `name`<br>`type`<br>`version` | n/a          | These are managed by Matterbridge and do not need to be set manually.
| `pollInterval`          | 1200               | Specifies the interval in seconds between polling the tado° API for the hot water zone status.
| `blackList`             | `[]`               | If the list is not empty, then any hot water control devices with matching serial numbers will not be exposed as Matter devices.
| `whiteList`             | `[]`               | If the list is not empty, then only hot water control devices with matching serial numbers (and not on the `blacklist`) will be exposed as Matter devices.
| `debug`                 | `false`            | Sets the logger level for this plugin to *Debug*, overriding the global Matterbridge logger level setting.
| `unregisterOnShutdown`  | `false`            | Unregister all exposed devices on shutdown. This is used during development and testing; do not set it for normal use.

Tado° apply daily usage limits to third-party use of their REST API. The default value for `pollInterval` issues one request per hot water controller every 20 minutes, resulting in 72 requests/day. Users with active Auto-Assist subscriptions may prefer to use a shorter interval.

| Auto-Assist Subscription | Requests/Day |
| :----------------------: | -----------: |
| ❌                        | 100          |
| ✅                        | 20,000       |

</details>

## Functionality

The plugin exposes hot water control of tado° V2/V3/V3+ Extension Kit (BU01) or Wireless Receiver (EK01) units as Matter On/Off Switches. Other functionality is natively exposed to HomeKit by the tado° devices, so is not duplicated by this plugin.

Tado° X is not supported.

## Changelog

All notable changes to this project are documented in [`CHANGELOG.md`](CHANGELOG.md).

## Reporting Issues
          
If you have discovered an issue or have an idea for how to improve this project, please [open a new issue](https://github.com/thoukydides/matterbridge-tado-hw/issues/new/choose) using the appropriate issue template.

### Pull Requests

As explained in [`CONTRIBUTING.md`](https://github.com/thoukydides/.github/blob/master/CONTRIBUTING.md), this project does **NOT** accept pull requests. Any PRs submitted will be closed without discussion.

## ISC License (ISC)

<details>
<summary>Copyright © 2025 Alexander Thoukydides</summary>

> Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
>
> THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
</details>
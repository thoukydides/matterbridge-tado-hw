<p align="center">
  <img src="https://raw.githubusercontent.com/wiki/thoukydides/matterbridge-tado-hw/matterbridge-tado-hw.png" height="200">
</p>
<div align=center>

# matterbridge-tado-hw

[![npm](https://badgen.net/npm/v/matterbridge-tado-hw)](https://www.npmjs.com/package/matterbridge-tado-hw)
[![npm](https://badgen.net/npm/dt/matterbridge-tado-hw)](https://www.npmjs.com/package/matterbridge-tado-hw)
[![npm](https://badgen.net/npm/dw/matterbridge-tado-hw)](https://www.npmjs.com/package/matterbridge-tado-hw)
[![Build and Lint](https://github.com/thoukydides/matterbridge-tado-hw/actions/workflows/build.yml/badge.svg)](https://github.com/thoukydides/matterbridge-tado-hw/actions/workflows/build.yml)

Tado° V2/V3/V3+ hot water control plugin for [Matterbridge](https://github.com/Luligu/matterbridge).

</div>

Tado is a trademark of [tado GmbH](https://www.tado.com/).

## Installation

#### Recommended Approach using Matterbridge Frontend

1. Open the Matterbridge web interface, e.g. at http://localhost:8283/.
1. Under *Install plugins* type `matterbridge-tado-hw` in the *Plugin name or plugin path* search box, and click *Install ⬇️*.
1. The Matterbridge log output will include an authorisation URL. Copy the listed URL into a web browser, login to your tado° account, and approve access.

<details>
<summary>Alternative method using command line (and advanced configuration)</summary>

#### Installation using Command Line

1. Stop Matterbridge:  
   `systemctl stop matterbridge`
1. Install the plugin:  
   `npm install -g matterbridge-tado-hw`
1. Register it with Matterbridge:  
   `matterbridge -add matterbridge-tado-hw`
1. Restart Matterbridge:  
   `systemctl start matterbridge`
1. The Matterbridge log output will include an authorisation URL. Copy the listed URL into a web browser, login to your tado° account, and approve access.

#### Example `matterbridge-tado-hw.config.json`
```JSON
{
    "name": "matterbridge-tado-hw",
    "type": "DynamicPlatform"
}
```
The configuration file will be generated automatically with appropriate defaults.

#### Advanced Configuration

You can include additional settings in `config.json` to customise the behaviour or enable special debug features:
```JSON
{
    "name": "matterbridge-tado-hw",
    "type": "DynamicPlatform",
    "pollInterval": 300,
    "debug": false,
    "unregisterOnShutdown": false
}
```

`pollInterval` specifies the interval in seconds between polling the tado° API for the hot water zone status. The default is `300` seconds (5 minutes).

`debug` enables additional logging which may help with debugging any problems.

</details>

## Functionality

The plugin exposes hot water control of tado° V2/V3/V3+ Extension Kit (BU01) or Wireless Receiver (EK01) units as Matter On/Off Switches. Other functions (such as setting hot water temperature) are not supported.

Tado° X is not supported.

## Changelog

All notable changes to this project are documented in the [CHANGELOG.md](CHANGELOG.md) file.

## Reporting Issues
          
If you have discovered an issue or have an idea for how to improve this project, please [open a new issue](https://github.com/thoukydides/matterbridge-tado-hw/issues/new/choose) using the appropriate issue template.

### Pull Requests

This project does **NOT** accept pull requests. Any PRs submitted will be closed without discussion. For more details refer to the [`CONTRIBUTING.md`](https://github.com/thoukydides/.github/blob/master/CONTRIBUTING.md) file.

## ISC License (ISC)

<details>
<summary>Copyright © 2025 Alexander Thoukydides</summary>

> Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
>
> THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
</details>
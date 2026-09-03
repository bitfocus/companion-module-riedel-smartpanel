# companion-module-riedel-smartpanel

Bitfocus Companion module for controlling Riedel Smart Panels via WebSocket.

## Features

### Actions

- **Network Configuration**: Set IP addresses for Media1, Config1, and Media2 interfaces
- **Device Control**: Reboot device, fetch device info
- **Health & Alarms**: Monitor health status, active alarms, and alarm history
- **PTP (Precision Time Protocol)**: View and configure PTP settings (domain, hybrid mode, receiver-only mode)
- **Control Panel**: Enable/disable/toggle the Control Panel Application (intercom functionality)
- **NMOS**: Enable/disable/toggle NMOS functionality
- **Identify**: Enable/disable/toggle the panel's identify LEDs, or flash them a specific number of times (locate the physical panel)
- **Identify (Custom IP)**: Same enable/disable/flash actions, but targeting an IP given per action call (supports Companion variables) instead of this connection's configured panel - see [Targeting Multiple Panels](#targeting-multiple-panels-without-a-dedicated-connection) below

### Feedbacks

- **Connection Status**: Visual indicator for WebSocket connection state
- **Health Status**: Color-coded health indicator (OK/Warnings/Errors)
- **Alarm Count**: Threshold-based alarm monitoring with customizable colors
- **PTP Status**: PTP synchronization status (Locked/Unlocked)
- **Control Panel Enabled**: Shows if Control Panel app is active
- **NMOS Enabled**: Shows if NMOS is active
- **Identify Enabled**: Shows if the panel's identify LEDs are active

### Variables

| Variable                | Description                          |
| ----------------------- | ------------------------------------ |
| `connection_status`     | Current connection state             |
| `media1_ip`             | Media1 interface IP address          |
| `config1_ip`            | Config1 interface IP address         |
| `media2_ip`             | Media2 interface IP address          |
| `device_name`           | Device name                          |
| `firmware_version`      | Firmware version                     |
| `mac_address`           | MAC address                          |
| `health_status`         | Current health status                |
| `alarm_count`           | Number of active alarms              |
| `ptp_status`            | PTP synchronization status           |
| `ptp_master`            | PTP time transmitter (master clock)  |
| `ptp_domain`            | PTP domain                           |
| `ptp_hybrid_mode`       | PTP hybrid mode state                |
| `ptp_receiver_only`     | PTP receiver-only mode state         |
| `control_panel_enabled` | Control Panel app state              |
| `nmos_enabled`          | NMOS state                           |
| `nmos_status`           | NMOS status                          |
| `identify_status`       | Identify LED state (Active/Inactive) |

### Presets

42 pre-configured button presets across 10 categories:

- **Status Display**: Connection, health, alarms, PTP status
- **Network Status**: Interface IP addresses
- **Device Info**: Name, firmware, MAC address
- **Actions**: Refresh buttons for all status types
- **Control Panel**: Enable/disable/toggle buttons
- **NMOS**: Enable/disable/toggle buttons
- **PTP**: Refresh and domain selection (0-7)
- **Device Control**: Reboot button
- **Identify**: Status/toggle, enable, disable, and a "Flash x2" button
- **Key Control**: Toggle mute on keys (1–32) for Master and Expansion panels
- **Alert Indicators**: Health errors, active alarms, PTP unlocked, disconnected alerts

## Configuration

| Setting          | Description                   | Default |
| ---------------- | ----------------------------- | ------- |
| Panel IP Address | IP address of the Smart Panel | -       |
| WebSocket Port   | WebSocket port (usually 80)   | 80      |

## Network Interfaces

The Smart Panel has three network interfaces:

- **Media1**: Primary media network interface
- **Config1**: Configuration interface
- **Media2**: Secondary media interface

See also [companion/HELP.md](./companion/HELP.md) for full action and feedback details.

## Targeting Multiple Panels Without a Dedicated Connection

Every action in this module except the `*IdentifyAtIp` ones runs against the single panel
configured on the Companion connection (`Panel IP Address` in the connection's config) over
a persistent WebSocket - that's what keeps feedbacks, variables, and health/PTP/alarm polling
live for that one device. If you have many panels and only want live status for a few of them,
adding one Companion connection per panel is the correct, intended way to get that (it's how
Companion is designed to model "one device, one connection").

For a narrower case - flashing/locating an arbitrary panel's identify LEDs without wanting a
dedicated persistent connection, live feedbacks, or status polling for every single panel on the
network - use `Enable Identify (Custom IP)`, `Disable Identify (Custom IP)`, or
`Flash Identify (Custom IP)`. These take the target IP as a per-action option instead of the
connection's configured host, so **one Companion connection can flash any panel by IP**. Each
call opens a short-lived WebSocket directly to that IP, sends the identify command(s), and
closes it - it does not touch or depend on the connection's main WebSocket.

The IP field supports Companion variable syntax, so it can be driven dynamically, e.g. from a
custom variable set elsewhere in your Companion configuration:

```
$(internal:custom_target_panel_ip)
```

Trade-off: because there's no persistent connection to an arbitrary IP, there are no live
feedbacks/variables for it - the module can't show you that panel's health, PTP lock, or
connection state without its own dedicated connection. `*IdentifyAtIp` is fire-and-forget by
design.

## Development

### Building from source

```bash
# Install dependencies
yarn install

# Build TypeScript
yarn build

# Watch for changes during development
yarn dev
```

### Project Structure

```
companion-module-riedel-smartpanel/
├── src/
│   ├── main.ts       # Main module class
│   ├── config.ts     # Configuration fields
│   ├── actions.ts    # Action definitions
│   ├── feedbacks.ts  # Feedback definitions
│   ├── presets.ts    # Preset definitions
│   └── variables.ts  # Variable definitions
├── dist/             # Compiled JavaScript output
├── companion/
│   └── manifest.json # Module manifest
├── package.json
├── tsconfig.json
└── README.md
```

## API Reference

This module communicates with the Smart Panel via WebSocket at `ws://<host>:<port>/websocket`.

### Message Format

```json
{
	"topic": "/Path/To/Endpoint",
	"body": {}
}
```

### Supported Topics

<<<<<<< HEAD
| Topic | Description |
| ---------------------------------------- | ---------------------------- |
| `/NetworkStatus/FetchNetworkStatus` | Get network interface status |
| `/NetworkSettings/FetchNetworkSettings` | Get network settings |
| `/NetworkSettings/UpdateNetworkSettings` | Update network settings |
| `/DeviceInfo/FetchDeviceInfo` | Get device information |
| `/DeviceSettings/FetchDeviceSettings` | Get device settings |
| `/FirmwareUpdater/FetchFirmwareVersion` | Get firmware information |
| `/Reboot/RebootDevice` | Reboot the device |
| `/StatusInfo/FetchHealthStatus` | Get health status |
| `/StatusInfo/FetchAlarmList` | Get active alarms |
| `/StatusInfo/FetchAlarmHistory` | Get alarm history |
| `/Ptp/FetchPtpStatus` | Get PTP status |
| `/Ptp/FetchPtpSettings` | Get PTP settings |
| `/Ptp/UpdatePtpSettings` | Update PTP settings |
| `/ControlPanelApp/FetchConfig` | Get Control Panel state |
| `/ControlPanelApp/Enable` | Enable Control Panel |
| `/ControlPanelApp/Disable` | Disable Control Panel |
| `/Nmos/FetchStatus` | Get NMOS status |
| `/Nmos/Enable` | Enable NMOS |
| `/Nmos/Disable` | Disable NMOS |
| `/Identify/FetchStatus` | Get identify LED state |
| `/Identify/Enable` | Turn on identify LEDs |
| `/Identify/Disable` | Turn off identify LEDs |

`/Identify` has no built-in flash-count or duration parameter - it's a bare on/off latch,
and each `Enable`/`Disable` message is itself one visible flash of the panel's key LEDs
(sending `Enable` does not start a sustained blink that `Disable` then stops). The
`flashIdentify` action reproduces a specific flash count by alternating the latch with a
configurable interval between edges.
=======
The list of topics the module will send via WebSocket, this doesn't cover the different Response and Changed reply topics that are supported too.

| Topic                                           | Description                                             |
| ----------------------------------------------- | ------------------------------------------------------- |
| `/NetworkStatus/FetchNetworkStatus`             | Get network interface status                            |
| `/NetworkStatus/FetchNetworkLinkStatus`         | Get network link status                                 |
| `/NetworkSettings/FetchNetworkSettings`         | Get network settings                                    |
| `/NetworkSettings/UpdateNetworkSettings`        | Update network settings                                 |
| `/MediaPortAssignment/FetchMediaPortAssignment` | Get media port assignment (physical network interfaces) |
| `/DeviceInfo/FetchDeviceInfo`                   | Get device information                                  |
| `/DeviceSettings/FetchDeviceSettings`           | Get device settings                                     |
| `/FirmwareUpdater/FetchFirmwareVersion`         | Get firmware information                                |
| `/Reboot/RebootDevice`                          | Reboot the device                                       |
| `/Identify/FetchStatus`                         | Get device identify status                              |
| `/Identify/Enable`                              | Enable device identify                                  |
| `/Identify/Disable`                             | Disable device identify                                 |
| `/StatusInfo/FetchHealthStatus`                 | Get health status                                       |
| `/StatusInfo/FetchAlarmList`                    | Get active alarms                                       |
| `/StatusInfo/FetchAlarmHistory`                 | Get alarm history                                       |
| `/Intercom/FetchArtistName`                     | Get Artist intercom name                                |
| `/Intercom/FetchArtistConnectionStatus`         | Get Artist intercom connection status                   |
| `/Ptp/FetchPtpStatus`                           | Get PTP status                                          |
| `/Ptp/FetchPtpSettings`                         | Get PTP settings                                        |
| `/Ptp/UpdatePtpSettings`                        | Update PTP settings                                     |
| `/ControlPanelApp/FetchConfig`                  | Get Control Panel state                                 |
| `/ControlPanelApp/Enable`                       | Enable Control Panel                                    |
| `/ControlPanelApp/Disable`                      | Disable Control Panel                                   |
| `/Nmos/FetchStatus`                             | Get NMOS status                                         |
| `/Nmos/Enable`                                  | Enable NMOS                                             |
| `/Nmos/Disable`                                 | Disable NMOS                                            |

> > > > > > > pr-15

## Compatibility

- Companion v3.0 and later
- Riedel Smart Panel (firmware v2.0.0 or higher recommended)

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

For bugs and feature requests, please open an issue on GitHub.

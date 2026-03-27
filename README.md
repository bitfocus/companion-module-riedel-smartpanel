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

### Feedbacks

- **Connection Status**: Visual indicator for WebSocket connection state
- **Health Status**: Color-coded health indicator (OK/Warnings/Errors)
- **Alarm Count**: Threshold-based alarm monitoring with customizable colors
- **PTP Status**: PTP synchronization status (Locked/Unlocked)
- **Control Panel Enabled**: Shows if Control Panel app is active
- **NMOS Enabled**: Shows if NMOS is active

### Variables

| Variable                | Description                         |
| ----------------------- | ----------------------------------- |
| `connection_status`     | Current connection state            |
| `media1_ip`             | Media1 interface IP address         |
| `config1_ip`            | Config1 interface IP address        |
| `media2_ip`             | Media2 interface IP address         |
| `device_name`           | Device name                         |
| `firmware_version`      | Firmware version                    |
| `mac_address`           | MAC address                         |
| `health_status`         | Current health status               |
| `alarm_count`           | Number of active alarms             |
| `ptp_status`            | PTP synchronization status          |
| `ptp_master`            | PTP time transmitter (master clock) |
| `ptp_domain`            | PTP domain                          |
| `ptp_hybrid_mode`       | PTP hybrid mode state               |
| `ptp_receiver_only`     | PTP receiver-only mode state        |
| `control_panel_enabled` | Control Panel app state             |
| `nmos_enabled`          | NMOS state                          |
| `nmos_status`           | NMOS status                         |

### Presets

38 pre-configured button presets across 9 categories:

- **Status Display**: Connection, health, alarms, PTP status
- **Network Status**: Interface IP addresses
- **Device Info**: Name, firmware, MAC address
- **Actions**: Refresh buttons for all status types
- **Control Panel**: Enable/disable/toggle buttons
- **NMOS**: Enable/disable/toggle buttons
- **PTP**: Refresh and domain selection (0-7)
- **Device Control**: Reboot button
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

| Topic                                    | Description                  |
| ---------------------------------------- | ---------------------------- |
| `/NetworkStatus/FetchNetworkStatus`      | Get network interface status |
| `/NetworkSettings/FetchNetworkSettings`  | Get network settings         |
| `/NetworkSettings/UpdateNetworkSettings` | Update network settings      |
| `/DeviceInfo/FetchDeviceInfo`            | Get device information       |
| `/Reboot/RebootDevice`                   | Reboot the device            |
| `/StatusInfo/FetchHealthStatus`          | Get health status            |
| `/StatusInfo/FetchAlarmList`             | Get active alarms            |
| `/StatusInfo/FetchAlarmHistory`          | Get alarm history            |
| `/Ptp/FetchPtpStatus`                    | Get PTP status               |
| `/Ptp/FetchPtpSettings`                  | Get PTP settings             |
| `/Ptp/UpdatePtpSettings`                 | Update PTP settings          |
| `/ControlPanelApp/FetchConfig`           | Get Control Panel state      |
| `/ControlPanelApp/Enable`                | Enable Control Panel         |
| `/ControlPanelApp/Disable`               | Disable Control Panel        |
| `/Nmos/FetchStatus`                      | Get NMOS status              |
| `/Nmos/Enable`                           | Enable NMOS                  |
| `/Nmos/Disable`                          | Disable NMOS                 |

## Compatibility

- Companion v3.0 and later
- Riedel Smart Panel (firmware v2.0.0 or higher recommended)

## License

MIT License - see LICENSE file for details.

## Support

For bugs and feature requests, please open an issue on GitHub.

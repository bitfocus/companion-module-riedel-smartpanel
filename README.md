# companion-module-riedel-smartpanel

Bitfocus Companion module for controlling Riedel Smart Panels via WebSocket.

## Features

Please see [companion/HELP.md](./companion/HELP.md) for details of features

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

## Compatibility

- Companion v3.0 and later
- Riedel Smart Panel (firmware v2.0.0 or higher recommended)

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

For bugs and feature requests, please open an issue on GitHub.

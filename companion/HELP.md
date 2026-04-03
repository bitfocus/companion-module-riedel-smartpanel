# Riedel Smart Panel Companion Module

This module allows you to control Riedel Smart Panels from Bitfocus Companion.

This module has been tested with RSP-1216HL and RSP-1232HL but should work with the desktop panels too.

## Requirements

**Minimum Firmware Version**: 2.0.0 or higher

This module requires the panel to be running firmware version 2.0.0 or later. Earlier firmware versions may not support the WebSocket API used by this module.

## Configuration

### Connection Settings

## Configuration

| Setting          | Description                                              | Default |
| ---------------- | -------------------------------------------------------- | ------- |
| Device           | Devices discovered automatically via Bonjour (or Manual) | -       |
| Panel IP Address | IP address of the Smart Panel (e.g., 192.168.0.1)        | -       |
| WebSocket Port   | WebSocket port (usually 80)                              | 80      |

## Supported Actions

### Network Configuration

- **Set IP Address**: Change the IP address of a network interface
  - Interface: Config1, Media1, or Media2
  - IP Address: New IP address
  - Subnet Mask: Network mask
  - Gateway: Default gateway
  - DHCP: Enable/disable DHCP

### Device Control

- **Reboot Device**: Restart the panel
- **Identify Device**: Identify the panel

### Device Health & Information

- **Fetch Device Info**: Get device information
- **Fetch Network Status**: Get current network status
- **Health & Alarms**: Monitor health status, active alarms, and alarm history

### Application Control

- **PTP (Precision Time Protocol)**: View and configure PTP settings (domain, hybrid mode, receiver-only mode)
- **Control Panel**: Enable/disable/toggle the Control Panel Application (intercom functionality)
- **NMOS**: Enable/disable/toggle NMOS functionality

## Feedbacks

- **Connection Status**: Visual indicator for WebSocket connection state (to Companion)
- **Link Status**: Shows if a particular network link is up
- **Artist Connection Status**: Shows if the panel is connected to an Artist system
- **Health Status**: Color-coded health indicator (OK/Warnings/Errors)
- **Alarm Count**: Threshold-based alarm monitoring with customizable colors
- **PTP Status**: PTP synchronization status (Locked/Unlocked)
- **Control Panel Enabled**: Shows if Control Panel app is active
- **NMOS Enabled**: Shows if NMOS is active

## Presets

38+ pre-configured button presets across 9+ categories:

- **Status Display**: Connection, health, alarms, PTP status
- **Network Status**: Interface IP addresses
- **Device Info**: Name, firmware, MAC address
- **Actions**: Refresh buttons for all status types
- **Control Panel**: Enable/disable/toggle buttons
- **NMOS**: Enable/disable/toggle buttons
- **PTP**: Refresh and domain selection (0-7)
- **Device Control**: Reboot button
- **Alert Indicators**: Health errors, active alarms, PTP unlocked, disconnected alerts

## Variables

| Variable                   | Description                             |
| -------------------------- | --------------------------------------- |
| `connection_status`        | Current connection state (to Companion) |
| `media1_ip`                | Media1 interface IP address             |
| `config1_ip`               | Config1 interface IP address            |
| `media2_ip`                | Media2 interface IP address             |
| `media1_mac_address`       | Media1 interface MAC address            |
| `config1_mac_address`      | Config1 interface MAC address           |
| `media2_mac_address`       | Media2 interface MAC address            |
| `expansion1_mac_address`   | expansion1 interface MAC address        |
| `media1_link_status`       | Media1 interface link status            |
| `config1_link_status`      | Config1 interface link status           |
| `media2_link_status`       | Media2 interface link status            |
| `expansion1_link_status`   | expansion1 interface link status        |
| `device_name`              | Device name                             |
| `firmware_version`         | Firmware version                        |
| `headset_a_connector_type` | Headset A connector type                |
| `headset_b_connector_type` | Headset B connector type                |
| `panel_type`               | Panel type                              |
| `serial_number`            | Serial number                           |
| `mac_address`              | MAC address                             |
| `health_status`            | Current health status                   |
| `alarm_count`              | Number of active alarms                 |
| `ptp_status`               | PTP synchronization status              |
| `ptp_master`               | PTP time transmitter (master clock)     |
| `ptp_domain`               | PTP domain                              |
| `ptp_hybrid_mode`          | PTP hybrid mode state                   |
| `ptp_receiver_only`        | PTP receiver-only mode state            |
| `control_panel_enabled`    | Control Panel app state                 |
| `nmos_enabled`             | NMOS state                              |
| `nmos_status`              | NMOS status                             |

## Network Interfaces

The Smart Panel has three network interfaces:

- **Media1**: Main network interface (typically for control/media)
- **Config1**: Configuration network interface
- **Media2**: Secondary media network interface

## Troubleshooting

### Cannot Connect

1. Verify the IP address is correct
2. Ensure the panel is powered on and accessible on the network
3. Check that no firewall is blocking WebSocket connections
4. Try pinging the device first

### Changes Don't Take Effect

- Some settings may require a device reboot
- Wait a few seconds after sending commands
- Check the connection status in Companion

## Support

For issues or feature requests, please visit:
https://github.com/bitfocus/companion-module-riedel-smartpanel/issues

import { SomeCompanionConfigField } from '@companion-module/base'

export interface DeviceConfig {
	host: string
	port: number
	// Populated by the 'bonjour-device' picker as "ip:port" when a discovered
	// panel is selected, or null when the user chooses Manual entry.
	bonjour_host?: string | null
}

export function getConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module controls Riedel Smart Panels via WebSocket.',
		},
		{
			type: 'bonjour-device',
			id: 'bonjour_host',
			label: 'Panel (auto-discovered)',
			width: 12,
		},
		{
			type: 'static-text',
			id: 'bonjour_info',
			width: 12,
			label: '',
			value: 'Enter the panel IP address and port below, or select a discovered panel above.',
			// Shown only when no discovered panel is selected (i.e. manual entry).
			isVisible: (options) => !options['bonjour_host'],
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Panel IP Address',
			width: 8,
			default: '',
			regex: '/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/',
			isVisible: (options) => !options['bonjour_host'],
		},
		{
			type: 'number',
			id: 'port',
			label: 'WebSocket Port',
			width: 4,
			default: 80,
			min: 1,
			max: 65535,
			isVisible: (options) => !options['bonjour_host'],
		},
	]
}

import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface DeviceConfig {
	bonjourHost?: string
	host?: string
	port?: number
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
			id: 'bonjourHost',
			label: 'Device',
			width: 8,
		},
		{
			type: 'static-text',
			id: 'bonjourHost-filler',
			width: 8,
			label: '',
			value: '',
			isVisible: (options) => !!options['bonjourHost'],
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Panel IP Address',
			width: 8,
			default: '',
			regex: Regex.IP,
			isVisible: (options) => !options['bonjourHost'],
		},
		{
			type: 'number',
			id: 'port',
			label: 'WebSocket Port',
			width: 4,
			default: 80,
			min: 1,
			max: 65535,
			isVisible: (options) => !options['bonjourHost'],
		},
	]
}

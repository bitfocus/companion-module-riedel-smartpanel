import { CompanionFeedbackDefinitions } from '@companion-module/base'
import type { RiedelRSP1232HLInstance } from './main.js'

export function getFeedbacks(instance: RiedelRSP1232HLInstance): CompanionFeedbackDefinitions {
	return {
		connectionStatus: {
			type: 'boolean',
			name: 'Connection Status',
			description: 'Change button style based on WebSocket connection status',
			defaultStyle: {
				color: 0xffffff,
				bgcolor: 0x00ff00,
			},
			options: [
				{
					type: 'checkbox',
					label: 'Show text on button',
					id: 'showText',
					default: false,
				},
			],
			callback: (feedback) => {
				const connected = instance.isConnected()
				if (feedback.options.showText) {
					return connected
				}
				return connected
			},
		},
		interfaceIp: {
			type: 'advanced',
			name: 'Interface IP Address',
			description: 'Display current IP address of a network interface',
			options: [
				{
					type: 'dropdown',
					label: 'Interface',
					id: 'interface',
					default: 'Media1',
					choices: [
						{ id: 'Config1', label: 'Config1' },
						{ id: 'Media1', label: 'Media1' },
						{ id: 'Media2', label: 'Media2' },
					],
				},
				{
					type: 'checkbox',
					label: 'Show interface name',
					id: 'showName',
					default: true,
				},
				{
					type: 'colorpicker',
					label: 'Background Color',
					id: 'bgcolor',
					default: 0x000000,
				},
				{
					type: 'colorpicker',
					label: 'Text Color',
					id: 'color',
					default: 0xffffff,
				},
			],
			callback: (feedback) => {
				const interfaceId = feedback.options.interface as string
				const ip = instance.getInterfaceIp(interfaceId)
				const showName = feedback.options.showName as boolean
				const text = showName ? `${interfaceId}\\n${ip || 'Unknown'}` : ip || 'Unknown'
				return {
					text: text,
					color: feedback.options.color as number,
					bgcolor: feedback.options.bgcolor as number,
				}
			},
		},
		healthStatus: {
			type: 'boolean',
			name: 'Health Status',
			description: 'Change button style based on device health (OK, Warnings, Errors)',
			defaultStyle: {
				color: 0xffffff,
				bgcolor: 0x00ff00,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Trigger when health is',
					id: 'status',
					default: 'OK',
					choices: [
						{ id: 'OK', label: 'OK (Healthy)' },
						{ id: 'Warnings', label: 'Warnings' },
						{ id: 'Errors', label: 'Errors' },
						{ id: 'notOK', label: 'Not OK (Warnings or Errors)' },
					],
				},
				{
					type: 'checkbox',
					label: 'Show status text',
					id: 'showText',
					default: false,
				},
			],
			callback: (feedback) => {
				const health = instance.getHealthStatus()
				const targetStatus = feedback.options.status as string
				let match = false
				if (targetStatus === 'notOK') {
					match = health === 'Warnings' || health === 'Errors'
				} else {
					match = health === targetStatus
				}
				return match
			},
		},
		healthStatusDisplay: {
			type: 'advanced',
			name: 'Health Status Display',
			description: 'Display health status with automatic color coding',
			options: [
				{
					type: 'colorpicker',
					label: 'OK Color',
					id: 'okColor',
					default: 0x00ff00,
				},
				{
					type: 'colorpicker',
					label: 'Warning Color',
					id: 'warningColor',
					default: 0xffaa00,
				},
				{
					type: 'colorpicker',
					label: 'Error Color',
					id: 'errorColor',
					default: 0xff0000,
				},
				{
					type: 'colorpicker',
					label: 'Unknown Color',
					id: 'unknownColor',
					default: 0x888888,
				},
				{
					type: 'colorpicker',
					label: 'Text Color',
					id: 'textColor',
					default: 0xffffff,
				},
			],
			callback: (feedback) => {
				const health = instance.getHealthStatus()
				let bgcolor = feedback.options.unknownColor as number
				if (health === 'OK') {
					bgcolor = feedback.options.okColor as number
				} else if (health === 'Warnings') {
					bgcolor = feedback.options.warningColor as number
				} else if (health === 'Errors') {
					bgcolor = feedback.options.errorColor as number
				}
				return {
					text: health || 'Unknown',
					color: feedback.options.textColor as number,
					bgcolor: bgcolor,
				}
			},
		},
		alarmCount: {
			type: 'boolean',
			name: 'Alarm Count Threshold',
			description: 'Trigger when alarm count meets threshold',
			defaultStyle: {
				color: 0xffffff,
				bgcolor: 0xff0000,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Condition',
					id: 'condition',
					default: 'gt',
					choices: [
						{ id: 'gt', label: 'Greater than' },
						{ id: 'gte', label: 'Greater than or equal' },
						{ id: 'eq', label: 'Equal to' },
						{ id: 'lt', label: 'Less than' },
						{ id: 'lte', label: 'Less than or equal' },
					],
				},
				{
					type: 'number',
					label: 'Threshold',
					id: 'threshold',
					default: 0,
					min: 0,
					max: 100,
				},
				{
					type: 'checkbox',
					label: 'Show count on button',
					id: 'showCount',
					default: false,
				},
			],
			callback: (feedback) => {
				const count = instance.getAlarmCount()
				const threshold = feedback.options.threshold as number
				const condition = feedback.options.condition as string
				let match = false
				switch (condition) {
					case 'gt':
						match = count > threshold
						break
					case 'gte':
						match = count >= threshold
						break
					case 'eq':
						match = count === threshold
						break
					case 'lt':
						match = count < threshold
						break
					case 'lte':
						match = count <= threshold
						break
				}
				return match
			},
		},
		alarmCountDisplay: {
			type: 'advanced',
			name: 'Alarm Count Display',
			description: 'Display alarm count with customizable colors',
			options: [
				{
					type: 'colorpicker',
					label: 'No Alarms Color',
					id: 'noAlarmColor',
					default: 0x00ff00,
				},
				{
					type: 'colorpicker',
					label: 'Has Alarms Color',
					id: 'hasAlarmColor',
					default: 0xff0000,
				},
				{
					type: 'colorpicker',
					label: 'Text Color',
					id: 'textColor',
					default: 0xffffff,
				},
				{
					type: 'textinput',
					label: 'Text Format (use {count})',
					id: 'format',
					default: 'Alarms\\n{count}',
				},
			],
			callback: (feedback) => {
				const count = instance.getAlarmCount()
				const bgcolor =
					count > 0 ? (feedback.options.hasAlarmColor as number) : (feedback.options.noAlarmColor as number)
				const text = (feedback.options.format as string).replace('{count}', String(count))
				return {
					text: text,
					color: feedback.options.textColor as number,
					bgcolor: bgcolor,
				}
			},
		},
		ptpStatus: {
			type: 'boolean',
			name: 'PTP Sync Status',
			description: 'Trigger when PTP is in specific state',
			defaultStyle: {
				color: 0xffffff,
				bgcolor: 0x00ff00,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Trigger when PTP is',
					id: 'status',
					default: 'TimeReceiverLocked',
					choices: [
						{ id: 'TimeReceiverLocked', label: 'Locked (Synchronized)' },
						{ id: 'TimeReceiverUnlocked', label: 'Unlocked' },
						{ id: 'notLocked', label: 'Not Locked (any unlocked state)' },
					],
				},
				{
					type: 'checkbox',
					label: 'Show status text',
					id: 'showText',
					default: false,
				},
			],
			callback: (feedback) => {
				const status = instance.getPtpStatus()
				const targetStatus = feedback.options.status as string
				let match = false
				if (targetStatus === 'notLocked') {
					match = status !== 'TimeReceiverLocked'
				} else {
					match = status === targetStatus
				}
				return match
			},
		},
		ptpStatusDisplay: {
			type: 'advanced',
			name: 'PTP Status Display',
			description: 'Display PTP status with customizable colors',
			options: [
				{
					type: 'colorpicker',
					label: 'Locked Color',
					id: 'lockedColor',
					default: 0x00ff00,
				},
				{
					type: 'colorpicker',
					label: 'Unlocked Color',
					id: 'unlockedColor',
					default: 0xffaa00,
				},
				{
					type: 'colorpicker',
					label: 'Unknown Color',
					id: 'unknownColor',
					default: 0x888888,
				},
				{
					type: 'colorpicker',
					label: 'Text Color',
					id: 'textColor',
					default: 0xffffff,
				},
				{
					type: 'checkbox',
					label: 'Short text',
					id: 'shortText',
					default: true,
				},
			],
			callback: (feedback) => {
				const status = instance.getPtpStatus()
				let bgcolor = feedback.options.unknownColor as number
				let text = status || 'Unknown'
				if (status === 'TimeReceiverLocked') {
					bgcolor = feedback.options.lockedColor as number
					text = (feedback.options.shortText as boolean) ? 'PTP\\nLocked' : 'TimeReceiverLocked'
				} else if (status && status !== 'Unknown') {
					bgcolor = feedback.options.unlockedColor as number
					text = (feedback.options.shortText as boolean) ? 'PTP\\nUnlocked' : status
				}
				return {
					text: text,
					color: feedback.options.textColor as number,
					bgcolor: bgcolor,
				}
			},
		},
		controlPanelEnabled: {
			type: 'boolean',
			name: 'Control Panel Enabled',
			description: 'Trigger when control panel app is enabled/disabled',
			defaultStyle: {
				color: 0xffffff,
				bgcolor: 0x00ff00,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Trigger when',
					id: 'state',
					default: 'enabled',
					choices: [
						{ id: 'enabled', label: 'Enabled' },
						{ id: 'disabled', label: 'Disabled' },
					],
				},
			],
			callback: (feedback) => {
				const enabled = instance.getControlPanelEnabled()
				return feedback.options.state === 'enabled' ? enabled : !enabled
			},
		},
		nmosEnabled: {
			type: 'boolean',
			name: 'NMOS Enabled',
			description: 'Trigger when NMOS is enabled/disabled',
			defaultStyle: {
				color: 0xffffff,
				bgcolor: 0x00ff00,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Trigger when',
					id: 'state',
					default: 'enabled',
					choices: [
						{ id: 'enabled', label: 'Enabled' },
						{ id: 'disabled', label: 'Disabled' },
					],
				},
			],
			callback: (feedback) => {
				const enabled = instance.getNmosEnabled()
				return feedback.options.state === 'enabled' ? enabled : !enabled
			},
		},
	}
}

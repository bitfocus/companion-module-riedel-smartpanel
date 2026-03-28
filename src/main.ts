import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { getConfigFields, DeviceConfig } from './config.js'
import { getActions } from './actions.js'
import { getFeedbacks } from './feedbacks.js'
import { getPresets } from './presets.js'
import { getVariableDefinitions, getDefaultVariableValues } from './variables.js'
import WebSocket from 'ws'

interface NetworkSettings {
	networkInterfaceSettings: Array<{
		interfaceId: string
		dhcpActive: boolean
		ipv4Settings: {
			ipAddress: string
			networkMaskConverted: string
			defaultGateway: string
			prefixLength: number
		}
	}>
}

interface WebSocketMessage {
	topic: string
	body: Record<string, unknown>
}

export class RiedelRSP1232HLInstance extends InstanceBase<DeviceConfig> {
	private ws: WebSocket | null = null
	public config: DeviceConfig = { host: '', port: 80 }
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null
	private interfaceIps: Map<string, string> = new Map()
	private interfaceLinkStatuses: Map<string, string> = new Map()
	private networkSettings: NetworkSettings | null = null
	public identifyEnabled = false
	public artistConnectionStatus = 'Unknown'
	public healthStatus = 'Unknown'
	private alarmList: unknown[] = []
	private alarmHistory: unknown[] = []
	public ptpStatus = 'Unknown'
	private ptpMaster = 'Unknown'
	public ptpDomain = 0
	public ptpHybridMode = true
	public ptpReceiverOnly = true
	public controlPanelEnabled = false
	public nmosEnabled = false
	private nmosStatus = 'Unknown'
	private wasConnected = false

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: DeviceConfig): Promise<void> {
		this.config = config
		this.setActionDefinitions(getActions(this))
		this.setFeedbackDefinitions(getFeedbacks(this))
		this.setPresetDefinitions(getPresets())
		this.setVariableDefinitions(getVariableDefinitions())
		this.setVariableValues(getDefaultVariableValues())
		this.initWebSocket()
	}

	async destroy(): Promise<void> {
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
		if (this.ws) {
			this.ws.close()
			this.ws = null
		}
	}

	async configUpdated(config: DeviceConfig): Promise<void> {
		this.config = config
		if (this.ws) {
			this.ws.close()
		}
		this.initWebSocket()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return getConfigFields()
	}

	private initWebSocket(): void {
		this.wasConnected = false
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
		if (!this.config.host) {
			this.updateStatus(InstanceStatus.BadConfig, 'No host configured')
			return
		}
		if (!this.config.port) {
			this.updateStatus(InstanceStatus.BadConfig, 'No port configured')
			return
		}
		if (this.ws) {
			this.ws.removeAllListeners()
			this.ws.close()
			this.ws = null
		}
		const wsUrl = `ws://${this.config.host}:${this.config.port}/websocket`
		this.log('info', `Connecting to ${wsUrl}`)
		try {
			this.ws = new WebSocket(wsUrl)
			this.ws.on('open', () => {
				this.log('info', 'WebSocket connected')
				this.updateStatus(InstanceStatus.Ok)
				this.wasConnected = true
				this.setVariableValues({ connection_status: 'Connected' })
				this.checkFeedbacks('connectionStatus')
				// Fetch initial network status and settings
				this.fetchNetworkStatus('Media1')
				this.fetchNetworkStatus('Config1')
				this.fetchNetworkStatus('Media2')
				this.fetchNetworkStatus('Expansion1')
				this.fetchNetworkLinkStatus('Media1')
				this.fetchNetworkLinkStatus('Config1')
				this.fetchNetworkLinkStatus('Media2')
				this.fetchNetworkLinkStatus('Expansion1')
				this.fetchNetworkSettings()
				this.fetchMediaPortAssignment()
				this.fetchDeviceInfo()
				this.fetchDeviceSettings()
				this.fetchFirmwareVersion()
				this.fetchIdentifyStatus()
				this.fetchIntercomArtistName()
				this.fetchIntercomArtistConnectionStatus()
				// Fetch health, alarm, and PTP status
				this.fetchHealthStatus()
				this.fetchAlarmList()
				this.fetchPtpStatus()
				this.fetchPtpSettings()
				// Fetch control panel and NMOS status
				this.fetchControlPanelConfig()
				this.fetchNmosStatus()
			})
			this.ws.on('message', (data: WebSocket.Data) => {
				let message = ''
				if (typeof data === 'string') {
					message = data
				} else if (Buffer.isBuffer(data)) {
					message = data.toString('utf8')
				} else if (Array.isArray(data)) {
					// Handle Buffer[] if it occurs
					message = Buffer.concat(data).toString('utf8')
				} else {
					// ArrayBuffer
					message = Buffer.from(data).toString('utf8')
				}
				this.handleMessage(message)
			})
			this.ws.on('error', (error: Error) => {
				if (this.wasConnected) {
					this.log('error', `WebSocket error: ${error.message}`)
				}
				this.updateStatus(InstanceStatus.ConnectionFailure, error.message)
			})
			this.ws.on('close', () => {
				if (this.wasConnected) {
					this.log('warn', 'WebSocket disconnected')
					this.updateStatus(InstanceStatus.Disconnected)
				}
				this.wasConnected = false
				this.setVariableValues({ connection_status: 'Disconnected' })
				this.checkFeedbacks('connectionStatus')
				if (!this.reconnectTimer) {
					this.reconnectTimer = setTimeout(() => {
						this.initWebSocket()
					}, 5000)
				}
			})
		} catch (error) {
			this.log('error', `Failed to create WebSocket: ${error}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, String(error))
		}
	}

	private handleMessage(message: string): void {
		try {
			const data = JSON.parse(message) as WebSocketMessage
			const topic = data.topic
			this.log('debug', `Received topic: ${topic}`)
			this.log('debug', `Received: ` + JSON.stringify(data))

			if (topic === '/NetworkStatus/FetchNetworkStatusResponse') {
				const body = data.body as {
					interfaceId?: string
					ipv4Status?: { ipAddress?: string }
					macAddress?: string
				}
				const interfaceId = body.interfaceId
				const ipAddress = body.ipv4Status?.ipAddress
				const macAddress = body.macAddress
				if (interfaceId && ipAddress) {
					this.interfaceIps.set(interfaceId, ipAddress)
					const variableUpdates: Record<string, string> = {}
					if (interfaceId === 'Media1') variableUpdates.media1_ip = ipAddress
					if (interfaceId === 'Config1') variableUpdates.config1_ip = ipAddress
					if (interfaceId === 'Media2') variableUpdates.media2_ip = ipAddress
					this.setVariableValues(variableUpdates)
					this.checkFeedbacks('interfaceIp')
				}
				if (macAddress) {
					this.setVariableValues({ mac_address: macAddress })
				}
				if (interfaceId && macAddress) {
					const variableUpdates: Record<string, string> = {}
					if (interfaceId === 'Media1') variableUpdates.media1_mac_address = macAddress
					if (interfaceId === 'Config1') variableUpdates.config1_mac_address = macAddress
					if (interfaceId === 'Media2') variableUpdates.media2_mac_address = macAddress
					if (interfaceId === 'Expansion1') variableUpdates.expansion1_mac_address = macAddress
					this.setVariableValues(variableUpdates)
				}
			} else if (topic === '/NetworkStatus/FetchNetworkLinkStatusResponse') {
				const body = data.body as {
					interfaceId?: string
					linkStatus?: string
				}
				const interfaceId = body.interfaceId
				const linkStatus = body.linkStatus
				if (interfaceId && linkStatus) {
					this.interfaceLinkStatuses.set(interfaceId, linkStatus)
					const variableUpdates: Record<string, string> = {}
					if (interfaceId === 'Media1') variableUpdates.media1_link_status = linkStatus
					if (interfaceId === 'Config1') variableUpdates.config1_link_status = linkStatus
					if (interfaceId === 'Media2') variableUpdates.media2_link_status = linkStatus
					if (interfaceId === 'Expansion1') variableUpdates.expansion1_link_status = linkStatus
					this.setVariableValues(variableUpdates)
					this.checkFeedbacks('interfaceLinkStatus')
				}
			} else if (topic === '/MediaPortAssignment/FetchMediaPortAssignmentResponse') {
				const body = data.body as {
					mediaPortAssignment?: {
						media1ExternalPort?: string
						media2ExternalPort?: string
						media1Speed?: string
						media2Speed?: string
					}
				}
				if (body.mediaPortAssignment) {
					// this.interfaceLinkStatuses.set(interfaceId, linkStatus)
					const variableUpdates: Record<string, string> = {}
					if (body.mediaPortAssignment.media1ExternalPort)
						variableUpdates.media1_external_port = body.mediaPortAssignment.media1ExternalPort
					if (body.mediaPortAssignment.media2ExternalPort)
						variableUpdates.media2_external_port = body.mediaPortAssignment.media2ExternalPort
					if (body.mediaPortAssignment.media1Speed) variableUpdates.media1_speed = body.mediaPortAssignment.media1Speed
					if (body.mediaPortAssignment.media2Speed) variableUpdates.media2_speed = body.mediaPortAssignment.media2Speed
					this.setVariableValues(variableUpdates)
					// this.checkFeedbacks('interfaceLinkStatus')
				}
			} else if (topic === '/DeviceInfo/FetchDeviceInfoResponse') {
				const body = data.body as {
					deviceName?: string
					firmwareVersion?: string
					deviceInfo?: {
						headsetAConnectorType?: string
						headsetBConnectorType?: string
						panelType?: string
						serialNumber?: string
					}
				}
				const updates: Record<string, string> = {}
				if (body.deviceName) updates.device_name = body.deviceName
				if (body.firmwareVersion) updates.firmware_version = body.firmwareVersion
				if (body.deviceInfo) {
					if (body.deviceInfo.headsetAConnectorType)
						updates.headset_a_connector_type = body.deviceInfo.headsetAConnectorType
					if (body.deviceInfo.headsetBConnectorType)
						updates.headset_b_connector_type = body.deviceInfo.headsetBConnectorType
					if (body.deviceInfo.panelType) updates.panel_type = body.deviceInfo.panelType
					if (body.deviceInfo.serialNumber) updates.serial_number = body.deviceInfo.serialNumber
				}
				this.setVariableValues(updates)
			} else if (topic === '/DeviceSettings/FetchDeviceSettingsResponse') {
				const body = data.body as {
					deviceName?: string
				}
				const updates: Record<string, string> = {}
				if (body.deviceName) updates.device_name = body.deviceName
				this.setVariableValues(updates)
			} else if (topic === '/FirmwareUpdater/FetchFirmwareVersion') {
				const body = data.body as {
					version?: string
				}
				const updates: Record<string, string> = {}
				if (body.version) updates.firmware_version = body.version
				this.setVariableValues(updates)
			} else if (topic === '/Identify/FetchStatusResponse') {
				const body = data.body as {
					isEnabled?: boolean
				}
				if (body.isEnabled !== undefined) {
					this.identifyEnabled = body.isEnabled
					this.setVariableValues({
						identify_enabled: this.identifyEnabled ? 'Yes' : 'No',
					})
					this.checkFeedbacks('identifyEnabled')
					this.log('info', `Identify enabled: ${this.identifyEnabled}`)
				}
			} else if (topic === '/NetworkSettings/FetchNetworkSettingsResponse') {
				const body = data.body as { networkSettings?: NetworkSettings }
				this.networkSettings = body.networkSettings || null
				this.log('info', `Network settings received: ${this.networkSettings ? 'OK' : 'null'}`)
			} else if (topic === '/NetworkSettings/UpdateNetworkSettingsResponse') {
				this.log('info', 'Network settings updated successfully')
				this.fetchNetworkStatus('Media1')
				this.fetchNetworkStatus('Config1')
				this.fetchNetworkStatus('Media2')
				// Update link status too just in case
				this.fetchNetworkLinkStatus('Media1')
				this.fetchNetworkLinkStatus('Config1')
				this.fetchNetworkLinkStatus('Media2')
				// Update media port assignment too just in case
				this.fetchMediaPortAssignment()
			} else if (topic === '/Intercom/FetchArtistConnectionStatusResponse') {
				const body = data.body as { connectionStatus?: string }
				if (body.connectionStatus) {
					this.artistConnectionStatus = body.connectionStatus
					this.setVariableValues({ artist_connection_status: this.artistConnectionStatus })
					this.checkFeedbacks('artistConnectionStatus', 'artistConnectionStatusDisplay')
					this.log('info', `Artist connection status: ${this.artistConnectionStatus}`)
				}
			} else if (topic === '/StatusInfo/FetchHealthStatusResponse') {
				const body = data.body as { healthStatus?: string }
				if (body.healthStatus) {
					this.healthStatus = body.healthStatus
					this.setVariableValues({ health_status: this.healthStatus })
					this.checkFeedbacks('healthStatus', 'healthStatusDisplay')
					this.log('info', `Health status: ${this.healthStatus}`)
				}
			} else if (topic === '/StatusInfo/HealthStatusChanged') {
				const body = data.body as { healthStatus?: string }
				if (body.healthStatus) {
					this.healthStatus = body.healthStatus
					this.setVariableValues({ health_status: this.healthStatus })
					this.checkFeedbacks('healthStatus', 'healthStatusDisplay')
				}
			} else if (topic === '/StatusInfo/FetchAlarmListResponse') {
				const body = data.body as { alarmList?: unknown[] }
				if (body.alarmList) {
					this.alarmList = body.alarmList
					this.setVariableValues({
						alarm_count: String(this.alarmList.length),
					})
					this.checkFeedbacks('alarmCount', 'alarmCountDisplay')
					this.log('info', `Alarm count: ${this.alarmList.length}`)
				}
			} else if (topic === '/StatusInfo/AlarmListChanged') {
				this.fetchAlarmList()
			} else if (topic === '/StatusInfo/FetchAlarmHistoryResponse') {
				const body = data.body as { alarmHistory?: unknown[] }
				if (body.alarmHistory) {
					this.alarmHistory = body.alarmHistory
					this.log('info', `Alarm history received: ${this.alarmHistory.length} entries`)
				}
			} else if (topic === '/Ptp/FetchPtpStatusResponse') {
				const body = data.body as {
					ptpStatus?: string
					timeTransmitter?: string
				}
				if (body.ptpStatus) {
					this.ptpStatus = body.ptpStatus
					this.setVariableValues({ ptp_status: this.ptpStatus })
					this.checkFeedbacks('ptpStatus', 'ptpStatusDisplay')
					this.log('info', `PTP status: ${this.ptpStatus}`)
				}
				if (body.timeTransmitter) {
					this.ptpMaster = body.timeTransmitter
					this.setVariableValues({ ptp_master: this.ptpMaster })
				}
			} else if (topic === '/Ptp/PtpStatusChanged') {
				this.fetchPtpStatus()
			} else if (topic === '/Ptp/FetchPtpSettingsResponse') {
				const body = data.body as {
					domain?: number
					hybridMode?: boolean
					timeReceiverOnly?: boolean
				}
				if (body.domain !== undefined) {
					this.ptpDomain = body.domain
					this.setVariableValues({ ptp_domain: String(this.ptpDomain) })
				}
				if (body.hybridMode !== undefined) {
					this.ptpHybridMode = body.hybridMode
					this.setVariableValues({
						ptp_hybrid_mode: this.ptpHybridMode ? 'Enabled' : 'Disabled',
					})
				}
				if (body.timeReceiverOnly !== undefined) {
					this.ptpReceiverOnly = body.timeReceiverOnly
					this.setVariableValues({
						ptp_receiver_only: this.ptpReceiverOnly ? 'Yes' : 'No',
					})
				}
			} else if (topic === '/Ptp/UpdatePtpSettingsResponse') {
				this.log('info', 'PTP settings updated successfully')
				this.fetchPtpSettings()
			} else if (topic === '/ControlPanelApp/FetchConfigResponse') {
				const body = data.body as {
					enabled?: boolean
					controlPanelAppConfig?: { isEnabled?: boolean }
				}
				if (body.enabled !== undefined) {
					this.controlPanelEnabled = body.enabled
					this.setVariableValues({
						control_panel_enabled: this.controlPanelEnabled ? 'Yes' : 'No',
					})
					this.checkFeedbacks('controlPanelEnabled')
					this.log('info', `Control panel enabled: ${this.controlPanelEnabled}`)
				} else if (body.controlPanelAppConfig !== undefined && body.controlPanelAppConfig.isEnabled !== undefined) {
					this.controlPanelEnabled = body.controlPanelAppConfig.isEnabled
					this.setVariableValues({
						control_panel_enabled: this.controlPanelEnabled ? 'Yes' : 'No',
					})
					this.checkFeedbacks('controlPanelEnabled')
					this.log('info', `Control panel enabled: ${this.controlPanelEnabled}`)
				}
			} else if (topic === '/ControlPanelApp/ConfigChanged') {
				this.fetchControlPanelConfig()
			} else if (topic === '/Nmos/FetchStatusResponse') {
				const body = data.body as {
					enabled?: boolean
					status?: string
					isEnabled?: boolean
				}
				if (body.enabled !== undefined) {
					this.nmosEnabled = body.enabled
					this.setVariableValues({
						nmos_enabled: this.nmosEnabled ? 'Yes' : 'No',
					})
					this.checkFeedbacks('nmosEnabled')
				} else if (body.isEnabled !== undefined) {
					this.nmosEnabled = body.isEnabled
					this.setVariableValues({
						nmos_enabled: this.nmosEnabled ? 'Yes' : 'No',
					})
					this.checkFeedbacks('nmosEnabled')
				}
				// TODO(Peter): Is NMOS state the same as status?
				// {"body":{"isEnabled":false,"state":"Undefined"},"topic":"/Nmos/FetchStatusResponse"}
				if (body.status) {
					this.nmosStatus = body.status
					this.setVariableValues({ nmos_status: this.nmosStatus })
				}
				this.log('info', `NMOS enabled: ${this.nmosEnabled}, status: ${this.nmosStatus}`)
			} else if (topic === '/Nmos/StatusChanged') {
				this.fetchNmosStatus()
			}
		} catch (error) {
			this.log('error', `Failed to parse message: ${error}`)
		}
	}

	public sendMessage(topic: string, body: Record<string, unknown> = {}): void {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			this.log('warn', 'WebSocket not connected')
			return
		}
		const message = JSON.stringify({ topic, body })
		this.ws.send(message)
		this.log('debug', `Sent: ${topic}`)
	}

	// Network methods
	public async setIpAddress(
		interfaceId: string,
		ipAddress: string,
		subnetMask: string,
		gateway: string,
		prefixLength: number,
		dhcp: boolean,
	): Promise<void> {
		if (!this.networkSettings) {
			this.log('warn', 'Current network settings not available, fetching...')
			this.fetchNetworkSettings()
			await new Promise((resolve) => setTimeout(resolve, 1000))
			if (!this.networkSettings) {
				this.log('error', 'Failed to fetch current network settings')
				return
			}
		}
		const updatedSettings = JSON.parse(JSON.stringify(this.networkSettings)) as NetworkSettings
		const targetInterface = updatedSettings.networkInterfaceSettings.find((iface) => iface.interfaceId === interfaceId)
		if (!targetInterface) {
			this.log('error', `Interface ${interfaceId} not found`)
			return
		}
		targetInterface.dhcpActive = dhcp
		targetInterface.ipv4Settings.ipAddress = ipAddress
		targetInterface.ipv4Settings.networkMaskConverted = subnetMask
		targetInterface.ipv4Settings.defaultGateway = gateway
		targetInterface.ipv4Settings.prefixLength = prefixLength
		this.sendMessage('/NetworkSettings/UpdateNetworkSettings', {
			networkSettings: updatedSettings,
		})
	}

	public fetchNetworkStatus(interfaceId: string): void {
		this.sendMessage('/NetworkStatus/FetchNetworkStatus', { interfaceId })
	}

	public fetchNetworkLinkStatus(interfaceId: string): void {
		this.sendMessage('/NetworkStatus/FetchNetworkLinkStatus', { interfaceId })
	}

	public fetchNetworkSettings(): void {
		this.sendMessage('/NetworkSettings/FetchNetworkSettings', {})
	}

	public fetchMediaPortAssignment(): void {
		this.sendMessage('/MediaPortAssignment/FetchMediaPortAssignment', {})
	}

	// Device methods
	public rebootDevice(): void {
		this.sendMessage('/Reboot/RebootDevice', {})
	}

	public fetchDeviceInfo(): void {
		this.sendMessage('/DeviceInfo/FetchDeviceInfo', {})
	}

	public fetchDeviceSettings(): void {
		this.sendMessage('/DeviceSettings/FetchDeviceSettings', {})
	}

	public fetchFirmwareVersion(): void {
		this.sendMessage('/FirmwareUpdater/FetchFirmwareVersion', {})
	}

	public fetchIdentifyStatus(): void {
		this.sendMessage('/Identify/FetchStatus', {})
	}

	// Artist methods
	public fetchIntercomArtistName(): void {
		this.sendMessage('/Intercom/FetchArtistName', {})
	}

	public fetchIntercomArtistConnectionStatus(): void {
		this.sendMessage('/Intercom/FetchArtistConnectionStatus', {})
	}

	// Health and Alarm methods
	public fetchHealthStatus(): void {
		this.sendMessage('/StatusInfo/FetchHealthStatus', {})
	}

	public fetchAlarmList(): void {
		this.sendMessage('/StatusInfo/FetchAlarmList', {})
	}

	public fetchAlarmHistory(): void {
		this.sendMessage('/StatusInfo/FetchAlarmHistory', {})
	}

	// PTP methods
	public fetchPtpStatus(): void {
		this.sendMessage('/Ptp/FetchPtpStatus', {})
	}

	public fetchPtpSettings(): void {
		this.sendMessage('/Ptp/FetchPtpSettings', {})
	}

	public updatePtpSettings(domain: number, hybridMode: boolean, timeReceiverOnly: boolean): void {
		this.sendMessage('/Ptp/UpdatePtpSettings', {
			domain,
			hybridMode,
			timeReceiverOnly,
		})
	}

	// Control Panel methods
	public fetchControlPanelConfig(): void {
		this.sendMessage('/ControlPanelApp/FetchConfig', {})
	}

	public enableControlPanel(): void {
		this.sendMessage('/ControlPanelApp/Enable', {})
		setTimeout(() => this.fetchControlPanelConfig(), 500)
	}

	public disableControlPanel(): void {
		this.sendMessage('/ControlPanelApp/Disable', {})
		setTimeout(() => this.fetchControlPanelConfig(), 500)
	}

	public toggleControlPanel(): void {
		if (this.controlPanelEnabled) {
			this.disableControlPanel()
		} else {
			this.enableControlPanel()
		}
	}

	// NMOS methods
	public fetchNmosStatus(): void {
		this.sendMessage('/Nmos/FetchStatus', {})
	}

	public enableNmos(): void {
		this.sendMessage('/Nmos/Enable', {})
		setTimeout(() => this.fetchNmosStatus(), 500)
	}

	public disableNmos(): void {
		this.sendMessage('/Nmos/Disable', {})
		setTimeout(() => this.fetchNmosStatus(), 500)
	}

	public toggleNmos(): void {
		if (this.nmosEnabled) {
			this.disableNmos()
		} else {
			this.enableNmos()
		}
	}

	// Getter methods for feedbacks
	public isConnected(): boolean {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN
	}

	public getInterfaceIp(interfaceId: string): string | undefined {
		return this.interfaceIps.get(interfaceId)
	}

	public getInterfaceLinkStatus(interfaceId: string): string | undefined {
		return this.interfaceLinkStatuses.get(interfaceId)
	}

	public getIdentifyEnabled(): boolean {
		return this.identifyEnabled
	}

	public getArtistConnectionStatus(): string {
		return this.artistConnectionStatus
	}

	public getHealthStatus(): string {
		return this.healthStatus
	}

	public getAlarmCount(): number {
		return this.alarmList.length
	}

	public getPtpStatus(): string {
		return this.ptpStatus
	}

	public getControlPanelEnabled(): boolean {
		return this.controlPanelEnabled
	}

	public getNmosEnabled(): boolean {
		return this.nmosEnabled
	}
}

runEntrypoint(RiedelRSP1232HLInstance, [])

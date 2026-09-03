import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { getConfigFields, DeviceConfig } from './config.js'
import { getActions } from './actions.js'
import { getFeedbacks } from './feedbacks.js'
import { getPresets } from './presets.js'
import { getVariableDefinitions, getDefaultVariableValues } from './variables.js'
import WebSocket from 'ws'

// The panel's web UI sends a /Ping every 30 seconds; we mirror that cadence.
// Any /PingResponse resets the counter to 0. The watchdog checks the counter at
// the top of each tick before incrementing, so after MAX_MISSED_PONGS unanswered
// pings the link is torn down on the following tick — i.e. up to ~90s of genuine
// silence with this value. This catches half-open TCP connections that never
// emit a 'close' event, which is the only way the link can die silently.
const PING_INTERVAL_MS = 30000
const MAX_MISSED_PONGS = 2

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
	private pingTimer: ReturnType<typeof setInterval> | null = null
	private missedPongs = 0
	private interfaceIps: Map<string, string> = new Map()
	private networkSettings: NetworkSettings | null = null
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
	public identifyEnabled = false
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
		this.stopPingTimer()
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
		this.stopPingTimer()
		if (this.ws) {
			this.ws.close()
		}
		this.initWebSocket()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return getConfigFields()
	}

	// Resolve the connection target. A panel selected via Bonjour discovery is
	// stored as "ip:port" and takes precedence over the manual host/port fields.
	private resolveTarget(): { host: string; port: number } {
		const bonjour = this.config.bonjour_host
		if (!bonjour) {
			return { host: this.config.host, port: this.config.port }
		}
		const lastColon = bonjour.lastIndexOf(':')
		// No colon: a bare host/IPv4 with no port — use the configured port.
		if (lastColon === -1) {
			return { host: bonjour, port: this.config.port }
		}
		const host = bonjour.slice(0, lastColon)
		// A colon still in the host portion means an unbracketed IPv6 address with
		// no port suffix to split off — use the whole value as the host.
		if (host.includes(':')) {
			return { host: bonjour, port: this.config.port }
		}
		// Otherwise treat it as "host:port". An empty host (e.g. ":80") falls
		// through to the !target.host guard in initWebSocket → BadConfig.
		const port = Number(bonjour.slice(lastColon + 1))
		return { host, port: Number.isFinite(port) && port > 0 ? port : this.config.port }
	}

	private initWebSocket(): void {
		this.wasConnected = false
		this.stopPingTimer()
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer)
			this.reconnectTimer = null
		}
		const target = this.resolveTarget()
		if (!target.host) {
			this.updateStatus(InstanceStatus.BadConfig, 'No host configured')
			return
		}
		if (!target.port) {
			this.updateStatus(InstanceStatus.BadConfig, 'No port configured')
			return
		}
		if (this.ws) {
			this.ws.removeAllListeners()
			this.ws.close()
			this.ws = null
		}
		const wsUrl = `ws://${target.host}:${target.port}/websocket`
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
				this.fetchNetworkSettings()
				this.fetchDeviceInfo()
				this.fetchDeviceSettings()
				this.fetchFirmwareVersion()
				// Fetch health, alarm, and PTP status
				this.fetchHealthStatus()
				this.fetchAlarmList()
				this.fetchPtpStatus()
				this.fetchPtpSettings()
				// Fetch control panel and NMOS status
				this.fetchControlPanelConfig()
				this.fetchNmosStatus()
				this.fetchIdentifyStatus()
				// Start keepalive once the connection is live
				this.startPingTimer()
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
				this.stopPingTimer()
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

			// Handle keepalive before logging so the 30s ping/pong doesn't flood
			// the debug log and bury genuine message traces.
			if (topic === '/PingResponse') {
				// The panel is alive; reset the keepalive watchdog.
				this.missedPongs = 0
				return
			}

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
				if (interfaceId && ipAddress) {
					this.interfaceIps.set(interfaceId, ipAddress)
					const variableUpdates: Record<string, string> = {}
					if (interfaceId === 'Media1') variableUpdates.media1_ip = ipAddress
					if (interfaceId === 'Config1') variableUpdates.config1_ip = ipAddress
					if (interfaceId === 'Media2') variableUpdates.media2_ip = ipAddress
					this.setVariableValues(variableUpdates)
					this.checkFeedbacks('interfaceIp')
				}
				if (body.macAddress) {
					this.setVariableValues({ mac_address: body.macAddress })
				}
			} else if (topic === '/DeviceInfo/FetchDeviceInfoResponse') {
				const body = data.body as {
					deviceName?: string
					firmwareVersion?: string
				}
				const updates: Record<string, string> = {}
				if (body.deviceName) updates.device_name = body.deviceName
				if (body.firmwareVersion) updates.firmware_version = body.firmwareVersion
				this.setVariableValues(updates)
			} else if (topic === '/DeviceSettings/FetchDeviceSettingsResponse') {
				const body = data.body as {
					deviceName?: string
				}
				const updates: Record<string, string> = {}
				if (body.deviceName) updates.device_name = body.deviceName
				this.setVariableValues(updates)
			} else if (topic === '/FirmwareUpdater/FetchFirmwareVersionResponse') {
				const body = data.body as {
					version?: string
				}
				const updates: Record<string, string> = {}
				if (body.version) updates.firmware_version = body.version
				this.setVariableValues(updates)
			} else if (topic === '/NetworkSettings/FetchNetworkSettingsResponse') {
				const body = data.body as { networkSettings?: NetworkSettings }
				this.networkSettings = body.networkSettings || null
				this.log('info', `Network settings received: ${this.networkSettings ? 'OK' : 'null'}`)
			} else if (topic === '/NetworkSettings/UpdateNetworkSettingsResponse') {
				this.log('info', 'Network settings updated successfully')
				this.fetchNetworkStatus('Media1')
				this.fetchNetworkStatus('Config1')
				this.fetchNetworkStatus('Media2')
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
			} else if (topic === '/Identify/FetchStatusResponse') {
				const body = data.body as { isEnabled?: boolean }
				if (body.isEnabled !== undefined) {
					this.identifyEnabled = body.isEnabled
					this.setVariableValues({ identify_status: this.identifyEnabled ? 'Active' : 'Inactive' })
					this.checkFeedbacks('identifyEnabled')
				}
			} else if (topic === '/Identify/StatusChanged') {
				const body = data.body as { isEnabled?: boolean }
				if (body.isEnabled !== undefined) {
					this.identifyEnabled = body.isEnabled
					this.setVariableValues({ identify_status: this.identifyEnabled ? 'Active' : 'Inactive' })
					this.checkFeedbacks('identifyEnabled')
				}
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
		// /Ping is sent every 30s; skip logging it to avoid debug-log noise.
		if (topic !== '/Ping') {
			this.log('debug', `Sent: ${topic}`)
		}
	}

	// Keepalive: periodically send /Ping and watch for /PingResponse. If the panel
	// stops responding we forcibly tear down the socket so the existing 'close'
	// handler schedules a reconnect — this is what detects a silently dropped link.
	private startPingTimer(): void {
		this.stopPingTimer()
		this.missedPongs = 0
		this.pingTimer = setInterval(() => {
			if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
				return
			}
			if (this.missedPongs >= MAX_MISSED_PONGS) {
				this.log('warn', `No /PingResponse after ${this.missedPongs} pings, treating connection as dead`)
				this.updateStatus(InstanceStatus.Disconnected, 'No response to ping')
				this.ws.terminate()
				return
			}
			this.missedPongs++
			this.sendMessage('/Ping', {})
		}, PING_INTERVAL_MS)
	}

	private stopPingTimer(): void {
		if (this.pingTimer) {
			clearInterval(this.pingTimer)
			this.pingTimer = null
		}
		this.missedPongs = 0
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

	public fetchNetworkSettings(): void {
		this.sendMessage('/NetworkSettings/FetchNetworkSettings', {})
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

	// Identify methods
	// Note: the panel has no built-in "flash count" parameter - /Identify only exposes
	// a bare on/off latch. Empirically, each Enable/Disable message is itself one visible
	// flash of the panel's key LEDs (it is not "Enable starts blinking, Disable stops it").
	// flashIdentify() below reproduces a specific flash count by alternating the latch.
	public fetchIdentifyStatus(): void {
		this.sendMessage('/Identify/FetchStatus', {})
	}

	public enableIdentify(): void {
		this.sendMessage('/Identify/Enable', {})
		this.identifyEnabled = true
		this.setVariableValues({ identify_status: 'Active' })
		this.checkFeedbacks('identifyEnabled')
	}

	public disableIdentify(): void {
		this.sendMessage('/Identify/Disable', {})
		this.identifyEnabled = false
		this.setVariableValues({ identify_status: 'Inactive' })
		this.checkFeedbacks('identifyEnabled')
	}

	public toggleIdentify(): void {
		if (this.identifyEnabled) {
			this.disableIdentify()
		} else {
			this.enableIdentify()
		}
	}

	public async flashIdentify(count: number, intervalMs: number): Promise<void> {
		if (count < 1) return
		let state = this.identifyEnabled
		for (let i = 0; i < count; i++) {
			state = !state
			this.sendMessage(state ? '/Identify/Enable' : '/Identify/Disable', {})
			this.identifyEnabled = state
			if (i < count - 1) {
				await new Promise((resolve) => setTimeout(resolve, intervalMs))
			}
		}
		this.setVariableValues({ identify_status: this.identifyEnabled ? 'Active' : 'Inactive' })
		this.checkFeedbacks('identifyEnabled')
	}

	// Identify-by-IP methods
	// Open a short-lived WebSocket directly to an arbitrary panel, send identify command(s),
	// then close. This lets one Companion connection flash any panel on the network by IP
	// (e.g. from a custom variable) without needing a dedicated persistent connection - and
	// therefore without live feedbacks/variables/status polling - for every physical panel.
	private async runIdentifyOnRemote(
		host: string,
		run: (send: (topic: string) => void) => Promise<void>,
	): Promise<void> {
		if (!host) {
			this.log('warn', 'Identify by IP: no host provided')
			return
		}
		const url = `ws://${host}:${this.config.port}/websocket`
		const socket = new WebSocket(url)
		try {
			await new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => reject(new Error('connection timeout')), 5000)
				socket.once('open', () => {
					clearTimeout(timeout)
					resolve()
				})
				socket.once('error', (error) => {
					clearTimeout(timeout)
					reject(error)
				})
			})
			const send = (topic: string) => socket.send(JSON.stringify({ topic, body: {} }))
			await run(send)
			// give the last frame a moment to flush before closing the socket
			await new Promise((resolve) => setTimeout(resolve, 100))
		} catch (error) {
			this.log('error', `Identify command to ${host} failed: ${error}`)
		} finally {
			socket.close()
		}
	}

	public async enableIdentifyAtIp(host: string): Promise<void> {
		await this.runIdentifyOnRemote(host, async (send) => {
			send('/Identify/Enable')
		})
	}

	public async disableIdentifyAtIp(host: string): Promise<void> {
		await this.runIdentifyOnRemote(host, async (send) => {
			send('/Identify/Disable')
		})
	}

	public async flashIdentifyAtIp(host: string, count: number, intervalMs: number): Promise<void> {
		if (count < 1) return
		await this.runIdentifyOnRemote(host, async (send) => {
			let state = false
			for (let i = 0; i < count; i++) {
				state = !state
				send(state ? '/Identify/Enable' : '/Identify/Disable')
				if (i < count - 1) {
					await new Promise((resolve) => setTimeout(resolve, intervalMs))
				}
			}
		})
	}

	// Key Mute (Rotary Push) Methods via LiveView WebSocket API
	private async runLiveViewCommand(host: string, run: (socket: WebSocket) => Promise<void>): Promise<void> {
		if (!host) {
			this.log('warn', 'LiveView command: no host provided')
			return
		}
		const url = `ws://${host}:${this.config.port}/live-view`
		const socket = new WebSocket(url)
		try {
			await new Promise<void>((resolve, reject) => {
				const timeout = setTimeout(() => reject(new Error('LiveView connection timeout')), 5000)
				socket.once('open', () => {
					clearTimeout(timeout)
					resolve()
				})
				socket.once('error', (error) => {
					clearTimeout(timeout)
					reject(error)
				})
			})
			await run(socket)
			// Wait briefly before closing to ensure the final release message flushes
			await new Promise((resolve) => setTimeout(resolve, 100))
		} catch (error) {
			this.log('error', `LiveView command to ${host} failed: ${error}`)
		} finally {
			socket.close()
		}
	}

	public async toggleKeyMute(panelId: number, keyNumber: number, durationMs = 250): Promise<void> {
		const target = this.resolveTarget()
		if (!target.host) {
			this.log('warn', 'Toggle Key Mute: no host configured')
			return
		}
		await this.toggleKeyMuteAtIp(target.host, panelId, keyNumber, durationMs)
	}

	public async toggleKeyMuteAtIp(host: string, panelId: number, keyNumber: number, durationMs = 250): Promise<void> {
		if (keyNumber < 1) {
			this.log('warn', `Invalid key number: ${keyNumber}. Must be >= 1`)
			return
		}
		const keyId = keyNumber - 1
		await this.runLiveViewCommand(host, async (socket) => {
			const sendMsg = (topic: string, body: Record<string, unknown>) => {
				socket.send(JSON.stringify({ topic, body }))
			}

			// Press
			sendMsg('/LiveView/SimulateButton', {
				panelId,
				keyId,
				buttonState: 'Pressed',
			})

			// Hold duration (minimum 200ms required by panel firmware)
			await new Promise((resolve) => setTimeout(resolve, Math.max(durationMs, 200)))

			// Release
			sendMsg('/LiveView/SimulateButton', {
				panelId,
				keyId,
				buttonState: 'Released',
			})
		})
	}

	// Getter methods for feedbacks
	public isConnected(): boolean {
		return this.ws !== null && this.ws.readyState === WebSocket.OPEN
	}

	public getInterfaceIp(interfaceId: string): string | undefined {
		return this.interfaceIps.get(interfaceId)
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

	public getIdentifyEnabled(): boolean {
		return this.identifyEnabled
	}
}

runEntrypoint(RiedelRSP1232HLInstance, [])

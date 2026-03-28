import { CompanionVariableDefinition, CompanionVariableValues } from '@companion-module/base'

export function getVariableDefinitions(): CompanionVariableDefinition[] {
	return [
		{
			name: 'Connection Status',
			variableId: 'connection_status',
		},
		{
			name: 'Media1 IP Address',
			variableId: 'media1_ip',
		},
		{
			name: 'Config1 IP Address',
			variableId: 'config1_ip',
		},
		{
			name: 'Media2 IP Address',
			variableId: 'media2_ip',
		},
		{
			name: 'Media1 MAC Address',
			variableId: 'media1_mac_address',
		},
		{
			name: 'Config1 MAC Address',
			variableId: 'config1_mac_address',
		},
		{
			name: 'Media2 MAC Address',
			variableId: 'media2_mac_address',
		},
		{
			name: 'Expansion1 MAC Address',
			variableId: 'expansion1_mac_address',
		},
		{
			name: 'Media1 Link Status',
			variableId: 'media1_link_status',
		},
		{
			name: 'Config1 Link Status',
			variableId: 'config1_link_status',
		},
		{
			name: 'Media2 Link Status',
			variableId: 'media2_link_status',
		},
		{
			name: 'Expansion1 Link Status',
			variableId: 'expansion1_link_status',
		},
		{
			name: 'Media1 Speed',
			variableId: 'media1_speed',
		},
		{
			name: 'Media2 Speed',
			variableId: 'media2_speed',
		},
		{
			name: 'Media1 External Port',
			variableId: 'media1_external_port',
		},
		{
			name: 'Media2 External Port',
			variableId: 'media2_external_port',
		},
		{
			name: 'Device Name',
			variableId: 'device_name',
		},
		{
			name: 'Firmware Version',
			variableId: 'firmware_version',
		},
		{
			name: 'Headset A Connector Type',
			variableId: 'headset_a_connector_type',
		},
		{
			name: 'Headset B Connector Type',
			variableId: 'headset_b_connector_type',
		},
		{
			name: 'Panel Type',
			variableId: 'panel_type',
		},
		{
			name: 'Serial Number',
			variableId: 'serial_number',
		},
		{
			name: 'MAC Address',
			variableId: 'mac_address',
		},
		{
			name: 'Identify Enabled',
			variableId: 'identify_enabled',
		},
		{
			name: 'Artist Connection Status',
			variableId: 'artist_connection_status',
		},
		{
			name: 'Health Status',
			variableId: 'health_status',
		},
		{
			name: 'Alarm Count',
			variableId: 'alarm_count',
		},
		{
			name: 'PTP Status',
			variableId: 'ptp_status',
		},
		{
			name: 'PTP Time Transmitter (Master Clock)',
			variableId: 'ptp_master',
		},
		{
			name: 'PTP Domain',
			variableId: 'ptp_domain',
		},
		{
			name: 'PTP Hybrid Mode',
			variableId: 'ptp_hybrid_mode',
		},
		{
			name: 'PTP Time Receiver Only',
			variableId: 'ptp_receiver_only',
		},
		{
			name: 'Control Panel Enabled',
			variableId: 'control_panel_enabled',
		},
		{
			name: 'NMOS Enabled',
			variableId: 'nmos_enabled',
		},
		{
			name: 'NMOS Status',
			variableId: 'nmos_status',
		},
	]
}

export function getDefaultVariableValues(): CompanionVariableValues {
	return {
		connection_status: 'Disconnected',
		media1_ip: 'Unknown',
		config1_ip: 'Unknown',
		media2_ip: 'Unknown',
		media1_mac_address: 'Unknown',
		config1_mac_address: 'Unknown',
		media2_mac_address: 'Unknown',
		expansion1_mac_address: 'Unknown',
		media1_link_status: 'Unknown',
		config1_link_status: 'Unknown',
		media2_link_status: 'Unknown',
		expansion1_link_status: 'Unknown',
		media1_speed: 'Unknown',
		media2_speed: 'Unknown',
		media1_external_port: 'Unknown',
		media2_external_port: 'Unknown',
		device_name: 'Unknown',
		firmware_version: 'Unknown',
		headset_a_connector_type: 'Unknown',
		headset_b_connector_type: 'Unknown',
		panel_type: 'Unknown',
		serial_number: 'Unknown',
		mac_address: 'Unknown',
		identify_enabled: 'Unknown',
		health_status: 'Unknown',
		alarm_count: '0',
		ptp_status: 'Unknown',
		ptp_master: 'Unknown',
		ptp_domain: 'Unknown',
		ptp_hybrid_mode: 'Unknown',
		ptp_receiver_only: 'Unknown',
		control_panel_enabled: 'Unknown',
		nmos_enabled: 'Unknown',
		nmos_status: 'Unknown',
	}
}

export function getVariableDefinitions() {
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
            name: 'Device Name',
            variableId: 'device_name',
        },
        {
            name: 'Firmware Version',
            variableId: 'firmware_version',
        },
        {
            name: 'MAC Address',
            variableId: 'mac_address',
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
    ];
}
export function getDefaultVariableValues() {
    return {
        connection_status: 'Disconnected',
        media1_ip: 'Unknown',
        config1_ip: 'Unknown',
        media2_ip: 'Unknown',
        device_name: 'Unknown',
        firmware_version: 'Unknown',
        mac_address: 'Unknown',
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
    };
}
//# sourceMappingURL=variables.js.map
import { combineRgb } from '@companion-module/base';
export function getPresets() {
    const presets = {};
    // Color definitions
    const WHITE = combineRgb(255, 255, 255);
    const BLACK = combineRgb(0, 0, 0);
    const RED = combineRgb(255, 0, 0);
    const GREEN = combineRgb(0, 255, 0);
    const YELLOW = combineRgb(255, 170, 0);
    const BLUE = combineRgb(0, 100, 255);
    const GREY = combineRgb(128, 128, 128);
    const DARK_RED = combineRgb(128, 0, 0);
    const DARK_GREEN = combineRgb(0, 128, 0);
    const DARK_BLUE = combineRgb(0, 0, 128);
    // ==================== STATUS DISPLAY PRESETS ====================
    presets['status_connection'] = {
        type: 'button',
        category: 'Status Display',
        name: 'Connection Status',
        style: {
            text: 'Connection\\n$(riedel-smartpanel:connection_status)',
            size: '14',
            color: WHITE,
            bgcolor: DARK_BLUE,
        },
        steps: [{ down: [], up: [] }],
        feedbacks: [
            {
                feedbackId: 'connectionStatus',
                options: { showText: false },
                style: {
                    bgcolor: GREEN,
                },
            },
        ],
    };
    presets['status_health'] = {
        type: 'button',
        category: 'Status Display',
        name: 'Health Status',
        style: {
            text: 'Health',
            size: '14',
            color: WHITE,
            bgcolor: GREY,
        },
        steps: [{ down: [{ actionId: 'fetchHealthStatus', options: {} }], up: [] }],
        feedbacks: [
            {
                feedbackId: 'healthStatusDisplay',
                options: {
                    okColor: GREEN,
                    warningColor: YELLOW,
                    errorColor: RED,
                    unknownColor: GREY,
                    textColor: WHITE,
                },
            },
        ],
    };
    presets['status_alarms'] = {
        type: 'button',
        category: 'Status Display',
        name: 'Alarm Count',
        style: {
            text: 'Alarms',
            size: '14',
            color: WHITE,
            bgcolor: GREY,
        },
        steps: [{ down: [{ actionId: 'fetchAlarmList', options: {} }], up: [] }],
        feedbacks: [
            {
                feedbackId: 'alarmCountDisplay',
                options: {
                    noAlarmColor: GREEN,
                    hasAlarmColor: RED,
                    textColor: WHITE,
                    format: 'Alarms\\n{count}',
                },
            },
        ],
    };
    presets['status_ptp'] = {
        type: 'button',
        category: 'Status Display',
        name: 'PTP Status',
        style: {
            text: 'PTP',
            size: '14',
            color: WHITE,
            bgcolor: GREY,
        },
        steps: [{ down: [{ actionId: 'fetchPtpStatus', options: {} }], up: [] }],
        feedbacks: [
            {
                feedbackId: 'ptpStatusDisplay',
                options: {
                    lockedColor: GREEN,
                    unlockedColor: YELLOW,
                    unknownColor: GREY,
                    textColor: WHITE,
                    shortText: true,
                },
            },
        ],
    };
    presets['status_ptp_domain'] = {
        type: 'button',
        category: 'Status Display',
        name: 'PTP Domain',
        style: {
            text: 'PTP Domain\\n$(riedel-smartpanel:ptp_domain)',
            size: '14',
            color: WHITE,
            bgcolor: DARK_BLUE,
        },
        steps: [{ down: [{ actionId: 'fetchPtpSettings', options: {} }], up: [] }],
        feedbacks: [],
    };
    presets['status_ptp_master'] = {
        type: 'button',
        category: 'Status Display',
        name: 'PTP Master',
        style: {
            text: 'PTP Master\\n$(riedel-smartpanel:ptp_master)',
            size: '7',
            color: WHITE,
            bgcolor: DARK_BLUE,
        },
        steps: [{ down: [{ actionId: 'fetchPtpStatus', options: {} }], up: [] }],
        feedbacks: [],
    };
    // ==================== NETWORK STATUS PRESETS ====================
    presets['status_media1_ip'] = {
        type: 'button',
        category: 'Network Status',
        name: 'Media1 IP',
        style: {
            text: 'Media1',
            size: '14',
            color: WHITE,
            bgcolor: BLACK,
        },
        steps: [{ down: [{ actionId: 'fetchNetworkStatus', options: { interface: 'Media1' } }], up: [] }],
        feedbacks: [
            {
                feedbackId: 'interfaceIp',
                options: {
                    interface: 'Media1',
                    showName: true,
                    bgcolor: BLACK,
                    color: WHITE,
                },
            },
        ],
    };
    presets['status_config1_ip'] = {
        type: 'button',
        category: 'Network Status',
        name: 'Config1 IP',
        style: {
            text: 'Config1',
            size: '14',
            color: WHITE,
            bgcolor: BLACK,
        },
        steps: [{ down: [{ actionId: 'fetchNetworkStatus', options: { interface: 'Config1' } }], up: [] }],
        feedbacks: [
            {
                feedbackId: 'interfaceIp',
                options: {
                    interface: 'Config1',
                    showName: true,
                    bgcolor: BLACK,
                    color: WHITE,
                },
            },
        ],
    };
    presets['status_media2_ip'] = {
        type: 'button',
        category: 'Network Status',
        name: 'Media2 IP',
        style: {
            text: 'Media2',
            size: '14',
            color: WHITE,
            bgcolor: BLACK,
        },
        steps: [{ down: [{ actionId: 'fetchNetworkStatus', options: { interface: 'Media2' } }], up: [] }],
        feedbacks: [
            {
                feedbackId: 'interfaceIp',
                options: {
                    interface: 'Media2',
                    showName: true,
                    bgcolor: BLACK,
                    color: WHITE,
                },
            },
        ],
    };
    // ==================== DEVICE INFO PRESETS ====================
    presets['info_device_name'] = {
        type: 'button',
        category: 'Device Info',
        name: 'Device Name',
        style: {
            text: '$(riedel-smartpanel:device_name)',
            size: '14',
            color: WHITE,
            bgcolor: DARK_BLUE,
        },
        steps: [{ down: [{ actionId: 'fetchDeviceInfo', options: {} }], up: [] }],
        feedbacks: [],
    };
    presets['info_firmware'] = {
        type: 'button',
        category: 'Device Info',
        name: 'Firmware Version',
        style: {
            text: 'Firmware\\n$(riedel-smartpanel:firmware_version)',
            size: '14',
            color: WHITE,
            bgcolor: DARK_BLUE,
        },
        steps: [{ down: [{ actionId: 'fetchDeviceInfo', options: {} }], up: [] }],
        feedbacks: [],
    };
    presets['info_mac'] = {
        type: 'button',
        category: 'Device Info',
        name: 'MAC Address',
        style: {
            text: 'MAC\\n$(riedel-smartpanel:mac_address)',
            size: '7',
            color: WHITE,
            bgcolor: DARK_BLUE,
        },
        steps: [{ down: [], up: [] }],
        feedbacks: [],
    };
    // ==================== REFRESH ACTIONS PRESETS ====================
    presets['action_refresh_all'] = {
        type: 'button',
        category: 'Actions',
        name: 'Refresh All',
        style: {
            text: 'REFRESH\\nALL',
            size: '14',
            color: WHITE,
            bgcolor: BLUE,
        },
        steps: [{ down: [{ actionId: 'refreshAllStatus', options: {} }], up: [] }],
        feedbacks: [],
    };
    presets['action_refresh_network'] = {
        type: 'button',
        category: 'Actions',
        name: 'Refresh Network',
        style: {
            text: 'REFRESH\\nNETWORK',
            size: '14',
            color: WHITE,
            bgcolor: BLUE,
        },
        steps: [{ down: [{ actionId: 'fetchAllNetworkStatus', options: {} }], up: [] }],
        feedbacks: [],
    };
    presets['action_refresh_health'] = {
        type: 'button',
        category: 'Actions',
        name: 'Refresh Health',
        style: {
            text: 'REFRESH\\nHEALTH',
            size: '14',
            color: WHITE,
            bgcolor: BLUE,
        },
        steps: [{ down: [{ actionId: 'fetchHealthStatus', options: {} }], up: [] }],
        feedbacks: [],
    };
    presets['action_refresh_alarms'] = {
        type: 'button',
        category: 'Actions',
        name: 'Refresh Alarms',
        style: {
            text: 'REFRESH\\nALARMS',
            size: '14',
            color: WHITE,
            bgcolor: BLUE,
        },
        steps: [{ down: [{ actionId: 'fetchAlarmList', options: {} }], up: [] }],
        feedbacks: [],
    };
    presets['action_fetch_alarm_history'] = {
        type: 'button',
        category: 'Actions',
        name: 'Alarm History',
        style: {
            text: 'ALARM\\nHISTORY',
            size: '14',
            color: WHITE,
            bgcolor: DARK_RED,
        },
        steps: [{ down: [{ actionId: 'fetchAlarmHistory', options: {} }], up: [] }],
        feedbacks: [],
    };
    // ==================== CONTROL PANEL PRESETS ====================
    presets['control_panel_status'] = {
        type: 'button',
        category: 'Control Panel',
        name: 'Control Panel Status',
        style: {
            text: 'Control\\nPanel',
            size: '14',
            color: WHITE,
            bgcolor: GREY,
        },
        steps: [{ down: [{ actionId: 'toggleControlPanel', options: {} }], up: [] }],
        feedbacks: [
            {
                feedbackId: 'controlPanelEnabled',
                options: { state: 'enabled' },
                style: {
                    bgcolor: GREEN,
                    text: 'Control\\nPanel\\nON',
                },
            },
            {
                feedbackId: 'controlPanelEnabled',
                options: { state: 'disabled' },
                style: {
                    bgcolor: RED,
                    text: 'Control\\nPanel\\nOFF',
                },
            },
        ],
    };
    presets['control_panel_enable'] = {
        type: 'button',
        category: 'Control Panel',
        name: 'Enable Control Panel',
        style: {
            text: 'ENABLE\\nCTRL PANEL',
            size: '14',
            color: WHITE,
            bgcolor: DARK_GREEN,
        },
        steps: [{ down: [{ actionId: 'enableControlPanel', options: {} }], up: [] }],
        feedbacks: [
            {
                feedbackId: 'controlPanelEnabled',
                options: { state: 'enabled' },
                style: {
                    bgcolor: GREEN,
                },
            },
        ],
    };
    presets['control_panel_disable'] = {
        type: 'button',
        category: 'Control Panel',
        name: 'Disable Control Panel',
        style: {
            text: 'DISABLE\\nCTRL PANEL',
            size: '14',
            color: WHITE,
            bgcolor: DARK_RED,
        },
        steps: [{ down: [{ actionId: 'disableControlPanel', options: {} }], up: [] }],
        feedbacks: [
            {
                feedbackId: 'controlPanelEnabled',
                options: { state: 'disabled' },
                style: {
                    bgcolor: RED,
                },
            },
        ],
    };
    // ==================== NMOS PRESETS ====================
    presets['nmos_status'] = {
        type: 'button',
        category: 'NMOS',
        name: 'NMOS Status',
        style: {
            text: 'NMOS',
            size: '14',
            color: WHITE,
            bgcolor: GREY,
        },
        steps: [{ down: [{ actionId: 'toggleNmos', options: {} }], up: [] }],
        feedbacks: [
            {
                feedbackId: 'nmosEnabled',
                options: { state: 'enabled' },
                style: {
                    bgcolor: GREEN,
                    text: 'NMOS\\nON',
                },
            },
            {
                feedbackId: 'nmosEnabled',
                options: { state: 'disabled' },
                style: {
                    bgcolor: RED,
                    text: 'NMOS\\nOFF',
                },
            },
        ],
    };
    presets['nmos_enable'] = {
        type: 'button',
        category: 'NMOS',
        name: 'Enable NMOS',
        style: {
            text: 'ENABLE\\nNMOS',
            size: '14',
            color: WHITE,
            bgcolor: DARK_GREEN,
        },
        steps: [{ down: [{ actionId: 'enableNmos', options: {} }], up: [] }],
        feedbacks: [
            {
                feedbackId: 'nmosEnabled',
                options: { state: 'enabled' },
                style: {
                    bgcolor: GREEN,
                },
            },
        ],
    };
    presets['nmos_disable'] = {
        type: 'button',
        category: 'NMOS',
        name: 'Disable NMOS',
        style: {
            text: 'DISABLE\\nNMOS',
            size: '14',
            color: WHITE,
            bgcolor: DARK_RED,
        },
        steps: [{ down: [{ actionId: 'disableNmos', options: {} }], up: [] }],
        feedbacks: [
            {
                feedbackId: 'nmosEnabled',
                options: { state: 'disabled' },
                style: {
                    bgcolor: RED,
                },
            },
        ],
    };
    presets['nmos_refresh'] = {
        type: 'button',
        category: 'NMOS',
        name: 'Refresh NMOS',
        style: {
            text: 'REFRESH\\nNMOS',
            size: '14',
            color: WHITE,
            bgcolor: BLUE,
        },
        steps: [{ down: [{ actionId: 'fetchNmosStatus', options: {} }], up: [] }],
        feedbacks: [],
    };
    // ==================== PTP CONTROL PRESETS ====================
    presets['ptp_refresh'] = {
        type: 'button',
        category: 'PTP',
        name: 'Refresh PTP',
        style: {
            text: 'REFRESH\\nPTP',
            size: '14',
            color: WHITE,
            bgcolor: BLUE,
        },
        steps: [
            {
                down: [
                    { actionId: 'fetchPtpStatus', options: {} },
                    { actionId: 'fetchPtpSettings', options: {} },
                ],
                up: [],
            },
        ],
        feedbacks: [],
    };
    // PTP Domain presets (0-7 are common domains)
    for (let domain = 0; domain <= 7; domain++) {
        presets[`ptp_set_domain_${domain}`] = {
            type: 'button',
            category: 'PTP',
            name: `Set PTP Domain ${domain}`,
            style: {
                text: `PTP\\nDomain ${domain}`,
                size: '14',
                color: WHITE,
                bgcolor: DARK_BLUE,
            },
            steps: [{ down: [{ actionId: 'setPtpDomain', options: { domain: domain } }], up: [] }],
            feedbacks: [],
        };
    }
    // ==================== DEVICE CONTROL PRESETS ====================
    presets['device_reboot'] = {
        type: 'button',
        category: 'Device Control',
        name: 'Reboot Device',
        style: {
            text: 'REBOOT\\n(HOLD)',
            size: '14',
            color: WHITE,
            bgcolor: RED,
        },
        steps: [{ down: [], up: [] }],
        feedbacks: [],
    };
    // ==================== ALERT INDICATORS ====================
    presets['alert_health_error'] = {
        type: 'button',
        category: 'Alert Indicators',
        name: 'Health Error Alert',
        style: {
            text: 'HEALTH\\nOK',
            size: '14',
            color: WHITE,
            bgcolor: GREEN,
        },
        steps: [{ down: [{ actionId: 'fetchHealthStatus', options: {} }], up: [] }],
        feedbacks: [
            {
                feedbackId: 'healthStatus',
                options: { status: 'Errors', showText: true },
                style: {
                    bgcolor: RED,
                    text: 'HEALTH\\nERROR!',
                },
            },
            {
                feedbackId: 'healthStatus',
                options: { status: 'Warnings', showText: true },
                style: {
                    bgcolor: YELLOW,
                    text: 'HEALTH\\nWARN',
                },
            },
        ],
    };
    presets['alert_alarm_active'] = {
        type: 'button',
        category: 'Alert Indicators',
        name: 'Alarm Active Alert',
        style: {
            text: 'NO\\nALARMS',
            size: '14',
            color: WHITE,
            bgcolor: GREEN,
        },
        steps: [{ down: [{ actionId: 'fetchAlarmList', options: {} }], up: [] }],
        feedbacks: [
            {
                feedbackId: 'alarmCount',
                options: { condition: 'gt', threshold: 0, showCount: true },
                style: {
                    bgcolor: RED,
                    text: 'ALARM!',
                },
            },
        ],
    };
    presets['alert_ptp_unlocked'] = {
        type: 'button',
        category: 'Alert Indicators',
        name: 'PTP Unlocked Alert',
        style: {
            text: 'PTP\\nLOCKED',
            size: '14',
            color: WHITE,
            bgcolor: GREEN,
        },
        steps: [{ down: [{ actionId: 'fetchPtpStatus', options: {} }], up: [] }],
        feedbacks: [
            {
                feedbackId: 'ptpStatus',
                options: { status: 'notLocked', showText: true },
                style: {
                    bgcolor: RED,
                    text: 'PTP\\nUNLOCKED!',
                },
            },
        ],
    };
    presets['alert_disconnected'] = {
        type: 'button',
        category: 'Alert Indicators',
        name: 'Disconnected Alert',
        style: {
            text: 'RSP\\nONLINE',
            size: '14',
            color: WHITE,
            bgcolor: GREEN,
        },
        steps: [{ down: [], up: [] }],
        feedbacks: [
            {
                feedbackId: 'connectionStatus',
                options: { showText: false },
                style: {
                    bgcolor: GREEN,
                },
                isInverted: true,
            },
        ],
    };
    return presets;
}
//# sourceMappingURL=presets.js.map
export function getConfigFields() {
    return [
        {
            type: 'static-text',
            id: 'info',
            width: 12,
            label: 'Information',
            value: 'This module controls Riedel Smart Panels via WebSocket.',
        },
        {
            type: 'textinput',
            id: 'host',
            label: 'Panel IP Address',
            width: 8,
            default: '',
            regex: '/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/',
        },
        {
            type: 'number',
            id: 'port',
            label: 'WebSocket Port',
            width: 4,
            default: 80,
            min: 1,
            max: 65535,
        },
    ];
}
//# sourceMappingURL=config.js.map
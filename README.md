# Auto Close Tabs Firefox Extension

A Firefox extension that automatically closes inactive tabs after a configurable time period since I am a lazy bum.

## Features

- **Automatic Tab Closing**: Closes tabs that haven't been used for a specified time period
- **Configurable Timeout**: Set timeout in hours or days (1 hour to 30 days)
- **Whitelist Support**: Exclude specific URLs or patterns from auto-closing
- **Pinned Tab Protection**: Pinned tabs are never automatically closed
- **Real-time Tab Monitoring**: View current tabs and their inactive time in the popup
- **Easy Toggle**: Enable/disable the extension without uninstalling

## Usage

1. Click the extension icon in the toolbar to open settings
2. Configure your preferred timeout (default: 24 hours)
3. Add any URLs to whitelist (optional)
4. Enable automatic tab closing
5. Save settings

The extension will check for inactive tabs every 5 minutes and close them according to settings set.

## Permissions

- `tabs` - Access tab information and close tabs
- `activeTab` - Track active tab changes
- `storage` - Save user preferences
- `alarms` - Schedule periodic tab cleanup

## Configuration Options

- **Enable/Disable**: Toggle automatic tab closing
- **Timeout Period**: 1-720 hours or 1-30 days
- **Whitelist**: URL patterns to exclude from auto-closing
- **Tab Status**: View real-time tab activity and which tabs will be closed

## Notes

- The extension starts tracking tab activity immediately upon installation
- Tabs are checked every 5 minutes for inactivity
- Pinned tabs and whitelisted URLs are never closed
- Settings are preserved across browser sessions
- Project is still work in progress

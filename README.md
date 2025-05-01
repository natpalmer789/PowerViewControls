# PowerViewControls
An implementation of the Hunter Douglas power view blinds app interface as a custom card in Home Assistant.

## Overview
PowerViewControls is a custom Home Assistant card designed to control top down bottom up window blinds. This card allows users to adjust the position of the blinds from both the top and bottom, providing flexibility in light control and privacy.

## Features
- Control the top and bottom positions of window blinds independently.
- Intuitive slider interface for precise adjustments.
- Custom button elements for quick actions.
- Responsive design that integrates seamlessly with Home Assistant.
- Configurable entity attributes for top/bottom positions.
- Localization support (English included).
- Visual indication and disabled controls when the entity is unavailable.

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/PowerViewControls.git
   ```
2. Navigate to the project directory:
   ```
   cd PowerViewControls
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Installation (for End Users)

1.  **Build the Card:**
    *   If you have the source code, run `npm install` and then `npm run build` in the project directory.
    *   Alternatively, download the latest release `.js` file (e.g., `power-view-card.js`) from the [Releases page](https://github.com/yourusername/PowerViewControls/releases) (if available).

2.  **Copy to Home Assistant:**
    *   Copy the built JavaScript file (e.g., `dist/power-view-card.js` or the downloaded file) into your Home Assistant configuration's `www` directory. You might need to create the `www` folder if it doesn't exist (e.g., `/config/www/`).

3.  **Add Resource Reference:**
    *   **UI Method (Recommended):** Go to Home Assistant Settings -> Dashboards -> More Options (three dots) -> Resources. Click "Add Resource".
        *   Set URL to `/local/power-view-card.js` (replace `power-view-card.js` with the actual filename you copied).
        *   Set Resource Type to "JavaScript Module".
    *   **YAML Method:** Add the following to your `configuration.yaml` (or `ui-lovelace.yaml` if using YAML mode):
        ```yaml
        lovelace:
          resources:
            - url: /local/power-view-card.js
              type: module
        ```
        *Note: `/local/` maps to the `www` directory.* Restart Home Assistant after editing YAML.

4.  **Add Card to Dashboard:**
    *   Go to the dashboard where you want to add the card and click "Edit Dashboard".
    *   Click "Add Card".
    *   Search for "Custom: PowerView Card" at the bottom of the card list.
    *   Configure the required `entity` field and optional settings.
    *   Click "Save".

## Usage

### Card Configuration

The `power-view-card` accepts the following configuration options in the Lovelace UI editor or YAML:

-   `type`: (Required) `custom:power-view-card`
-   `entity`: (Required) The entity ID of the cover entity to control.
-   `title`: (Optional) A custom title for the card.
-   `top_position_attribute`: (Optional) The name of the state attribute that represents the top blind position (0-100). Defaults to `current_position_tilt`.
-   `bottom_position_attribute`: (Optional) The name of the state attribute that represents the bottom blind position (0-100). Defaults to `current_position`.

**Example YAML:**

```yaml
type: custom:power-view-card
entity: cover.living_room_blind
title: Living Room Blind
top_position_attribute: top_position # Example if your integration uses this
bottom_position_attribute: bottom_position # Example if your integration uses this
```

## Development
To start developing, you can run the following command to watch for changes:
```
npm run watch
```

## Localization
The card supports localization. Currently, English (`en.json`) translations are provided in the `locales/` directory. Home Assistant will automatically use the appropriate language based on the user's profile settings.

To add translations for another language:
1. Copy `locales/en.json` to a new file named `locales/<language_code>.json` (e.g., `locales/de.json` for German).
2. Translate the values in the new file.
3. The build process should automatically include the new locale file.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.
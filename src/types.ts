import { LovelaceCardConfig as HACardConfig } from 'home-assistant-js-websocket';

export interface BlindsPosition {
    top: number;
    bottom: number;
}

// Define the configuration interface for your card
export interface LovelaceCardConfig extends HACardConfig {
  entity: string; // The cover entity ID
  title?: string; // Optional title for the card
  top_position_attribute?: string; // Optional: Attribute for top position (defaults to current_position_tilt)
  bottom_position_attribute?: string; // Optional: Attribute for bottom position (defaults to current_position)
  // Add any other configuration options specific to your card here
}

// You might also want to define the LovelaceCard interface if not importing it elsewhere
// Although it's often implicitly handled by implementing the required methods
export interface LovelaceCard {
    getCardSize(): number | Promise<number>;
    setConfig(config: LovelaceCardConfig): void;
    // Optional methods
    hass?: HomeAssistant;
}

// Re-export HomeAssistant type if needed elsewhere
export type { HomeAssistant } from 'home-assistant-js-websocket';
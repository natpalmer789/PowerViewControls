import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, LovelaceCardEditor, fireEvent } from 'home-assistant-js-websocket'; // Ensure fireEvent is imported
import { LovelaceCard, LovelaceCardConfig } from './types'; // Assuming types.ts exists
import './power-view-card-editor'; // Import the editor element

// Constants for cover features (adjust if HA changes these)
const SUPPORT_OPEN = 1;
const SUPPORT_CLOSE = 2;
const SUPPORT_STOP = 8;
const SUPPORT_SET_POSITION = 4;
const SUPPORT_SET_TILT_POSITION = 128;

// Helper function to get the localize function from hass
// This might vary slightly depending on HA frontend structure, but hass.localize is common
const getLocalize = (hass: HomeAssistant | undefined) => hass?.localize || ((key: string) => key); // Fallback to key if localize not found

@customElement('power-view-card')
export class PowerViewCard extends LitElement implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    // Return an instance of our editor element
    return document.createElement('power-view-card-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    // Return a minimal valid configuration for the card
    return { entity: "cover.my_blind" }; // Example entity
  }

  @property({ attribute: false }) hass!: HomeAssistant;

  @state() private _config!: LovelaceCardConfig;
  @state() private _topPosition: number = 100; // Default to fully open top
  @state() private _bottomPosition: number = 0; // Default to fully closed bottom
  @state() private _draggingHandle: 'top' | 'bottom' | null = null;
  @state() private _windowHeight: number = 0; // To store the height for calculations

  public setConfig(config: LovelaceCardConfig): void {
    if (!config || !config.entity) {
      throw new Error('Invalid configuration: entity is required');
    }
    // Add more validation as needed
    this._config = config;
  }

  public getCardSize(): number {
    // Return the height of the card in Lovelace units (usually 1 = 50px)
    return 3; // Adjust as needed
  }

  // Called when the component is connected to the DOM
  connectedCallback() {
    super.connectedCallback();
    // Initialize positions when the card is first loaded
    this._updatePositionsFromState();
  }

  // Called when properties change
  updated(changedProperties: Map<string | number | symbol, unknown>) {
    super.updated(changedProperties);
    // Only update from hass state if we are NOT currently dragging
    if (changedProperties.has('hass') && !this._draggingHandle) {
      this._updatePositionsFromState();
    }
  }

  private _updatePositionsFromState(): void {
    if (this._draggingHandle) return;
    if (!this.hass || !this._config) return;

    const stateObj = this.hass.states[this._config.entity];
    if (stateObj && stateObj.attributes) {
      // Get attribute names from config, with defaults
      const bottomAttr = this._config.bottom_position_attribute || 'current_position';
      const topAttr = this._config.top_position_attribute || 'current_position_tilt';

      // Read positions using configured or default attribute names
      const bottom = stateObj.attributes[bottomAttr] ?? this._bottomPosition;
      const top = stateObj.attributes[topAttr] ?? this._topPosition;

      // Only update state if the values actually changed
      if (bottom !== this._bottomPosition) {
          this._bottomPosition = bottom;
      }
      if (top !== this._topPosition) {
          this._topPosition = top;
      }
    }
  }

  // Helper to check supported features
  private _supportsFeature(feature: number): boolean {
    if (!this.hass || !this._config) return false;
    const stateObj = this.hass.states[this._config.entity];
    return (stateObj?.attributes.supported_features & feature) !== 0;
  }

  private _handlePointerDown(e: PointerEvent, handle: 'top' | 'bottom'): void {
    if (!this.hass || !this._config || this.hass.states[this._config.entity]?.state === 'unavailable') {
      return;
    }
    // Prevent dragging top handle if tilt position is not supported
    if (handle === 'top' && !this._supportsFeature(SUPPORT_SET_TILT_POSITION)) {
        console.warn('Top handle (tilt) control not supported by this entity.');
        return;
    }
    // Prevent dragging bottom handle if position is not supported (less common, but possible)
    if (handle === 'bottom' && !this._supportsFeature(SUPPORT_SET_POSITION)) {
        console.warn('Bottom handle (position) control not supported by this entity.');
        return;
    }

    const windowContainer = this.shadowRoot.querySelector('.window-container');
    if (!windowContainer) return;

    this._draggingHandle = handle;
    this._windowHeight = windowContainer.clientHeight;
    const targetElement = e.target as HTMLElement;
    targetElement.setPointerCapture(e.pointerId);
    targetElement.classList.add('dragging'); // Add dragging class
    this.style.cursor = 'grabbing'; // Change cursor for visual feedback

    // Add listeners to the window for move and up events
    window.addEventListener('pointermove', this._handlePointerMove);
    window.addEventListener('pointerup', this._handlePointerUp);
    window.addEventListener('pointercancel', this._handlePointerUp); // Also handle cancel
  }

  private _handlePointerMove = (e: PointerEvent): void => {
    if (!this._draggingHandle || !this.shadowRoot) return;

    const windowContainer = this.shadowRoot.querySelector('.window-container');
    if (!windowContainer) return;

    const rect = windowContainer.getBoundingClientRect();
    const y = e.clientY - rect.top; // Y position relative to the window container
    let newPositionPercent = Math.max(0, Math.min(100, 100 - (y / this._windowHeight) * 100));
    newPositionPercent = Math.round(newPositionPercent); // Round to nearest integer

    if (this._draggingHandle === 'top') {
      this._topPosition = newPositionPercent;
      // If top goes below bottom, push bottom down
      if (this._topPosition < this._bottomPosition) {
        this._bottomPosition = this._topPosition;
      }
    } else { // Dragging bottom handle
      this._bottomPosition = newPositionPercent;
      // If bottom goes above top, push top up
      if (this._bottomPosition > this._topPosition) {
        this._topPosition = this._bottomPosition;
      }
    }
    // No HA service call here, wait for pointer up
  }

  private _handlePointerUp = (e: PointerEvent): void => {
    if (!this._draggingHandle) return;

    const targetElement = e.target as HTMLElement;
    targetElement.releasePointerCapture(e.pointerId);
    targetElement.classList.remove('dragging'); // Remove dragging class
    this.style.cursor = 'default'; // Restore default cursor

    // Call HA service to set the new positions
    this._setBlindPositions();

    this._draggingHandle = null;

    // Remove listeners from the window
    window.removeEventListener('pointermove', this._handlePointerMove);
    window.removeEventListener('pointerup', this._handlePointerUp);
    window.removeEventListener('pointercancel', this._handlePointerUp);
  }

  private async _callService(service: string, options: Record<string, unknown> = {}): Promise<void> {
    if (!this.hass || !this._config) return;
    try {
      await this.hass.callService('cover', service, {
        entity_id: this._config.entity,
        ...options,
      });
    } catch (error: any) {
      console.error('Error calling service:', service, options, error);
      // Show a persistent notification in Home Assistant
      fireEvent(this, 'hass-notification', {
        message: `Error controlling ${this._config.entity}: ${error.message || 'Unknown error'}`,
        persistent: false, // Or true if you want it to stay until dismissed
        notification_id: `powerview_error_${Date.now()}` // Unique ID helps prevent duplicates if needed
      });
    }
  }

  private async _handleOpenClick(): Promise<void> {
    await this._callService('open_cover');
  }

  private async _handleCloseClick(): Promise<void> {
    await this._callService('close_cover');
  }

  private async _handleStopClick(): Promise<void> {
    await this._callService('stop_cover');
  }

  private async _setBlindPositions(): Promise<void> {
    const calls: Promise<void>[] = [];

    // Only call set_cover_position if supported
    if (this._supportsFeature(SUPPORT_SET_POSITION)) {
        calls.push(this._callService('set_cover_position', { position: Math.round(this._bottomPosition) }));
    }

    // Only call set_cover_tilt_position if supported
    if (this._supportsFeature(SUPPORT_SET_TILT_POSITION)) {
        calls.push(this._callService('set_cover_tilt_position', { tilt_position: Math.round(this._topPosition) }));
    }

    if (calls.length > 0) {
        try {
            await Promise.all(calls);
        } catch (error) {
            console.error("Error setting blind positions", error);
            // Error is already handled within _callService
        }
    }
  }

  render() {
    const localize = getLocalize(this.hass);

    if (!this._config || !this.hass) {
      return html``; // Don't render if config or hass is not set
    }

    const stateObj = this.hass.states[this._config.entity];

    if (!stateObj) {
      return html`
        <ha-card header="${this._config.title || localize('card.default_title')}">
          <div class="warning">
            ${localize('card.entity_not_found', { entity: this._config.entity })} 
          </div>
        </ha-card>
      `;
    }

    const isUnavailable = stateObj.state === 'unavailable';
    const supportsTilt = this._supportsFeature(SUPPORT_SET_TILT_POSITION);
    const supportsPosition = this._supportsFeature(SUPPORT_SET_POSITION);
    const supportsOpen = this._supportsFeature(SUPPORT_OPEN);
    const supportsClose = this._supportsFeature(SUPPORT_CLOSE);
    const supportsStop = this._supportsFeature(SUPPORT_STOP);
    const cardTitle = this._config.title || stateObj.attributes.friendly_name || localize('card.default_title');

    // Calculate styles for the blind positions
    const topPercent = this._topPosition;
    const bottomPercent = this._bottomPosition;
    // Height of the shaded area
    const shadeHeight = Math.max(0, topPercent - bottomPercent);
    // Position of the shaded area from the top
    const shadeTop = 100 - topPercent;

    return html`
      <ha-card header="${cardTitle}">
        <div class="card-content ${isUnavailable ? 'is-unavailable' : ''}">
          <div class="window-container">
            <div class="blind-area">
              <!-- Shaded region representing the blind -->
              <div class="blind-shade" style="top: ${shadeTop}%; height: ${shadeHeight}%;"></div>
              <!-- Top position indicator/handle -->
              ${supportsTilt ? html`
                <div
                  class="blind-handle top-handle"
                  style="top: ${100 - this._topPosition}%;"
                  @pointerdown=${(e: PointerEvent) => this._handlePointerDown(e, 'top')}
                ></div>
              ` : ''}
              <!-- Bottom position indicator/handle -->
              ${supportsPosition ? html`
                <div
                  class="blind-handle bottom-handle"
                  style="bottom: ${this._bottomPosition}%;"
                  @pointerdown=${(e: PointerEvent) => this._handlePointerDown(e, 'bottom')}
                ></div>
              ` : ''}
            </div>
            ${isUnavailable ? html`<div class="unavailable-overlay">Unavailable</div>` : ''}
          </div>
          <!-- Display current values (optional) -->
          <div class="position-info">
            <span>Top: ${isUnavailable || !supportsTilt ? '-' : Math.round(this._topPosition) + '%'}</span>
            <span>Bottom: ${isUnavailable || !supportsPosition ? '-' : Math.round(this._bottomPosition) + '%'}</span>
          </div>
          <!-- Action Buttons -->
          <div class="action-buttons">
            <ha-icon-button
              icon="hass:arrow-up"
              @click=${this._handleOpenClick}
              title="${localize('common.open')}"
              .disabled=${isUnavailable || !supportsOpen}
            ></ha-icon-button>
            <ha-icon-button
              icon="hass:stop"
              @click=${this._handleStopClick}
              title="${localize('common.stop')}"
              .disabled=${isUnavailable || !supportsStop}
            ></ha-icon-button>
            <ha-icon-button
              icon="hass:arrow-down"
              @click=${this._handleCloseClick}
              title="${localize('common.close')}"
              .disabled=${isUnavailable || !supportsClose}
            ></ha-icon-button>
          </div>
        </div>
      </ha-card>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    .warning {
        color: var(--error-color);
        padding: 16px;
    }
    .card-content {
        padding: 16px;
        padding-top: 8px; /* Reduce top padding slightly */
    }
    .window-container {
      position: relative;
      height: 200px; /* Adjust height as needed */
      width: 100px; /* Adjust width as needed */
      background-color: var(--paper-card-background-color, white); /* Use HA theme variable */
      border: 2px solid var(--divider-color, #ccc);
      border-radius: 4px; /* Slightly rounded corners */
      margin: 10px auto; /* Center the window */
      overflow: hidden; /* Hide handles outside the area */
      box-shadow: inset 0 0 5px rgba(0,0,0,0.1); /* Inner shadow for depth */
    }
    .blind-area {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        /* Subtle gradient for window effect */
        background: linear-gradient(to bottom, #e0f2f7, #b3e5fc);
        overflow: hidden; /* Ensure handles stay within */
    }
    .blind-shade {
        position: absolute;
        left: 0;
        right: 0;
        background-color: var(--primary-text-color, #444); /* Use text color for shade */
        opacity: 0.6; /* Slightly less opaque */
        pointer-events: none; /* Allow clicks to pass through */
    }
    .blind-handle {
        position: absolute;
        left: 0px; /* Slightly outside border */
        right: 0px; /* Slightly outside border */
        height: 8px; /* Make handles slightly taller */
        background-color: var(--primary-color, blue); /* Use HA theme variable */
        cursor: grab; /* Indicate draggability */
        border-top: 1px solid rgba(255, 255, 255, 0.5); /* Highlight top */
        border-bottom: 1px solid rgba(0, 0, 0, 0.3); /* Shadow bottom */
        border-left: none;
        border-right: none;
        box-sizing: border-box;
        touch-action: none; /* Prevent scrolling on touch devices */
        transition: background-color 0.2s ease-in-out; /* Smooth transition */
    }
    .blind-handle::before { /* Add small indicator within handle */
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 20px;
        height: 2px;
        background-color: rgba(255, 255, 255, 0.7);
        border-radius: 1px;
    }
    .blind-handle.dragging {
        background-color: var(--accent-color, red); /* Use HA theme variable or fallback */
        border-color: var(--accent-color, red);
    }
    .top-handle {
        /* Style specific to top handle if needed */
    }
    .bottom-handle {
        /* Style specific to bottom handle if needed */
    }
    .position-info {
        display: flex;
        justify-content: space-around;
        margin-top: 10px;
        font-size: 0.9em;
    }
    .action-buttons {
        display: flex;
        justify-content: space-around;
        margin-top: 16px;
        padding-top: 8px;
        border-top: 1px solid var(--divider-color, #ccc);
    }
    ha-icon-button {
        cursor: pointer;
        --mdc-icon-button-size: 40px; /* Adjust size if needed */
    }
    .card-content.is-unavailable .window-container {
        opacity: 0.5;
        pointer-events: none; /* Disable clicks/drags on window area */
    }
    .card-content.is-unavailable .position-info {
        opacity: 0.7;
    }
    .unavailable-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(128, 128, 128, 0.5); /* Semi-transparent grey */
        color: white;
        font-weight: bold;
        border-radius: 4px; /* Match container */
        pointer-events: none; /* Allow underlying elements to be seen if needed, though container disables interaction */
    }
    .card-content.is-unavailable .blind-handle {
        cursor: not-allowed;
    }
    .blind-handle.top-handle:not([style*="top"]) { /* Hide if not rendered via template */
        display: none;
    }
    .blind-handle.bottom-handle:not([style*="bottom"]) { /* Hide if not rendered via template */
        display: none;
    }
  `;
}
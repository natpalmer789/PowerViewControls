import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { HomeAssistant, LovelaceCardEditor, fireEvent } from 'home-assistant-js-websocket';
import { LovelaceCardConfig } from './types';
// Ensure necessary elements are imported if not globally available
// import '@material/mwc-textfield'; // If using ha-textfield elsewhere
// import '@material/mwc-switch'; // If using ha-switch
// import '@ha/components/ha-entity-picker'; // Import ha-entity-picker

// Helper function (can be shared or redefined)
const getLocalize = (hass: HomeAssistant | undefined) => hass?.localize || ((key: string) => key);

@customElement('power-view-card-editor')
export class PowerViewCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) hass?: HomeAssistant;
  @state() private _config?: LovelaceCardConfig;

  public setConfig(config: LovelaceCardConfig): void {
    this._config = config;
  }

  private _valueChanged(ev: CustomEvent): void {
    if (!this._config || !this.hass || !ev.target) {
      return;
    }
    const target = ev.target as any; // Use any or specific type for HA elements
    let value = target.value;

    // Handle specific elements like checkboxes/switches if needed
    if (target.type === 'checkbox' && target.checked !== undefined) {
      value = target.checked;
    }

    // Get the config key from the element's configValue property or name
    const configKey = target.configValue || target.name;
    if (!configKey) return; // Don't proceed if we don't know what config to update

    const newConfig = {
      ...this._config,
      [configKey]: value,
    };

    // Fire event to notify HA of changes
    fireEvent(this, 'config-changed', { config: newConfig });
  }

  render() {
    const localize = getLocalize(this.hass);

    if (!this.hass || !this._config) {
      return html``;
    }

    return html`
      <div class="card-config">
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this._config.entity || ''}
          .configValue=${'entity'} /* Use configValue for clarity */
          .includeDomains=${['cover']} /* Filter for cover entities */
          label="${localize('editor.entity')}"
          allow-custom-entity
          @value-changed=${this._valueChanged}
        ></ha-entity-picker>

        <ha-textfield
          label="${localize('editor.title')}"
          .value=${this._config.title || ''}
          .configValue=${'title'}
          @input=${this._valueChanged} /* Standard input event for textfield */
        ></ha-textfield>

        <ha-textfield
          label="${localize('editor.top_position_attribute')}"
          .value=${this._config.top_position_attribute || ''}
          .placeholder=${'current_position_tilt'} /* Show default */
          .configValue=${'top_position_attribute'}
          helper="${localize('editor.top_position_attribute_helper')}"
          persistent-helper
          @input=${this._valueChanged}
        ></ha-textfield>

        <ha-textfield
          label="${localize('editor.bottom_position_attribute')}"
          .value=${this._config.bottom_position_attribute || ''}
          .placeholder=${'current_position'} /* Show default */
          .configValue=${'bottom_position_attribute'}
          helper="${localize('editor.bottom_position_attribute_helper')}"
          persistent-helper
          @input=${this._valueChanged}
        ></ha-textfield>
      </div>
    `;
  }

  static styles = css`
    .card-config {
      display: flex;
      flex-direction: column;
      gap: 16px; /* Increased gap for better spacing */
      padding: 16px;
    }
    ha-textfield,
    ha-entity-picker {
        width: 100%;
    }
    ha-textfield {
        display: block; /* Ensure helpers are shown correctly */
    }
  `;
}

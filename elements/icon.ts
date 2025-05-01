class CustomIcon extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['icon', 'size', 'color'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.render();
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const icon = this.getAttribute('icon') || 'default-icon';
        const size = this.getAttribute('size') || '24px';
        const color = this.getAttribute('color') || 'black';

        this.shadowRoot.innerHTML = `
            <style>
                .icon {
                    width: ${size};
                    height: ${size};
                    fill: ${color};
                }
            </style>
            <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <use href="#${icon}"></use>
            </svg>
        `;
    }
}

customElements.define('custom-icon', CustomIcon);
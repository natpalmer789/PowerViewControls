class CustomButton extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                button {
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 10px 15px;
                    cursor: pointer;
                    font-size: 16px;
                }
                button:hover {
                    background-color: #0056b3;
                }
            </style>
            <button id="custom-button">Click Me</button>
        `;
        this.shadowRoot.getElementById('custom-button').addEventListener('click', this.handleClick.bind(this));
    }

    handleClick() {
        this.dispatchEvent(new CustomEvent('button-click', {
            detail: { message: 'Button clicked!' },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('custom-button', CustomButton);
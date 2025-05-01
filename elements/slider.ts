class CustomSlider extends HTMLElement {
    private slider: HTMLInputElement;
    private topPosition: number;
    private bottomPosition: number;

    constructor() {
        super();
        this.topPosition = 0;
        this.bottomPosition = 100;
        this.slider = document.createElement('input');
        this.slider.type = 'range';
        this.slider.min = '0';
        this.slider.max = '100';
        this.slider.value = '50';
        this.slider.addEventListener('input', this.handleInput.bind(this));
    }

    connectedCallback() {
        this.render();
    }

    private render() {
        this.innerHTML = '';
        this.appendChild(this.slider);
    }

    private handleInput(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.updatePositions(value);
    }

    private updatePositions(value: string) {
        const position = parseInt(value, 10);
        this.topPosition = position;
        this.bottomPosition = 100 - position;
        this.dispatchEvent(new CustomEvent('position-changed', {
            detail: { top: this.topPosition, bottom: this.bottomPosition },
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('custom-slider', CustomSlider);
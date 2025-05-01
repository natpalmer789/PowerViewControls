const styles = `
  .power-view-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    background-color: #f9f9f9;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .slider-container {
    width: 100%;
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
  }

  .slider {
    -webkit-appearance: none;
    width: 100%;
    height: 8px;
    border-radius: 5px;
    background: #ddd;
    outline: none;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #4CAF50;
    cursor: pointer;
  }

  .shaded-region {
    width: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    transition: height 0.3s ease;
  }
`;

export default styles;
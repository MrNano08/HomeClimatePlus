import './index.css';     // << debe estar
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './HomePage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
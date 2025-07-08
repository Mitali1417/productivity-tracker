import React from 'react';
import { createRoot } from 'react-dom/client';
import OptionsApp from './OptionsApp';
import '../index.css';

const root = createRoot(document.getElementById('options-root')!);
root.render(<OptionsApp />);
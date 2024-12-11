import { Application } from '@nativescript/core';
import { initializeServices } from './shared/services';

// Initialize all services before starting the application
initializeServices();

Application.run({ moduleName: 'app-root' });
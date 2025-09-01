/**
 * CRM Module
 * Main export file for the CRM module
 */

// Controllers
export { contactsController } from './controllers/contacts-controller';
export { companiesController } from './controllers/companies-controller';

// Services
export { CrmObjectService } from './services/crm-object.service';

// Create the main CRM router
import { Hono } from 'hono';
import { contactsController } from './controllers/contacts-controller';
import { companiesController } from './controllers/companies-controller';

export const crmRouter = new Hono();

// Mount controllers
crmRouter.route('/contacts', contactsController);
crmRouter.route('/companies', companiesController);

// CRM module info
crmRouter.get('/', (c) => {
  return c.json({
    module: 'CRM',
    version: '1.0.0',
    endpoints: {
      contacts: '/api/v1/crm/contacts',
      companies: '/api/v1/crm/companies',
    },
  });
});
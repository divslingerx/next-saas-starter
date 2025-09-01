/**
 * Contacts Controller
 * HTTP route handlers for contacts endpoints
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { CrmObjectService } from '../services/crm-object.service';
import type { AppContext } from '../../../core/types/hono';

const app = new Hono<{ Variables: { organizationId: string; userId: string } }>();

// Validation schemas
const contactCreateSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  primaryCompanyId: z.number().optional(),
  preferredContactMethod: z.string().default('email'),
  timezone: z.string().optional(),
  customProperties: z.record(z.any()).default({}),
});

const contactUpdateSchema = contactCreateSchema.partial();

const contactSearchSchema = z.object({
  search: z.string().optional(),
  filters: z.record(z.any()).default({}),
  page: z.number().default(0),
  limit: z.number().default(50),
});

// Get all contacts
app.get('/', zValidator('query', contactSearchSchema), async (c) => {
  const { search, filters, page, limit } = c.req.valid('query');
  const organizationId = c.get('organizationId');

  try {
    const result = await CrmObjectService.search('contacts', organizationId, filters, {
      limit,
      offset: page * limit,
    });

    return c.json({
      success: true,
      data: result.records,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch contacts',
      },
      500
    );
  }
});

// Get contact by ID
app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const organizationId = c.get('organizationId');

  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid contact ID' }, 400);
  }

  try {
    const contact = await CrmObjectService.findById('contacts', id, organizationId);

    if (!contact) {
      return c.json({ success: false, error: 'Contact not found' }, 404);
    }

    return c.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error('Error fetching contact:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch contact',
      },
      500
    );
  }
});

// Create new contact
app.post('/', zValidator('json', contactCreateSchema), async (c) => {
  const data = c.req.valid('json');
  const organizationId = c.get('organizationId');

  try {
    const { customProperties, ...contactData } = data;
    
    const contact = await CrmObjectService.create(
      'contacts',
      organizationId,
      contactData,
      customProperties
    );

    return c.json({
      success: true,
      data: contact,
    }, 201);
  } catch (error) {
    console.error('Error creating contact:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create contact',
      },
      500
    );
  }
});

// Update contact
app.patch('/:id', zValidator('json', contactUpdateSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  const organizationId = c.get('organizationId');

  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid contact ID' }, 400);
  }

  try {
    const { customProperties, ...contactData } = data;
    
    const contact = await CrmObjectService.update(
      'contacts',
      id,
      organizationId,
      contactData,
      customProperties || {}
    );

    return c.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update contact',
      },
      500
    );
  }
});

// Delete contact
app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const organizationId = c.get('organizationId');

  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid contact ID' }, 400);
  }

  try {
    const success = await CrmObjectService.delete('contacts', id, organizationId);

    if (!success) {
      return c.json({ success: false, error: 'Contact not found' }, 404);
    }

    return c.json({
      success: true,
      message: 'Contact deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete contact',
      },
      500
    );
  }
});

// Get contact stats
app.get('/stats', async (c) => {
  const organizationId = c.get('organizationId');

  try {
    // For now, return mock stats - in production, you'd calculate these from the database
    const stats = {
      total: 0,
      decisionMakers: 0,
      recent: 0,
      companiesRepresented: 0,
    };

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching contact stats:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
      },
      500
    );
  }
});

export { app as contactsController };
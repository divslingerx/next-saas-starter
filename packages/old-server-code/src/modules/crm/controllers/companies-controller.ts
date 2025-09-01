/**
 * Companies Controller
 * HTTP route handlers for companies endpoints
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { CrmObjectService } from '../services/crm-object.service';

const app = new Hono<{ Variables: { organizationId: string; userId: string } }>();

// Validation schemas
const companyCreateSchema = z.object({
  name: z.string().min(1),
  domain: z.string().optional(),
  industry: z.string().optional(),
  sizeCategory: z.string().optional(),
  annualRevenue: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  clientType: z.string().default('prospect'),
  customProperties: z.record(z.any()).default({}),
});

const companyUpdateSchema = companyCreateSchema.partial();

const companySearchSchema = z.object({
  search: z.string().optional(),
  filters: z.record(z.any()).default({}),
  page: z.number().default(0),
  limit: z.number().default(50),
});

// Get all companies
app.get('/', zValidator('query', companySearchSchema), async (c) => {
  const { search, filters, page, limit } = c.req.valid('query');
  const organizationId = c.get('organizationId');

  try {
    const result = await CrmObjectService.search('companies', organizationId, filters, {
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
    console.error('Error fetching companies:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch companies',
      },
      500
    );
  }
});

// Get company by ID
app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const organizationId = c.get('organizationId');

  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid company ID' }, 400);
  }

  try {
    const company = await CrmObjectService.findById('companies', id, organizationId);

    if (!company) {
      return c.json({ success: false, error: 'Company not found' }, 404);
    }

    return c.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('Error fetching company:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch company',
      },
      500
    );
  }
});

// Create new company
app.post('/', zValidator('json', companyCreateSchema), async (c) => {
  const data = c.req.valid('json');
  const organizationId = c.get('organizationId');

  try {
    const { customProperties, ...companyData } = data;
    
    const company = await CrmObjectService.create(
      'companies',
      organizationId,
      companyData,
      customProperties
    );

    return c.json({
      success: true,
      data: company,
    }, 201);
  } catch (error) {
    console.error('Error creating company:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create company',
      },
      500
    );
  }
});

// Update company
app.patch('/:id', zValidator('json', companyUpdateSchema), async (c) => {
  const id = parseInt(c.req.param('id'));
  const data = c.req.valid('json');
  const organizationId = c.get('organizationId');

  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid company ID' }, 400);
  }

  try {
    const { customProperties, ...companyData } = data;
    
    const company = await CrmObjectService.update(
      'companies',
      id,
      organizationId,
      companyData,
      customProperties || {}
    );

    return c.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('Error updating company:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update company',
      },
      500
    );
  }
});

// Delete company
app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const organizationId = c.get('organizationId');

  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid company ID' }, 400);
  }

  try {
    const success = await CrmObjectService.delete('companies', id, organizationId);

    if (!success) {
      return c.json({ success: false, error: 'Company not found' }, 404);
    }

    return c.json({
      success: true,
      message: 'Company deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting company:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete company',
      },
      500
    );
  }
});

// Get company stats
app.get('/stats', async (c) => {
  const organizationId = c.get('organizationId');

  try {
    // For now, return mock stats - in production, you'd calculate these from the database
    const stats = {
      total: 0,
      prospects: 0,
      clients: 0,
      recent: 0,
    };

    return c.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching company stats:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
      },
      500
    );
  }
});

export { app as companiesController };
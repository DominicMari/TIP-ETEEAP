// Example of how your /api/templates route should handle POST requests
import fs from 'fs';
import path from 'path';

const templatesFilePath = path.join(process.cwd(), 'data', 'templates.json');

export async function POST(req: Request) {
  try {
    const updatedTemplates = await req.json(); // Get the new list of templates from the request body

    // Write the updated templates array back to the JSON file
    fs.writeFileSync(templatesFilePath, JSON.stringify(updatedTemplates, null, 2), 'utf-8');

    return new Response(JSON.stringify(updatedTemplates), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error updating templates.json:', error);
    return new Response(JSON.stringify({ error: 'Failed to update templates' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// You should also have a GET handler to read the templates
export async function GET() {
  try {
    const templates = JSON.parse(fs.readFileSync(templatesFilePath, 'utf-8'));
    return new Response(JSON.stringify(templates), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error reading templates.json:', error);
    return new Response(JSON.stringify({ error: 'Failed to read templates' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Template ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let templates: any[] = [];
    if (fs.existsSync(templatesFilePath)) {
      templates = JSON.parse(fs.readFileSync(templatesFilePath, 'utf-8'));
    }

    const initialLength = templates.length;
    const updatedTemplates = templates.filter(t => t.id !== parseInt(id));

    if (updatedTemplates.length === initialLength) {
      return new Response(JSON.stringify({ error: 'Template not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    fs.writeFileSync(templatesFilePath, JSON.stringify(updatedTemplates, null, 2), 'utf-8');

    return new Response(JSON.stringify({ message: 'Template deleted successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error deleting template from templates.json:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete template' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
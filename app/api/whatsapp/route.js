// app/api/whatsapp/route.js
// app/api/whatsapp/route.js
import { Twilio } from 'twilio';
import { NextResponse } from 'next/server';
import { listings } from '@/config/listings';

// Track ongoing requests
const requestStore = {
  requests: new Map(),
  lastId: 0,
  addRequest(req) {
    const id = ++this.lastId;
    this.requests.set(id, {
      id,
      timestamp: new Date().toISOString(),
      ...req,
      status: 'processing'
    });
    return id;
  },
  updateRequest(id, updates) {
    const req = this.requests.get(id);
    if (req) this.requests.set(id, { ...req, ...updates });
  }
};

const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Session management
const sessions = new Map();

async function parsePropertySelection(userInput) {
  try {
    const propertiesList = listings.map(p => 
      `${p.code}: ${p.address} - ${p.price} (${p.features})`
    ).join('\n');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1',
        messages: [{
          role: 'user',
          content: `Identify property code from:\n${propertiesList}\n\nUser input: "${userInput}"\nRespond ONLY with the matching code.`
        }],
        temperature: 0.2
      })
    });

    // Check for HTTP errors
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error:', response.status, errorBody);
      return null;
    }

    const responseData = await response.json();
    
    // Validate response structure
    if (!responseData.choices || 
        !Array.isArray(responseData.choices) || 
        responseData.choices.length === 0 ||
        !responseData.choices[0].message ||
        !responseData.choices[0].message.content) {
      console.error('Invalid API response structure:', responseData);
      return null;
    }

    const responseText = responseData.choices[0].message.content.trim();
    return listings.some(p => p.code === responseText) ? responseText : null;

  } catch (error) {
    console.error('Property Parse Error:', error);
    return null;
  }
}

async function parseTimeSelection(userInput, availableTimes) {
  try {
    const timeOptions = availableTimes.map(t => 
      new Date(t).toLocaleString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric'
      })
    ).join('\n');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1',
        messages: [{
          role: 'user',
          content: `Match time input to closest option:\n${timeOptions}\n\nUser input: "${userInput}"\nRespond ONLY with the full ISO datetime (e.g. "2024-03-20T10:00:00").`
        }],
        temperature: 0.1
      })
    });

    // Check for HTTP errors
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error:', response.status, errorBody);
      return null;
    }

    const responseData = await response.json();
    
    // Validate response structure
    if (!responseData.choices || 
        !Array.isArray(responseData.choices) || 
        responseData.choices.length === 0 ||
        !responseData.choices[0].message ||
        !responseData.choices[0].message.content) {
      console.error('Invalid API response structure:', responseData);
      return null;
    }

    const responseTime = responseData.choices[0].message.content.trim();
    return availableTimes.includes(responseTime) ? responseTime : null;

  } catch (error) {
    console.error('Time Parse Error:', error);
    return null;
  }
}

async function handleConversation(userInput, sender) {
  const session = sessions.get(sender) || { state: 'initial' };

  try {
    // Initial state - Property selection
    if (session.state === 'initial') {
      const propertyCode = await parsePropertySelection(userInput);
      
      if (propertyCode) {
        const property = listings.find(p => p.code === propertyCode);
        sessions.set(sender, { 
          state: 'time_selection',
          property,
          availableTimes: property.viewing_times
        });
        
        const timeSlots = property.viewing_times.map(t => 
          new Date(t).toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric'
          })
        ).join('\n');
        
        return `Great choice! ${property.code} at ${property.address}\n\n` +
               `Available times:\n${timeSlots}\n\n` +
               `Please select a time (e.g. "Thursday morning" or "10am")`;
      }

      const propertiesList = listings.map(p => 
        `${p.code}: ${p.address}`
      ).join('\n');
      return `Available properties:\n${propertiesList}\n\n` +
             `Please specify which property you're interested in`;
    }

    // Time selection state
    if (session.state === 'time_selection') {
      const selectedTime = await parseTimeSelection(userInput, session.availableTimes);
      
      if (selectedTime) {
        sessions.set(sender, { 
          ...session, 
          state: 'confirmation',
          selectedTime
        });
        
        const formattedTime = new Date(selectedTime).toLocaleString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric'
        });
        
        return `Confirm appointment for ${session.property.code} on ${formattedTime}?\n` +
               `Reply YES to confirm or NO to choose another time`;
      }
      
      return `Couldn't match your time. Available options:\n${
        session.availableTimes.map(t => 
          new Date(t).toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric'
          })
        ).join('\n')
      }`;
    }

    // Confirmation state
    if (session.state === 'confirmation') {
      if (userInput.toLowerCase().startsWith('y')) {
        const formattedTime = new Date(session.selectedTime).toLocaleString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric'
        });
        
        sessions.delete(sender);
        return `✅ Confirmed!\n\n` +
               `Property: ${session.property.code}\n` +
               `Address: ${session.property.address}\n` +
               `Time: ${formattedTime}\n\n` +
               `You'll receive a reminder 24 hours before your visit.`;
      }
      
      sessions.set(sender, { 
        ...session, 
        state: 'time_selection',
        selectedTime: null
      });
      return `Let's choose a new time for ${session.property.code}:\n${
        session.availableTimes.map(t => 
          new Date(t).toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric'
          })
        ).join('\n')
      }`;
    }

  } catch (error) {
    console.error('Conversation Error:', error);
    sessions.delete(sender);
    return `Let's start over. Which property are you interested in?\n${
      listings.map(p => `${p.code}: ${p.address}`).join('\n')
    }`;
  }
}

function generateHTML() {
  const requests = Array.from(requestStore.requests.values()).reverse();
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Active Requests</title>
        <style>
          body { font-family: monospace; padding: 20px; }
          .request { margin: 10px; padding: 10px; border: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <h1>Active Requests (${requests.length})</h1>
        ${requests.map(req => `
          <div class="request">
            <div>ID: ${req.id}</div>
            <div>Time: ${req.timestamp}</div>
            <div>From: ${req.from}</div>
            <div>Message: ${req.message}</div>
            <div>Status: ${req.status}</div>
            ${req.response ? `<div>Response: ${req.response}</div>` : ''}
          </div>
        `).join('')}
      </body>
    </html>
  `;
}

export async function GET() {
  return new Response(generateHTML(), {
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function POST(request) {
  const reqId = requestStore.addRequest({
    method: 'POST',
    path: '/api/whatsapp',
    from: 'unknown',
    message: 'pending'
  });

  try {
    const formData = await request.formData();
    const incomingMsg = formData.get('Body');
    const sender = formData.get('From');

    requestStore.updateRequest(reqId, {
      from: sender,
      message: incomingMsg
    });

    if (!incomingMsg || !sender) {
      requestStore.updateRequest(reqId, { status: 'invalid' });
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const responseText = await handleConversation(incomingMsg, sender);
    
    await client.messages.create({
      body: responseText,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: sender
    });

    requestStore.updateRequest(reqId, {
      status: 'completed',
      response: responseText
    });

    return new Response(null, { status: 200 });

  } catch (error) {
    requestStore.updateRequest(reqId, {
      status: 'error',
      error: error.message
    });
    
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
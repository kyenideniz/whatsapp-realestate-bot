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
console.log(sessions);
async function detectIntent(userInput) {
  try {
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
          content: `Classify intent: 1) Property list request 2) Property selection 3) Time selection 4) Other\n\nMessage: "${userInput}"\nRespond ONLY with the number.`
        }],
        temperature: 0.1
      })
    });

    const data = await response.json();
    return parseInt(data.choices[0].message.content.trim()) || 4;
  } catch (error) {
    console.error('Intent detection error:', error);
    return 4;
  }
}

async function parsePropertySelection(userInput, properties) {
  try {
    const propertiesList = properties.map(p => 
      `${p.code}: ${p.address} - ${p.price}`
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
          content: `Identify property code from:\n${propertiesList}\n\nUser input: "${userInput}"\nRespond ONLY with the matching code or "none".`
        }],
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error:', response.status, errorBody);
      return null;
    }

    const responseData = await response.json();
    const responseText = responseData.choices[0].message.content.trim();
    return properties.some(p => p.code === responseText) ? responseText : null;
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
          content: `Match time input to closest option:\n${timeOptions}\n\nUser input: "${userInput}"\nRespond ONLY with the full ISO datetime.`
        }],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('API Error:', response.status, errorBody);
      return null;
    }

    const responseData = await response.json();
    const responseTime = responseData.choices[0].message.content.trim();
    return availableTimes.includes(responseTime) ? responseTime : null;
  } catch (error) {
    console.error('Time Parse Error:', error);
    return null;
  }
}

async function handleConversation(userInput, sender) {
  let session = sessions.get(sender) || { 
    state: 'initial',
    propertiesOffset: 0,
    shownProperties: [],
    selectedProperty: null,
    availableTimes: [],
    history: []
  };

  try {
    // Handle reset commands
    if (/reset|start over/i.test(userInput)) {
      sessions.delete(sender);
      session = { 
        state: 'initial',
        propertiesOffset: 0,
        shownProperties: [],
        selectedProperty: null,
        availableTimes: [],
        history: []
      };
    }

    const intent = await detectIntent(userInput);
    
    // Flexible state transitions
    if (intent === 1 || /properties|list|show homes/i.test(userInput)) {
      session.state = 'property_listing';
      session.propertiesOffset = 0;
      session.shownProperties = listings.slice(0, 3);
    }

    switch(session.state) {
      case 'initial':
      case 'property_listing': {
        // Handle property selection from any state
        if (intent === 2 || session.history.includes('property_listing')) {
          const propertiesToSearch = session.shownProperties.length > 0 
            ? session.shownProperties 
            : listings.slice(0, 3);

          const propertyCode = await parsePropertySelection(userInput, propertiesToSearch);
          
          if (propertyCode) {
            const property = listings.find(p => p.code === propertyCode);
            sessions.set(sender, { 
              ...session,
              state: 'time_selection',
              selectedProperty: property,
              availableTimes: property.viewing_times,
              history: [...session.history, 'property_selected']
            });
            
            const timeSlots = property.viewing_times.map(t => 
              new Date(t).toLocaleString('en-US', { 
                weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric'
              })
            ).join('\n');
            
            return `Selected: ${property.code}\nAvailable times:\n${timeSlots}\nChoose a time or type "change property" to reselect.`;
          }
        }

        // Handle "more" requests
        if (userInput.toLowerCase().trim() === 'more') {
          const newOffset = session.propertiesOffset + 3;
          const newProperties = listings.slice(newOffset, newOffset + 3);
          
          if (newProperties.length === 0) {
            return "No more properties available. Please choose from the listed options.";
          }

          session.shownProperties = newProperties;
          session.propertiesOffset = newOffset;
        } else {
          // Initial property list
          session.shownProperties = listings.slice(0, 3);
          session.propertiesOffset = 3;
        }

        sessions.set(sender, session);
        const moreAvailable = listings.length > session.propertiesOffset;

        return `Available properties:\n${
          session.shownProperties.map(p => `${p.code}: ${p.address}`).join('\n')
        }${moreAvailable ? "\n\nReply 'more' for additional options or specify a property." : ""}`;
      }

      case 'time_selection': {
        // Handle property change
        if (/change property|different property/i.test(userInput)) {
          sessions.set(sender, { 
            state: 'property_listing',
            propertiesOffset: 0,
            shownProperties: listings.slice(0, 3),
            history: [...session.history, 'property_change']
          });
          return "Select a new property:\n" + listings.slice(0, 3).map(p => `${p.code}: ${p.address}`).join('\n');
        }

        const selectedTime = await parseTimeSelection(userInput, session.availableTimes);
        
        if (selectedTime) {
          sessions.set(sender, { 
            ...session, 
            state: 'confirmation',
            selectedTime,
            history: [...session.history, 'time_selected']
          });
          
          const formattedTime = new Date(selectedTime).toLocaleString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric'
          });
          
          return `Confirm appointment for ${session.selectedProperty.code} on ${formattedTime}?\n` +
                 `Reply YES to confirm or NO to choose another time.`;
        }
        
        return `Available times for ${session.selectedProperty.code}:\n${
          session.availableTimes.map(t => 
            new Date(t).toLocaleString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric'
            })
          ).join('\n')
        }\n\nOr type "change property" to select a different property.`;
      }

      case 'confirmation': {
        if (userInput.toLowerCase().startsWith('y')) {
          const formattedTime = new Date(session.selectedTime).toLocaleString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric'
          });
          
          sessions.delete(sender);
          return `✅ Confirmed!\nProperty: ${session.selectedProperty.code}\n` +
                 `Address: ${session.selectedProperty.address}\n` +
                 `Time: ${formattedTime}\n` +
                 `You'll receive a reminder 24 hours before your visit.`;
        }
        
        sessions.set(sender, { 
          ...session, 
          state: 'time_selection',
          selectedTime: null
        });
        return `Select a new time for ${session.selectedProperty.code}:\n${
          session.availableTimes.map(t => 
            new Date(t).toLocaleString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric'
            })
          ).join('\n')
        }`;
      }
    }

  } catch (error) {
    console.error('Conversation Error:', error);
    sessions.delete(sender);
    return "Let's start over. Available properties:\n" + 
      listings.slice(0, 3).map(p => `${p.code}: ${p.address}`).join('\n');
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
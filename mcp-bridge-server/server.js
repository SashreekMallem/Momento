const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../mcp-server/.env') });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'momento-mcp-bridge' });
});

// MCP Server bridge endpoint
app.post('/api/mcp/generate-mission', async (req, res) => {
  try {
    console.log('🔌 Received mission generation request:', req.body);
    
    // Path to your MCP server
    const mcpServerPath = path.join(__dirname, '../mcp-server/dist/index.js');
    
    console.log('🚀 Starting MCP server at:', mcpServerPath);
    
    // Spawn the MCP server process with environment variables
    const mcpProcess = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env, // This now includes the loaded .env variables
      }
    });

    let response = '';
    let errorOutput = '';

    // Set up data handlers
    mcpProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('MCP stdout:', output);
      response += output;
    });

    mcpProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.log('MCP stderr:', error);
      errorOutput += error;
    });

    // Send the JSON-RPC request to the MCP server
    const jsonRpcRequest = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: "generate_mission",
        arguments: req.body.params.arguments
      }
    };

    console.log('📤 Sending to MCP server:', JSON.stringify(jsonRpcRequest));
    
    mcpProcess.stdin.write(JSON.stringify(jsonRpcRequest) + '\n');
    mcpProcess.stdin.end();

    // Wait for the process to complete
    mcpProcess.on('close', (code) => {
      console.log(`MCP process exited with code ${code}`);
      
      try {
        // Parse the response
        const lines = response.split('\n').filter(line => line.trim());
        
        // Find the JSON response (skip log lines)
        let jsonResponse = null;
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.jsonrpc && parsed.id) {
              jsonResponse = parsed;
              break;
            }
          } catch (e) {
            // Skip non-JSON lines
          }
        }

        if (jsonResponse && jsonResponse.result) {
          console.log('✅ MCP server responded successfully');
          res.json(jsonResponse);
        } else if (jsonResponse && jsonResponse.error) {
          console.error('❌ MCP server error:', jsonResponse.error);
          res.status(500).json({ error: 'MCP server error', details: jsonResponse.error });
        } else {
          console.error('❌ No valid JSON response from MCP server');
          console.log('Raw response:', response);
          console.log('Error output:', errorOutput);
          res.status(500).json({ 
            error: 'Invalid response from MCP server',
            rawResponse: response,
            errorOutput: errorOutput
          });
        }
      } catch (parseError) {
        console.error('❌ Failed to parse MCP response:', parseError);
        res.status(500).json({ 
          error: 'Failed to parse MCP response',
          details: parseError.message,
          rawResponse: response
        });
      }
    });

    // Handle process errors
    mcpProcess.on('error', (error) => {
      console.error('❌ Failed to start MCP server:', error);
      res.status(500).json({ 
        error: 'Failed to start MCP server',
        details: error.message
      });
    });

  } catch (error) {
    console.error('❌ Bridge server error:', error);
    res.status(500).json({ 
      error: 'Bridge server error',
      details: error.message
    });
  }
});

// Test endpoint for the mobile app
app.post('/api/test-mission', (req, res) => {
  console.log('🧪 Test mission request received');
  
  const testMission = {
    success: true,
    mission: {
      id: 'test-' + Date.now(),
      title: 'Test AI Mission from MCP Bridge',
      description: 'This is a test mission generated through the MCP bridge server to verify connectivity.',
      type: 'experience',
      category: 'test',
      difficulty: 'beginner',
      estimatedDuration: 30,
      personalizedElements: {
        source: 'mcp-bridge-test',
        timestamp: new Date().toISOString()
      }
    },
    metadata: {
      model: 'test-bridge',
      generatedAt: new Date().toISOString()
    }
  };

  res.json(testMission);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌉 Momento MCP Bridge Server running on port ${PORT}`);
  console.log(`🔗 Ready to bridge mobile app ↔ MCP server`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test-mission`);
  console.log(`🎯 Mission endpoint: http://localhost:${PORT}/api/mcp/generate-mission`);
  console.log(`📱 Mobile app should connect to: http://192.168.86.30:${PORT}`);
});

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"runtime"
	"time"

	webview "github.com/webview/webview_go"
)

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebView Demo</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #f5f5f5;
            color: #333;
            padding: 40px 20px;
            line-height: 1.6;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border: 1px solid #ddd;
        }
        
        h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #222;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section h2 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #444;
        }
        
        button {
            background: white;
            border: 1px solid #999;
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            margin-right: 8px;
            margin-bottom: 8px;
            font-family: inherit;
        }
        
        button:hover {
            background: #f0f0f0;
        }
        
        button:active {
            background: #e0e0e0;
        }
        
        input {
            border: 1px solid #999;
            padding: 8px 12px;
            font-size: 14px;
            width: 80px;
            margin-right: 8px;
            font-family: inherit;
        }
        
        .result {
            margin-top: 12px;
            padding: 12px;
            background: #fafafa;
            border: 1px solid #e0e0e0;
            font-size: 14px;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        
        .result:empty {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>WebView Demo</h1>
        
        <div class="section">
            <h2>System Information</h2>
            <button onclick="handleGetSystemInfo()">Get System Info</button>
            <div id="systemInfo" class="result"></div>
        </div>
        
        <div class="section">
            <h2>Calculator</h2>
            <input type="number" id="num1" value="10" />
            <span>+</span>
            <input type="number" id="num2" value="20" />
            <button onclick="handleCalculate()">Calculate</button>
            <div id="calcResult" class="result"></div>
        </div>
        
        <div class="section">
            <h2>Backend Messages</h2>
            <button onclick="handleRequestMessage()">Request Message</button>
            <div id="messageResult" class="result"></div>
        </div>
    </div>
    
    <script>
        function handleGetSystemInfo() {
            const result = document.getElementById('systemInfo');
            result.textContent = 'Loading...';
            
            getSystemInfo().then(info => {
                result.textContent = info;
            }).catch(err => {
                result.textContent = 'Error: ' + err;
            });
        }
        
        function handleCalculate() {
            const num1 = parseFloat(document.getElementById('num1').value) || 0;
            const num2 = parseFloat(document.getElementById('num2').value) || 0;
            const result = document.getElementById('calcResult');
            
            result.textContent = 'Calculating...';
            
            calculate(num1, num2).then(sum => {
                result.textContent = num1 + ' + ' + num2 + ' = ' + sum;
            }).catch(err => {
                result.textContent = 'Error: ' + err;
            });
        }
        
        function handleRequestMessage() {
            const result = document.getElementById('messageResult');
            result.textContent = 'Requesting...';
            
            getMessage().then(msg => {
                result.textContent = msg;
            }).catch(err => {
                result.textContent = 'Error: ' + err;
            });
        }
    </script>
</body>
</html>
`

type SystemInfo struct {
	OS           string `json:"os"`
	Architecture string `json:"arch"`
	CPUs         int    `json:"cpus"`
	GoVersion    string `json:"goVersion"`
	Timestamp    string `json:"timestamp"`
}

func main() {
	debug := true
	w := webview.New(debug)
	defer w.Destroy()

	w.SetTitle("WebView Demo")
	w.SetSize(800, 600, webview.HintNone)

	// Bind Go functions to JavaScript
	w.Bind("getSystemInfo", func() string {
		info := SystemInfo{
			OS:           runtime.GOOS,
			Architecture: runtime.GOARCH,
			CPUs:         runtime.NumCPU(),
			GoVersion:    runtime.Version(),
			Timestamp:    time.Now().Format("2006-01-02 15:04:05"),
		}

		data, err := json.MarshalIndent(info, "", "  ")
		if err != nil {
			return fmt.Sprintf("Error: %v", err)
		}
		return string(data)
	})

	w.Bind("calculate", func(a, b float64) float64 {
		// Simulate some processing time
		time.Sleep(100 * time.Millisecond)
		return a + b
	})

	w.Bind("getMessage", func() string {
		messages := []string{
			"Hello from Go backend!",
			"WebView integration is working!",
			"This message was generated at " + time.Now().Format("15:04:05"),
			"Go and JavaScript are communicating successfully.",
		}
		// Return a random message based on current second
		idx := time.Now().Second() % len(messages)
		return messages[idx]
	})

	w.SetHtml(htmlContent)
	w.Run()

	log.Println("WebView closed")
}

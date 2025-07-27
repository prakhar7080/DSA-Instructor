const questionInput = document.getElementById('questionInput');
        const askButton = document.getElementById('askButton');
        const outputContainer = document.getElementById('outputContainer');
        const loadingSpinner = document.getElementById('loadingSpinner');

        // ---===[ IMPORTANT: PASTE YOUR API KEY HERE ]===---
        const GEMINI_API_KEY = "";
        // =================================================

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const systemInstruction = "You are a DSA Instructor. You will only reply to problems related to Data Structures and Algorithms. You have to solve the user's query in the simplest way. If the user asks any question not related to Data Structures and Algorithms, reply to them rudely. Example: If a user asks, 'How are you?', you will reply: 'You dumb, ask me a sensible question!'. You must reply rudely if the question is not related to DSA. Otherwise, reply politely with a simple explanation and detailed code examples where applicable, is user give some code and ask about it, analyse it and if code is correct then explain about it and if code is wrong then analyse and give correct code to user in same programming language politely. dont add header files in code";

        function formatResponse(text) {
            // Convert multi-line code blocks (```...```) to <pre><code>...</code>
            let formatted = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
                return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
            });

            // Convert inline code (`...`) to <code>...</code>
            formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

            // Convert **text** to <strong>text</strong>
            formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            // Convert newline characters into paragraphs for better readability
            const paragraphs = formatted.split('\n').filter(p => p.trim() !== '');
            return paragraphs.map(p => `<p>${p}</p>`).join('');
        }
        
        async function handleUserRequest() {
            const question = questionInput.value.trim();

            if (!question) {
                outputContainer.innerHTML = `<div class="message error">Please enter a question before submitting.</div>`;
                return;
            }

            if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY") {
                outputContainer.innerHTML = `<div class="message error"><strong>Configuration Error:</strong> Please replace "YOUR_GEMINI_API_KEY" with your actual Gemini API key in the script tag.</div>`;
                return;
            }

            askButton.disabled = true;
            askButton.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> Processing...';
            outputContainer.style.display = 'none';
            loadingSpinner.style.display = 'flex';

            const requestBody = {
                contents: [{ parts: [{ text: question }] }],
                systemInstruction: { parts: [{ text: systemInstruction }] }
            };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                });

                const data = await response.json();

                if (!response.ok) {
                    const errorDetails = data?.error?.message || response.statusText;
                    throw new Error(`API request failed: ${response.status} - ${errorDetails}`);
                }
                
                if (data.promptFeedback && data.promptFeedback.blockReason) {
                     throw new Error(`Request blocked by API. Reason: ${data.promptFeedback.blockReason}`);
                }

                const responseText = data.candidates[0]?.content?.parts[0]?.text;
                if (responseText) {
                    outputContainer.innerHTML = formatResponse(responseText);
                } else {
                    throw new Error("Received an empty or invalid response from the API.");
                }

            } catch (error) {
                console.error("API Call Error:", error);
                outputContainer.innerHTML = `<div class="message error"><strong>An error occurred:</strong><br>${error.message}</div>`;
            } finally {
                askButton.disabled = false;
                askButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit to Instructor';
                outputContainer.style.display = 'block';
                loadingSpinner.style.display = 'none';
            }
        }

        askButton.addEventListener('click', handleUserRequest);

        questionInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                askButton.click();
            }
        });

        document.querySelectorAll('.prompt-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                questionInput.value = chip.textContent;
                questionInput.focus();
            });
        });

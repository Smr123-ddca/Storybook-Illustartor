// filepath: c:\Users\HP\OneDrive\Documents\GitHub\Storybook-Illustartor\frontend\script.js

const API_URL = "http://localhost:8000";

const generateBtn = document.getElementById("generateBtn");
const storyInput = document.getElementById("storyInput");
const statusDiv = document.getElementById("status");
const storybookDiv = document.getElementById("storybook");

generateBtn.addEventListener("click", generateStorybook);

async function generateStorybook() {
    const storyText = storyInput.value.trim();

    if (!storyText) {
        showStatus("Please enter a story!", "error");
        return;
    }

    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    statusDiv.innerHTML = "";
    storybookDiv.innerHTML = "";

    try {
        showStatus("📚 Starting storybook generation...", "info");
        storybookDiv.innerHTML = "<p style='text-align: center; color: #666;'>⏳ Pages are being generated, please wait...</p>";

        const response = await fetch(`${API_URL}/generate-storybook?title=My Storybook`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ story_text: storyText }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Generation failed");
        }

        const data = await response.json();

        showStatus(
            `✅ Generated ${data.total_pages} pages in ${data.generation_time}`,
            "success"
        );

        displayStorybook(data);
    } catch (error) {
        showStatus(`❌ Error: ${error.message}`, "error");
        storybookDiv.innerHTML = "";
        console.error("Error:", error);
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = "Generate Storybook";
    }
}

function displayStorybook(data) {
    storybookDiv.innerHTML = `<h2>${data.story_title}</h2>`;

    data.images.forEach((page) => {
        const pageDiv = document.createElement("div");
        pageDiv.className = "page";

        const pageNum = document.createElement("h3");
        pageNum.textContent = `Page ${page.page_number}`;

        const text = document.createElement("p");
        text.textContent = page.page_text;

        const img = document.createElement("img");
        img.src = `${API_URL}/${page.image_path}`;
        img.alt = `Page ${page.page_number}`;
        img.onerror = () => {
            img.alt = "Image failed to load";
            img.style.backgroundColor = "#f0f0f0";
            img.style.padding = "20px";
        };

        pageDiv.appendChild(pageNum);
        pageDiv.appendChild(img);
        pageDiv.appendChild(text);
        storybookDiv.appendChild(pageDiv);
    });
}

function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}
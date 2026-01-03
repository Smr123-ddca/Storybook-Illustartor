// ==================== CONFIGURATION ====================
const API_BASE_URL = 'http://localhost:8000'; // Make sure backend is running here

// ==================== DOM ELEMENTS ====================
const inputSection = document.getElementById('inputSection');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');

const storyTitleInput = document.getElementById('storyTitle');
const storyTextInput = document.getElementById('storyText');
const generateBtn = document.getElementById('generateBtn');
const resetBtn = document.getElementById('resetBtn');

const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const resultTitleDisplay = document.getElementById('resultTitleDisplay');
const storybookPages = document.getElementById('storybookPages');
const errorToast = document.getElementById('errorToast');
const errorMsg = document.getElementById('errorMsg');

// ==================== EVENT LISTENERS ====================
generateBtn.addEventListener('click', generateStory);
resetBtn.addEventListener('click', resetApp);

// ==================== MAIN LOGIC ====================

async function generateStory() {
    const title = storyTitleInput.value.trim() || "My Magical Story";
    const text = storyTextInput.value.trim();

    if (!text) {
        showError("Please write a story first! The magic needs words to work.");
        return;
    }

    // 1. Switch UI to Loading
    inputSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    updateProgress(10, "Summoning the scribes...");

    try {
        // 2. Call the API
        const response = await fetch(`${API_BASE_URL}/generate-storybook?title=${encodeURIComponent(title)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ story_text: text })
        });

        if (!response.ok) {
            throw new Error(`Magic failed: ${response.statusText}`);
        }

        updateProgress(50, "Painting the pictures...");
        const data = await response.json();

        // 3. Render Results
        updateProgress(100, "Finishing touches...");
        
        // Small delay to let the user see the 100% bar
        setTimeout(() => {
            renderStorybook(data);
        }, 800);

    } catch (err) {
        console.error(err);
        showError("The magic fizzled out! Is the backend running? " + err.message);
        inputSection.classList.remove('hidden');
        loadingSection.classList.add('hidden');
    }
}

function renderStorybook(data) {
    loadingSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    
    resultTitleDisplay.textContent = data.story_title;
    storybookPages.innerHTML = ''; // Clear previous

    data.images.forEach((pageData, index) => {
        const pageCard = document.createElement('div');
        pageCard.className = 'page-card';
        
        // Image Element with careful loading logic
        const imgContainer = document.createElement('div');
        imgContainer.className = 'page-image-container';
        
        const img = document.createElement('img');
        img.className = 'story-image';
        img.alt = `Illustration for page ${pageData.page_number}`;
        
        // FIX: Set opacity to 0 initially
        img.style.opacity = '0';
        
        // FIX: Define onload BEFORE setting src
        img.onload = () => {
            img.style.opacity = '1';
        };
        
        img.onerror = () => {
            imgContainer.innerHTML = '<span style="color:#e74c3c">❌ Image vanished!</span>';
        };

        // Construct URL
        if(pageData.image_filename && pageData.image_filename !== 'error') {
            img.src = `${API_BASE_URL}/images/${pageData.image_filename}`;
        } else {
            imgContainer.innerHTML = '<span style="color:#e74c3c">⚠️ Could not paint this page.</span>';
        }

        imgContainer.appendChild(img);

        // Text Content
        const content = document.createElement('div');
        content.className = 'page-text-content';
        content.innerHTML = `
            <span class="page-number">Page ${pageData.page_number}</span>
            <p>${pageData.page_text}</p>
        `;

        pageCard.appendChild(imgContainer);
        pageCard.appendChild(content);
        storybookPages.appendChild(pageCard);
    });

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress(percent, message) {
    progressFill.style.width = `${percent}%`;
    progressText.textContent = message;
}

function showError(msg) {
    errorMsg.textContent = msg;
    errorToast.classList.remove('hidden');
    setTimeout(() => {
        errorToast.classList.add('hidden');
    }, 5000);
}

function resetApp() {
    resultsSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
    storyTitleInput.value = '';
    storyTextInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
// ==================== CONFIG ====================
const API_BASE_URL = 'http://localhost:8000';

// ==================== DOM ELEMENTS ====================
const storyTitleInput = document.getElementById('storyTitle');
const storyTextArea = document.getElementById('storyText');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const newStoryBtn = document.getElementById('newStoryBtn');
const tryAgainBtn = document.getElementById('tryAgainBtn');

const progressSection = document.getElementById('progressSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');

const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const progressPages = document.getElementById('progressPages');
const resultsTitle = document.getElementById('resultsTitle');
const storybookPages = document.getElementById('storybookPages');
const errorMessage = document.getElementById('errorMessage');

// ==================== EVENT LISTENERS ====================
generateBtn.addEventListener('click', generateStorybook);
clearBtn.addEventListener('click', clearForm);
newStoryBtn.addEventListener('click', resetToForm);
tryAgainBtn.addEventListener('click', resetToForm);

// ==================== MAIN FUNCTIONS ====================

async function generateStorybook() {
    const storyTitle = storyTitleInput.value.trim() || 'My Storybook';
    const storyText = storyTextArea.value.trim();
    
    // Validation
    if (!storyText) {
        alert('Please write a story first!');
        return;
    }
    
    // Count pages
    const pages = storyText.split('\n\n').filter(p => p.trim());
    if (pages.length === 0) {
        alert('Please separate your story into pages using blank lines!');
        return;
    }
    
    if (pages.length > 15) {
        alert(`Your story has ${pages.length} pages. Maximum is 15 pages. Try making your paragraphs longer!`);
        return;
    }
    
    // Show progress section
    showSection('progress');
    updateProgress(0, pages.length, 'Starting generation...');
    
    // Disable buttons
    generateBtn.disabled = true;
    
    try {
        // Call API
        const response = await fetch(`${API_BASE_URL}/generate-storybook?title=${encodeURIComponent(storyTitle)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                story_text: storyText
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to generate storybook');
        }
        
        const data = await response.json();
        
        // Show results
        displayResults(data);
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message);
    } finally {
        generateBtn.disabled = false;
    }
}

function updateProgress(current, total, message) {
    const percentage = Math.round((current / total) * 100);
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = message;
    progressPages.textContent = `Page ${current} of ${total}`;
}

function displayResults(data) {
    showSection('results');
    
    // Set title
    resultsTitle.textContent = `📖 ${data.story_title}`;
    
    // Clear previous pages
    storybookPages.innerHTML = '';
    
    // Add each page
    data.images.forEach((pageData) => {
        const pageElement = createPageElement(pageData);
        storybookPages.appendChild(pageElement);
    });
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function createPageElement(pageData) {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'page-item';
    
    const pageHeader = document.createElement('div');
    pageHeader.className = 'page-header';
    
    const pageNumber = document.createElement('div');
    pageNumber.className = 'page-number';
    pageNumber.textContent = pageData.page_number;
    
    pageHeader.appendChild(pageNumber);
    
    const pageText = document.createElement('p');
    pageText.className = 'page-text';
    pageText.textContent = pageData.page_text;
    
    pageDiv.appendChild(pageHeader);
    pageDiv.appendChild(pageText);
    
    // Add image
    if (pageData.image_filename !== 'error') {
        const img = document.createElement('img');
        img.className = 'page-image';
        img.alt = `Page ${pageData.page_number} illustration`;
        img.src = `${API_BASE_URL}/images/${pageData.image_filename}`;
        
        // Add loading state
        img.onload = function() {
            img.style.opacity = '1';
        };
        
        img.onerror = function() {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'image-error';
            errorDiv.textContent = '❌ Failed to load image';
            pageDiv.appendChild(errorDiv);
        };
        
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s';
        
        pageDiv.appendChild(img);
    } else {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'image-error';
        errorDiv.textContent = `❌ ${pageData.image_path}`;
        pageDiv.appendChild(errorDiv);
    }
    
    return pageDiv;
}

function showError(message) {
    showSection('error');
    errorMessage.textContent = message;
    errorSection.scrollIntoView({ behavior: 'smooth' });
}

function showSection(section) {
    // Hide all sections
    progressSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    
    // Show selected section
    if (section === 'progress') {
        progressSection.classList.remove('hidden');
    } else if (section === 'results') {
        resultsSection.classList.remove('hidden');
    } else if (section === 'error') {
        errorSection.classList.remove('hidden');
    }
}

function clearForm() {
    storyTitleInput.value = '';
    storyTextArea.value = '';
    storyTitleInput.focus();
}

function resetToForm() {
    showSection('none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    storyTextArea.focus();
}

// ==================== SAMPLE STORY (FOR TESTING) ====================
// Uncomment to pre-fill with sample story
/*
window.addEventListener('load', () => {
    storyTitleInput.value = "The Magical Adventure";
    storyTextArea.value = `Once upon a time, there was a brave little mouse named Pip who lived in a cozy hole.

One day, Pip discovered a mysterious glowing acorn in the forest.

The acorn led Pip on an amazing adventure through magical lands.

Pip made many friends along the way, including a wise owl and a friendly fox.

Together, they discovered the acorn was a key to a hidden treasure.

The treasure was a beautiful garden where all animals could live in harmony.

Pip became a hero, and everyone lived happily ever after.`;
});
*/

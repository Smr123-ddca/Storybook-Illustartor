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
    
    console.log('=== GENERATION STARTED ===');
    
    // Validation
    if (!storyText) {
        alert('Please write a story first!');
        return;
    }
    
    // Split into pages
    const pages = storyText.split('\n\n').filter(p => p.trim());
    console.log('Pages found:', pages.length);
    
    if (pages.length === 0) {
        alert('Please separate your story into pages using blank lines!');
        return;
    }
    
    if (pages.length > 15) {
        alert(`Your story has ${pages.length} pages. Maximum is 15 pages.`);
        return;
    }
    
    // Show progress
    showSection('progress');
    updateProgress(0, pages.length, 'Starting generation...');
    
    // Disable button
    generateBtn.disabled = true;
    
    try {
        // Generate pages ONE BY ONE
        const generatedPages = [];
        
        for (let i = 0; i < pages.length; i++) {
            const pageNumber = i + 1;
            const pageText = pages[i];
            
            console.log(`\n📄 Generating page ${pageNumber}/${pages.length}`);
            updateProgress(i, pages.length, `Generating page ${pageNumber} of ${pages.length}...`);
            
            try {
                // Call API for single page
                const response = await fetch(
                    `${API_BASE_URL}/generate-page?page_text=${encodeURIComponent(pageText)}&page_number=${pageNumber}&total_pages=${pages.length}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`Failed to generate page ${pageNumber}`);
                }
                
                const pageData = await response.json();
                console.log(`✅ Page ${pageNumber} response:`, pageData);
                
                generatedPages.push(pageData);
                
                // Update progress
                updateProgress(pageNumber, pages.length, `Page ${pageNumber} complete!`);
                
                // Small delay between pages
                if (i < pages.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.error(`❌ Error on page ${pageNumber}:`, error);
                // Add error placeholder
                generatedPages.push({
                    success: false,
                    page_number: pageNumber,
                    page_text: pageText,
                    error: error.message
                });
            }
        }
        
        // All pages generated!
        console.log('=== ALL PAGES GENERATED ===');
        updateProgress(pages.length, pages.length, 'Complete! Loading results...');
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Display results
        const storybookData = {
            story_title: storyTitle,
            total_pages: pages.length,
            images: generatedPages
        };
        
        displayResults(storybookData);
        
    } catch (error) {
        console.error('=== GENERATION ERROR ===', error);
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
    console.log(`Progress: ${percentage}% - ${message}`);
}

function displayResults(data) {
    console.log('=== DISPLAYING RESULTS ===');
    console.log('Data:', data);
    
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
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    console.log('=== RESULTS DISPLAYED ===');
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
    pageDiv.appendChild(pageHeader);
    
    const pageText = document.createElement('p');
    pageText.className = 'page-text';
    pageText.textContent = pageData.page_text;
    pageDiv.appendChild(pageText);
    
    // Add image or error
    if (pageData.success !== false && pageData.image_filename) {
        const imageUrl = `${API_BASE_URL}/images/${pageData.image_filename}`;
        
        const img = document.createElement('img');
        img.className = 'page-image';
        img.alt = `Page ${pageData.page_number} illustration`;
        img.src = imageUrl;
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.5s';
        
        img.onload = function() {
            console.log('✅ Image loaded:', imageUrl);
            img.style.opacity = '1';
        };
        
        img.onerror = function() {
            console.error('❌ Image failed:', imageUrl);
            img.style.display = 'none';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'image-error';
            errorDiv.textContent = '❌ Failed to load image';
            pageDiv.appendChild(errorDiv);
        };
        
        pageDiv.appendChild(img);
    } else {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'image-error';
        errorDiv.textContent = `❌ ${pageData.error || 'Generation failed'}`;
        pageDiv.appendChild(errorDiv);
    }
    
    return pageDiv;
}

function showError(message) {
    showSection('error');
    errorMessage.textContent = message;
    setTimeout(() => {
        errorSection.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function showSection(section) {
    progressSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    
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
}

function resetToForm() {
    showSection('none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

console.log('=== SCRIPT LOADED ===');
console.log('API:', API_BASE_URL);
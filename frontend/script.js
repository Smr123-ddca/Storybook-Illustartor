// ========================================
// STORYBOOK ILLUSTRATOR - MAIN SCRIPT
// With Real-Time Progress Tracking
// ========================================

const API_URL = 'http://localhost:8000';
let currentStorybook = null;
let currentPageIndex = 0;
let progressInterval = null;

// Example story for quick testing
const exampleStory = `Once upon a time in a magical forest, there lived a curious little fox named Ruby with bright orange fur and sparkling green eyes.

Ruby loved to explore and one day she discovered a glowing crystal hidden beneath an ancient oak tree, shimmering with rainbow colors.

When she touched the crystal, it began to sparkle and showed her visions of faraway lands, mystical creatures, and exciting adventures waiting to be discovered.

Ruby decided to follow the crystal's magic and embarked on the greatest journey of her life, meeting new friends along the way.

And so, with courage in her heart and magic by her side, Ruby's adventures continued forever and ever. The end.`;

// ========================================
// UTILITY FUNCTIONS
// ========================================

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.querySelector('p').textContent = message;
    errorDiv.classList.remove('hidden');
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

function loadExample() {
    document.getElementById('storyInput').value = exampleStory;
    document.getElementById('titleInput').value = "Ruby's Magical Adventure";
    hideError();
}

// ========================================
// PROGRESS TRACKING
// ========================================

function createProgressDisplay(totalPages) {
    const loadingMsg = document.getElementById('loadingMessage');
    loadingMsg.innerHTML = `
        <div class="loading-spinner"></div>
        <p style="font-weight: 600; font-size: 1.2rem;">🎨 Creating Your Magical Illustrations...</p>
        <div id="progressContainer" style="margin-top: 1.5rem; width: 100%;">
            <div style="background: white; border-radius: 15px; padding: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="font-weight: 600; color: #6b46c1;">Progress:</span>
                    <span id="progressText" style="font-weight: 700; color: #6b46c1;">0 / ${totalPages} pages</span>
                </div>
                <div style="background: #e5e7eb; height: 30px; border-radius: 15px; overflow: hidden; position: relative;">
                    <div id="progressBar" style="background: linear-gradient(90deg, #667eea, #764ba2, #f093fb); height: 100%; width: 0%; transition: width 0.5s ease; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.9rem;">
                        0%
                    </div>
                </div>
            </div>
            <div id="pageStatusList" style="display: grid; gap: 0.5rem; max-height: 300px; overflow-y: auto;">
            </div>
        </div>
        <p style="margin-top: 1rem; font-size: 0.9rem; opacity: 0.8;">⏳ Each page takes 15-30 seconds...</p>
    `;
}

function updateProgress(completedPages, totalPages, currentPageNum, status) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const pageStatusList = document.getElementById('pageStatusList');
    
    if (!progressBar || !progressText) return;
    
    const percentage = Math.round((completedPages / totalPages) * 100);
    
    progressBar.style.width = `${percentage}%`;
    progressBar.textContent = `${percentage}%`;
    progressText.textContent = `${completedPages} / ${totalPages} pages`;
    
    // Add/update current page status
    let statusItem = document.getElementById(`page-status-${currentPageNum}`);
    if (!statusItem) {
        statusItem = document.createElement('div');
        statusItem.id = `page-status-${currentPageNum}`;
        statusItem.style.cssText = `
            padding: 0.8rem;
            background: white;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 0.8rem;
            border-left: 4px solid #d6bcfa;
            animation: slideIn 0.3s ease;
        `;
        pageStatusList.appendChild(statusItem);
    }
    
    const statusEmoji = status === 'generating' ? '🎨' : 
                       status === 'complete' ? '✅' : 
                       status === 'error' ? '❌' : '⏳';
    
    const statusColor = status === 'generating' ? '#3b82f6' : 
                       status === 'complete' ? '#10b981' : 
                       status === 'error' ? '#ef4444' : '#9ca3af';
    
    const statusText = status === 'generating' ? 'Generating...' : 
                      status === 'complete' ? 'Complete!' : 
                      status === 'error' ? 'Failed' : 'Waiting...';
    
    statusItem.style.borderLeftColor = statusColor;
    statusItem.innerHTML = `
        <span style="font-size: 1.5rem;">${statusEmoji}</span>
        <div style="flex: 1;">
            <div style="font-weight: 600; color: #374151;">Page ${currentPageNum}</div>
            <div style="font-size: 0.85rem; color: ${statusColor};">${statusText}</div>
        </div>
    `;
    
    // Scroll to latest status
    statusItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

async function checkImageExists(filename) {
    try {
        const response = await fetch(`${API_URL}/images/${filename}`, { 
            method: 'GET',
            cache: 'no-cache'
        });
        return response.ok;
    } catch (error) {
        console.log(`Checking ${filename}: not ready yet`);
        return false;
    }
}

async function pollProgress(totalPages) {
    let lastCompletedCount = 0;
    let pollCount = 0;
    const maxPolls = 150; // 5 minutes max (150 * 2 seconds)
    
    return new Promise((resolve, reject) => {
        progressInterval = setInterval(async () => {
            pollCount++;
            console.log(`🔍 Polling attempt ${pollCount}/${maxPolls}`);
            
            if (pollCount >= maxPolls) {
                clearInterval(progressInterval);
                reject(new Error('Polling timeout - no images found after 5 minutes'));
                return;
            }
            
            let completedCount = 0;
            
            // Check each page
            for (let i = 1; i <= totalPages; i++) {
                const exists = await checkImageExists(`page_${i}.png`);
                console.log(`  Page ${i}: ${exists ? '✅ exists' : '❌ not found'}`);
                if (exists) {
                    completedCount++;
                    // Update status to complete if it wasn't already
                    const statusItem = document.getElementById(`page-status-${i}`);
                    if (statusItem && !statusItem.dataset.complete) {
                        statusItem.dataset.complete = 'true';
                        updateProgress(completedCount, totalPages, i, 'complete');
                    }
                }
            }
            
            // If new page completed, update progress
            if (completedCount > lastCompletedCount) {
                lastCompletedCount = completedCount;
                console.log(`✅ ${completedCount}/${totalPages} pages complete`);
            }
            
            // Check if all done
            if (completedCount === totalPages) {
                console.log('🎉 All pages complete!');
                clearInterval(progressInterval);
                resolve();
            }
        }, 2000); // Check every 2 seconds
    });
}

// ========================================
// GENERATE STORYBOOK WITH PROGRESS
// ========================================

async function generateStorybook() {
    console.log('🎬 Generate button clicked!');
    
    const storyText = document.getElementById('storyInput').value;
    const title = document.getElementById('titleInput').value;

    console.log('📝 Story text length:', storyText.length);
    console.log('📖 Title:', title);

    // Validation
    if (!storyText.trim()) {
        showError('Please enter a story first! 📝');
        return;
    }

    // Count pages
    const pages = storyText.split('\n\n').filter(p => p.trim());
    const totalPages = pages.length;
    
    if (totalPages > 15) {
        showError(`Your story has ${totalPages} pages. Maximum is 15 pages! Try making your paragraphs longer. 📚`);
        return;
    }

    hideError();
    
    // Show loading state
    const generateBtn = document.getElementById('generateBtn');
    const originalBtnHTML = generateBtn.innerHTML;
    generateBtn.disabled = true;
    generateBtn.innerHTML = `
        <div class="loading-spinner" style="width: 20px; height: 20px; border-width: 3px;"></div>
        <span class="btn-text">Creating Magic...</span>
    `;
    
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.classList.remove('hidden');
    createProgressDisplay(totalPages);
    
    // Initialize all pages as waiting
    for (let i = 1; i <= totalPages; i++) {
        updateProgress(0, totalPages, i, 'waiting');
    }

    try {
        console.log('🎨 Starting storybook generation...');
        console.log(`📖 Story: "${title}" with ${totalPages} pages`);

        // Start progress polling
        const progressPromise = pollProgress(totalPages);

        // Start the generation request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.log('⏰ Request timed out after 5 minutes');
        }, 300000);

        // Simulate marking current page as generating
        let currentGeneratingPage = 1;
        const generatingInterval = setInterval(() => {
            if (currentGeneratingPage <= totalPages) {
                updateProgress(currentGeneratingPage - 1, totalPages, currentGeneratingPage, 'generating');
                currentGeneratingPage++;
            }
        }, 20000); // Assume 20 seconds per page

        const fetchPromise = fetch(`${API_URL}/generate-storybook?title=${encodeURIComponent(title)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                story_text: storyText
            }),
            signal: controller.signal
        });

        console.log('📡 Request sent to backend...');

        // Wait for either the fetch to complete or progress to show all images
        const response = await fetchPromise;
        clearTimeout(timeoutId);
        clearInterval(generatingInterval);

        console.log('📬 Response received:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Backend error:', errorData);
            throw new Error(errorData.detail || 'Failed to generate storybook');
        }

        const data = await response.json();
        console.log('✅ Backend completed!', data);
        
        // Wait a bit more for all images to be accessible
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Wait for progress polling to confirm all images
        await progressPromise;
        
        currentStorybook = data;
        currentPageIndex = 0;
        
        // Show completion message briefly
        const loadingMsg = document.getElementById('loadingMessage');
        loadingMsg.innerHTML = `
            <div style="font-size: 3rem;">🎉</div>
            <p style="font-weight: 700; font-size: 1.3rem; color: #10b981;">Your Magical Storybook is Ready!</p>
        `;
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        displayStorybook();

    } catch (err) {
        console.error('❌ Error:', err);
        console.error('❌ Error name:', err.name);
        console.error('❌ Error message:', err.message);
        console.error('❌ Error stack:', err.stack);
        
        // Stop progress polling
        if (progressInterval) {
            clearInterval(progressInterval);
        }
        
        if (err.name === 'AbortError') {
            showError('Request timed out after 5 minutes. Try with fewer pages or check your backend! ⏰');
        } else if (err.message.includes('fetch')) {
            showError('Cannot connect to backend! Make sure your FastAPI server is running on port 8000. 🔌');
        } else {
            showError(err.message || 'Something went wrong. Check the console for details! 🔍');
        }
        
        // Reset button
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalBtnHTML;
    }
}

// ========================================
// DISPLAY STORYBOOK
// ========================================

function displayStorybook() {
    console.log('📚 Displaying storybook...');
    
    // Hide loading
    document.getElementById('loadingMessage').classList.add('hidden');
    
    // Hide form, show storybook
    document.getElementById('inputForm').classList.add('hidden');
    document.getElementById('storybookDisplay').classList.remove('hidden');

    // Update header
    document.getElementById('storybookTitle').textContent = currentStorybook.story_title;
    document.getElementById('storybookInfo').textContent = 
        `${currentStorybook.total_pages} pages • Generated in ${currentStorybook.generation_time}`;

    // Display current page
    displayCurrentPage();

    // Generate thumbnails
    generateThumbnails();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// PAGE NAVIGATION
// ========================================

function displayCurrentPage() {
    const page = currentStorybook.images[currentPageIndex];
    
    console.log(`📄 Displaying page ${currentPageIndex + 1}/${currentStorybook.images.length}`);
    
    // Update page counter
    document.getElementById('pageCounter').textContent = 
        `Page ${currentPageIndex + 1} of ${currentStorybook.images.length}`;

    // Update navigation buttons
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentPageIndex === 0;
    nextBtn.disabled = currentPageIndex === currentStorybook.images.length - 1;

    // Display image
    const imageContainer = document.getElementById('currentImage');
    if (page.image_filename === 'error') {
        imageContainer.innerHTML = `
            <div class="error-frame">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <p style="color: #991b1b; font-weight: 600; font-size: 1.1rem;">Failed to generate image</p>
                <p style="color: #7f1d1d; font-size: 0.9rem; margin-top: 0.5rem;">${page.image_path}</p>
            </div>
        `;
    } else {
        imageContainer.innerHTML = `
            <img src="${API_URL}/images/${page.image_filename}?t=${Date.now()}" 
                 alt="Page ${currentPageIndex + 1}"
                 style="display: block;">
        `;
    }

    // Display text
    document.getElementById('currentText').textContent = page.page_text;
}

function previousPage() {
    if (currentPageIndex > 0) {
        currentPageIndex--;
        displayCurrentPage();
        updateThumbnailSelection();
        scrollToTop();
    }
}

function nextPage() {
    if (currentPageIndex < currentStorybook.images.length - 1) {
        currentPageIndex++;
        displayCurrentPage();
        updateThumbnailSelection();
        scrollToTop();
    }
}

function goToPage(index) {
    console.log(`🔖 Jumping to page ${index + 1}`);
    currentPageIndex = index;
    displayCurrentPage();
    updateThumbnailSelection();
    scrollToTop();
}

function scrollToTop() {
    document.getElementById('storybookDisplay').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// ========================================
// THUMBNAIL GALLERY
// ========================================

function generateThumbnails() {
    const gallery = document.getElementById('thumbnailGallery');
    gallery.innerHTML = '';

    currentStorybook.images.forEach((img, idx) => {
        const thumb = document.createElement('button');
        thumb.onclick = () => goToPage(idx);
        thumb.className = currentPageIndex === idx ? 'active' : '';
        thumb.setAttribute('data-page', idx);

        if (img.image_filename === 'error') {
            thumb.innerHTML = `
                <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #fee 0%, #fdd 100%); 
                            display: flex; align-items: center; justify-content: center;">
                    <svg style="width: 40%; height: 40%; color: #ef4444;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
            `;
        } else {
            thumb.innerHTML = `
                <img src="${API_URL}/images/${img.image_filename}?t=${Date.now()}" 
                     alt="Page ${idx + 1}">
            `;
        }

        gallery.appendChild(thumb);
    });

    console.log(`🖼️ Generated ${currentStorybook.images.length} thumbnails`);
}

function updateThumbnailSelection() {
    const thumbnails = document.querySelectorAll('.thumbnail-grid button');
    thumbnails.forEach((thumb, idx) => {
        if (idx === currentPageIndex) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
}

// ========================================
// RESET FORM
// ========================================

function resetForm() {
    console.log('🔄 Resetting to create new story...');
    
    // Stop any ongoing progress polling
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
    
    document.getElementById('inputForm').classList.remove('hidden');
    document.getElementById('storybookDisplay').classList.add('hidden');
    document.getElementById('storyInput').value = '';
    document.getElementById('titleInput').value = 'My Magical Adventure';
    currentStorybook = null;
    currentPageIndex = 0;
    hideError();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

document.addEventListener('keydown', (e) => {
    if (!currentStorybook) return;
    
    if (e.key === 'ArrowLeft') {
        previousPage();
    } else if (e.key === 'ArrowRight') {
        nextPage();
    } else if (e.key === 'Escape') {
        resetForm();
    }
});

// ========================================
// INITIALIZATION
// ========================================

// Wait for page to fully load before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

function initializeApp() {
    console.log('✨ Magical Storybook Illustrator loaded!');
    console.log('🎨 Ready to create amazing stories!');
    console.log('💡 Tip: Use Arrow keys to navigate pages, ESC to go back');
    
    // Verify elements are loaded
    const generateBtn = document.getElementById('generateBtn');
    const storyInput = document.getElementById('storyInput');
    const titleInput = document.getElementById('titleInput');
    
    if (!generateBtn || !storyInput || !titleInput) {
        console.error('❌ ERROR: HTML elements not found!');
        console.error('Generate button:', generateBtn);
        console.error('Story input:', storyInput);
        console.error('Title input:', titleInput);
    } else {
        console.log('✅ All elements loaded successfully!');
    }
}
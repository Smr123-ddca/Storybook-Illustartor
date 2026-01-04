const API_URL = 'http://localhost:8000';

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('generateBtn').addEventListener('click', generateStory);
    document.getElementById('restartBtn').addEventListener('click', () => location.reload());
});

async function generateStory() {
    const titleInput = document.getElementById('storyTitle');
    const textInput = document.getElementById('storyText');
    
    const title = titleInput.value.trim() || "My Story";
    const text = textInput.value.trim();

    if (!text) {
        alert("The pages are empty! Please write a story first.");
        return;
    }

    // UI Switch
    document.getElementById('inputSection').classList.add('hidden');
    document.getElementById('loadingSection').classList.remove('hidden');
    updateProgress(10, "Preparing the canvas...");

    try {
        const response = await fetch(`${API_URL}/generate-storybook?title=${encodeURIComponent(title)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ story_text: text })
        });

        updateProgress(50, "Sketching characters...");

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Server error");
        }

        const data = await response.json();
        updateProgress(100, "Adding final details...");
        
        // Wait a bit to show 100% progress
        setTimeout(() => displayResults(data), 800);

    } catch (error) {
        console.error(error);
        alert("Oh no! The magic spell failed: " + error.message);
        location.reload();
    }
}

function displayResults(data) {
    document.getElementById('loadingSection').classList.add('hidden');
    const resultsSection = document.getElementById('resultsSection');
    const container = document.getElementById('pagesContainer');
    
    document.getElementById('resultTitle').textContent = data.story_title;
    container.innerHTML = "";
    resultsSection.classList.remove('hidden');

    data.images.forEach(page => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'book-page';

        // Image Logic
        let imgHtml = '';
        if (page.image_filename && page.image_filename !== 'error') {
            const imgSrc = `${API_URL}/images/${page.image_filename}?t=${Date.now()}`;
            imgHtml = `<img src="${imgSrc}" class="page-img" alt="Page Illustration">`;
        } else {
            imgHtml = `<div style="padding:4rem; text-align:center; background:#f0f0f0; color:#888;">Image missing</div>`;
        }

        // Layout: Image wrapper + Text content
        pageDiv.innerHTML = `
            <div class="page-img-wrapper">
                ${imgHtml}
            </div>
            <div class="page-content">
                <span class="page-num">Page ${page.page_number}</span>
                <p class="page-text">${page.page_text}</p>
            </div>
        `;
        container.appendChild(pageDiv);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgress(percent, text) {
    document.getElementById('progressFill').style.width = percent + '%';
    document.getElementById('loadingText').textContent = text;
}
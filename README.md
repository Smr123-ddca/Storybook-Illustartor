# Storybook-Illustartor

Storybook Illustrator is a full-stack web application that takes a user-written story and automatically generates an **AI-illustrated storybook**.  
Each page of the story is paired with a corresponding image, creating a simple children’s book–style experience.

This project was built primarily as a **learning project** to explore FastAPI, frontend basics, and AI image generation workflows.

## 🌟 Features

- ✍️ Accepts a story as plain text input  
- 📄 Automatically splits the story into multiple pages  
- 🎨 Generates one AI illustration per page  
- 📊 Shows real-time progress while images are being generated  
- 🖼️ Displays the final output as a digital illustrated storybook  
- 🌐 Simple, lightweight frontend using HTML, CSS, and JavaScript  

## 🧠 How the Application Works

1. The user enters a story in the frontend interface.
2. The frontend sends the story to the backend API.
3. The backend:
   - Splits the story into pages (based on paragraphs or word count).
   - Generates an image prompt for each page.
4. A free AI image generation API(Pollination.ai) is used to create illustrations.
5. Each page’s text and image URL are returned to the frontend.
6. The frontend renders the story page by page like a storybook.

## 🛠️ Tech Stack

### Backend
- **FastAPI** – API framework  
- **Python**  
- **Pydantic** – request and response models  
- **Pillow (PIL)** – image handling  
- **CORS Middleware** – frontend–backend communication  

### Frontend
- **HTML**
- **CSS**
- **Vanilla JavaScript**

## 📂 Project Structure

Storybook-Illustartor
```
│
├── backend/
│   ├── main.py          # FastAPI backend logic
│   ├── images/          # Generated images
│   ├── .env             # Environment variables
│   └── requirements.txt
│
├── frontend/
│   ├── index.html       # Main UI
│   ├── style.css        # Styling
│   └── script.js        # Frontend logic
│
└── README.md
```

## 🚀 How to Run the Project Locally

### Step 1: Clone the Repository
```bash
git clone https://github.com/Smr123-ddca/Storybook-Illustartor.git
cd Storybook-Illustartor
````

---

### Step 2: Backend Setup

Navigate to the backend folder and install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The backend will run at:

```
http://localhost:8000
```

---

### Step 3: Frontend Setup

Open the frontend integrated terminal and use the following server to run the magic_book.html 

```
python -m http.server 3000
```

The frontend should run at 
```
http://localhost:3000
```

---

## 📸 Example Usage

1. Paste a short fantasy or children’s story.
2. Click **Generate Storybook**.
3. Watch the real-time progress as images are created.
4. View the completed illustrated storybook page by page.

---

## ⚠️ Limitations

* Uses a **free public AI image API(Pollination.ai)**, so:

  * Image quality may vary
  * Generation speed depends on network conditions
* Basic error handling
* Not production-ready
* Character consistency across images is not guaranteed

---

## 📚 Learning Disclaimer

This project was created for **learning and experimentation purposes**.

While I understand the **logic, flow, and structure** of the application, much of the initial scaffolding and guidance was assisted by AI tools and official documentation.
This project is **not intended to represent expert-level backend development**, but rather my learning journey.

---

## 🌱 Possible Future Improvements

* Improved story splitting logic (word-based instead of paragraph-based)
* More aesthetic, animated storybook UI
* Downloadable PDF or image storybooks
* Character consistency across illustrations
* User authentication and saved storybooks

---

## 🤍 Credits

* Developed by **G Smruti Shriya**
* AI image generation powered by a Pollination API
* Inspired by children’s fantasy storybooks

---

## 📬 Feedback

Suggestions, improvements, and feedback are welcome.
Feel free to open an issue or fork the repository.

✨ Happy storytelling ✨

```

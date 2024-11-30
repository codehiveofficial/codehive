# Codehive 🌐💻  

Codehive is a web-based platform designed to provide a **collaborative coding environment** integrated with **communication services** and an **AI-powered code assistant**. It aims to empower developers and teams with seamless collaboration, code sharing, and debugging tools.  

## 🌟 **Key Features**  

### 🔗 **Collaborative Code Editor** 📝  
- Supports coding in **Python**, **C**, **Java**, **JavaScript**, **C++**, and **TypeScript**.  
- Share **Room IDs** or direct links to invite others.  
- Real-time collaboration: Changes made by one user instantly reflect for all participants.  

### 📹 **Video Calling and Chat** 💬  
- Integrated video calling with on/off toggles.  
- Built-in chat system for easy communication.  

### ⚙️ **Custom Inputs and Code Execution** 🖥️  
- Provide custom inputs for programs and execute code directly within the app.  

### 🎨 **Themes and Code Snippets** 🌈  
- Over **20+ themes** available for personalizing the code editor.  
- Export code snippets as **PNG** images or files with respective language extensions.  

### 🤖 **Codehive Genie** 🧞  
- AI-powered coding assistant integrated into Codehive.  
- Provides assistance in:  
  - Generating code.  
  - Debugging and optimizing code.  
- Powered by **Llama 3.1** via the **Groq AI Cloud**.  

### 📦 **In-Built Compiler** ⚡  
- Run and test your code directly within the platform.  

### 📱 **Responsive Design** 📱  
- Fully optimized for use on **phones**, **tablets**, and **laptops**.  

## 📸 Screenshots  

### 🌟 Collaborative Editor  
![Collaborative Editor](https://github.com/codehiveofficial/codehive/blob/main/public/img2.png?raw=true)  

### 🌟 Codehive Genie in Action  
![Codehive Genie](https://github.com/codehiveofficial/codehive/blob/main/public/img3.png?raw=true)

### 🌟 Video Calling and Chat  
![Video Calling](https://github.com/codehiveofficial/codehive/blob/main/public/Screenshot%202024-12-01%20015641.png)  

### 🌟 Generate Beautiful Code Snippets
![Code Snippets](https://github.com/codehiveofficial/codehive/blob/main/public/codehive_snippet%20(4).png)  


## 🛠️ **Tech Stack**  

### Frontend  
- **Next.js** and **React.js**  
- **TypeScript**  
- **Tailwind CSS** for styling  
- **Monaco Editor** for code editing (with themes)  
- **HTML2Canvas** for snippet generation  

### Backend  
- **Codehive Genie** ([Repo](https://github.com/codehiveofficial/codehive-genie)):  
  - Python-based **Flask API** utilizing **Llama 3.1** for AI-driven coding assistance.  
  - Integrated with **Groq AI Cloud** for LLM parameterization.  

- **Codehive Server** ([Repo](https://github.com/codehiveofficial/codehive-server)):  
  - Built using **Node.js** and **Express**.  
  - Handles **video calling** and **chat streaming** using **Socket.IO**.  


## 🚀 **Installation Guide**  

### 1. **Clone the Repo** 🔗  
```bash  
git clone https://github.com/codehiveofficial/codehive.git  
cd codehive  
```  

### 2. **Install Dependencies** 📦  
```bash  
npm install --force  
```  
> **Note**: The `--force` flag is used because some packages do not yet support the newer React version. Don't worry, this won't cause any issues.  

### 3. **Set Environment Variables** 🔧  
Coordinate with the following repositories to set up the required environment variables:  
- [Codehive Genie](https://github.com/codehiveofficial/codehive-genie)  
- [Codehive Server](https://github.com/codehiveofficial/codehive-server)  

Create a `.env` file in the root directory and configure the following variables:  
```env  
NEXT_PUBLIC_AUTH_SECRET= 
NEXT_PUBLIC_CODEHIVE_GENIE_API_URL= 
NEXT_PUBLIC_SOCKET_BACKEND_URL= 
NEXT_PUBLIC_FRONTEND_URL= 
NEXT_PUBLIC_CONTACT_US_API= 
NEXT_PUBLIC_AUTH_MESSAGE=  
```  

### 4. **Run the Development Server** ▶️  
```bash  
npm run dev  
```  
Your server will be running on [http://localhost:3000](http://localhost:3000).  


## 🌍 **Deployment**  
- 🚀 We recommend deploying the **Next.js** app on **Vercel** for its seamless Next.js template support.  
- 🛠️ For other repositories, follow their respective README instructions.  


## 📜 **License**  
Codehive is licensed under the **MIT License**.  
[View License](https://github.com/codehiveofficial/codehive/blob/main/LICENSE)  


## ❓ **Have Questions?**  
For any queries, feel free to:  
- 📬 Contact us via the **Contact Us** section on the website.  
- 🚀 Raise an issue in the repository.  

Enjoy a streamlined coding experience with **Codehive**! 🖥️✨  

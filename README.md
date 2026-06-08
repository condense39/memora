# Memora 📸
**An AI-Powered Event Media Sharing & Facial Recognition Platform**

Memora is a full-stack Next.js application designed to streamline event media sharing. It allows users to collaboratively upload hundreds of photos to private or public events, utilizes Google Cloud Vision to automatically categorize images, and leverages AWS Rekognition to instantly notify users when their face is detected in a new upload.

https://memora-henna-two.vercel.app/

---

## 🚀 Key Features

* **Event Management:** Create public events for anyone to view, or private invite-only events secured by role-based access control.
* **Bulk Media Upload:** Effortlessly drag-and-drop hundreds of photos or videos. Files bypass the web server and upload directly to AWS S3 via Presigned URLs for infinite scalability.
* **AI Facial Recognition:** Users can enroll in the system by uploading a single selfie. The backend asynchronously scans all newly uploaded event photos, and if a match is found with >85% confidence, the matched user is instantly notified.
* **Privacy First AI:** Face scanning strictly adheres to event visibility and membership. The AI will never notify or scan a user for a private event they do not belong to.
* **Google Vision Tagging:** Automatically detects labels and tags for all uploaded media (e.g., "Wedding", "Nature", "Smile"), powering a global search system.
* **Real-time Notifications:** Powered by Pusher WebSockets, users receive instant in-app alerts the moment they receive a like, a comment, or an AI face match.
* **Social Features:** Like, download, favourite, share, and comment on media.
* **Responsive UI:** Built with Tailwind CSS and Radix UI (shadcn), featuring beautiful mobile-friendly layouts, animated skeletons, and off-canvas drawers.

---

## 🛠 Tech Stack

### Frontend
* **Framework:** Next.js 14 (App Router, Server Components, Suspense Boundaries)
* **Styling:** Tailwind CSS, shadcn/ui (Radix primitives)
* **Icons & Notifications:** Lucide React, Sonner (Toasts)
* **Forms:** React Hook Form + Zod validation

### Backend & Database
* **API:** Next.js Serverless API Routes
* **Database:** MongoDB (Atlas) with Mongoose ORM
* **Authentication:** NextAuth.js v5 (Credentials + Google OAuth)

### Cloud Infrastructure & AI
* **Storage:** AWS S3 (Direct presigned URL uploads)
* **Machine Learning (Faces):** AWS Rekognition
* **Machine Learning (Tags):** Google Cloud Vision API
* **WebSockets:** Pusher

---

## 🏗 System Architecture & Data Flow

### 1. The Upload Pipeline (Direct to S3)
To handle massive files without crashing the Node.js server:
1. The React client requests an upload token from the Next.js backend.
2. The backend securely generates an **AWS S3 Presigned URL**.
3. The client uploads the file *directly* to AWS S3.
4. Once successful, the client saves the final S3 URL to MongoDB.

### 2. The AI Processing Pipeline
When a user uploads a photo, a background asynchronous process is spawned:
1. **Tagging:** The image URL is sent to the Google Vision API, which returns a list of labels. These tags are saved to the photo document.
2. **Facial Recognition:** The image is sent to AWS Rekognition. AWS scans the photo for faces and compares them against the `memora-faces` collection. If a face matches an enrolled user, a Webhook/Pusher event is fired, instantly pushing a real-time notification to the matched user's dashboard.

### 3. Role-Based Access Control (RBAC)
* **Global Admin:** Has unrestricted access to all events, members, and media. Can delete any photo or event.
* **Club Admin:** The creator of an event. Can edit event details, manage members, and delete any photo within their event.
* **Club Member:** Invited users. Can view private events, upload photos, and delete their own photos.
* **Viewer:** Public users viewing public events. Can only view and like/download. Cannot upload.

---

## 📦 Local Setup & Deployment

### Prerequisites
* Node.js 18+
* A MongoDB Atlas Cluster
* AWS Account (S3 and Rekognition)
* Google Cloud Console Account (Vision API & OAuth)
* Pusher Account

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/memora.git
cd memora
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_random_secure_string_here

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster...

# Google Services
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_VISION_API_KEY=your_google_api_key_with_vision_enabled

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your_s3_bucket_name
AWS_REKOGNITION_COLLECTION_ID=memora-faces

# Pusher (Real-time)
NEXT_PUBLIC_PUSHER_APP_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
PUSHER_APP_ID=your_pusher_app_id
PUSHER_SECRET=your_pusher_secret
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## ☁️ Cloud Service Configurations

### AWS Configuration
1. Create an IAM User with Programmatic Access.
2. Attach two policies: `AmazonS3FullAccess` and `AmazonRekognitionFullAccess`.
3. Configure your S3 bucket with the following **CORS policy** to allow direct frontend uploads:
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedOrigins": ["http://localhost:3000", "https://your-production-domain.com"],
        "ExposeHeaders": []
    }
]
```

### Google Cloud Configuration
1. Enable the **Google Vision API** (Ensure billing is enabled, the first 1,000 requests/month are free).
2. Enable the **Google+ API** or **People API** for OAuth login.
3. Generate an API Key restricted to the Vision API.

---

## 💡 Troubleshooting & Known Issues

* **`IndexOptionsConflict` on Search:** MongoDB strictly allows only one `$text` index per collection. If you alter the Mongoose schema for text searching, you must manually drop the old index in your MongoDB Atlas console before restarting the app.
* **Next.js CSR Bailouts:** If `useSearchParams` is used without a `<Suspense>` boundary in Next.js 14, the production build will fail. Ensure components reading URL parameters are properly wrapped.
* **AWS Collection Not Found:** Before a user can upload a selfie for facial recognition, the `AWS_REKOGNITION_COLLECTION_ID` must be manually created via the AWS CLI or SDK. 

---

*Built for capturing and securing memories.*

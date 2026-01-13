# Feature Access Control - Implementation Prompts

## 📚 Available Prompts

You have **2 prompts** ready to give to Claude for complete implementation:

---

## 1️⃣ Backend Implementation

### File: [CLAUDE_BACKEND_PROMPT.md](CLAUDE_BACKEND_PROMPT.md)

**Give this to Claude in your backend project**

**What it creates:**
- ✅ 1 Model: `FeatureAccess`
- ✅ 3 API Endpoints (GET, PUT, POST)
- ✅ Controller with access check logic
- ✅ Routes configuration
- ✅ Seed data for 3 features

**Features:**
- SOS (Quizzes)
- CONNECT (Clubs)
- CHALLENGE (Challenges)

**Time:** 2-3 hours

---

## 2️⃣ Mobile App Integration

### File: [MOBILE_APP_INTEGRATION_PROMPT.md](MOBILE_APP_INTEGRATION_PROMPT.md)

**Give this to Claude in your mobile app project**

**What it creates:**
- ✅ API Service (`featureAccessService.js`)
- ✅ Custom Hook (`useFeatureAccess.js`)
- ✅ Access Denied Component (`AccessDenied.js`)
- ✅ Integration in 3 screens:
  - QuizzesScreen (SOS)
  - ClubsScreen (CONNECT)
  - ChallengesScreen (CHALLENGE)

**Time:** 1-2 hours

---

## 🎯 The 3 Features

| Feature Key | Name | What It Controls |
|------------|------|------------------|
| `SOS` | Quizzes/SOS Program | Access to quizzes |
| `CONNECT` | Clubs/Community | Access to clubs |
| `CHALLENGE` | Challenges | Access to challenges |

---

## 🚀 Implementation Order

### Step 1: Admin Panel (Already Done ✅)
- Frontend complete
- Admin can toggle features at `/feature-access`
- Waiting for backend

### Step 2: Backend
→ Give [CLAUDE_BACKEND_PROMPT.md](CLAUDE_BACKEND_PROMPT.md) to Claude

### Step 3: Mobile App
→ Give [MOBILE_APP_INTEGRATION_PROMPT.md](MOBILE_APP_INTEGRATION_PROMPT.md) to Claude

---

## 📖 Quick Reference

### For Backend Team:
- **Prompt:** `CLAUDE_BACKEND_PROMPT.md`
- **Guide:** `BACKEND_IMPLEMENTATION_GUIDE.md`

### For Mobile App Team:
- **Prompt:** `MOBILE_APP_INTEGRATION_PROMPT.md`

---

## ✅ What Each Prompt Contains

### Backend Prompt:
- Complete context
- Exact code for all files
- Access check logic
- Test commands
- Response formats
- Integration details

### Mobile App Prompt:
- API integration code
- Custom hooks
- UI components
- Screen integration examples
- Error handling
- Testing checklist

---

## 🎊 Ready to Go!

Both prompts are **complete and self-contained**. Just give them to Claude in the respective projects:

1. **Backend:** `CLAUDE_BACKEND_PROMPT.md`
2. **Mobile App:** `MOBILE_APP_INTEGRATION_PROMPT.md`

That's it! 🚀

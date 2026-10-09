# 📖 Universal Rich Text Editor — Client & Developer Integration Guide
### সর্বজনীন রিচ টেক্সট এডিটর — ক্লায়েন্ট ও ডেভেলপার ব্যবহার নির্দেশিকা

> **Version:** 1.0.0 (Production Stable)  
> **Target Audiences:** Clients, Frontend Developers, Full-Stack Developers, WordPress/PHP Developers  
> **Supported Platforms:** Vanilla JS (Plain PHP, HTML, CodeIgniter), Vue 3, Vue 2, Laravel  
> **License:** MIT  

---

## সূচিপত্র / Table of Contents
1. [পরিচিতি / Overview](#1-পরিচিতি--overview)
2. [কীভাবে প্রজেক্টে যুক্ত করবেন / Installation & Setup](#2-কীভাবে-প্রজেক্টে-যুক্ত-করবেন--installation--setup)
   - [পদ্ধতি ১: Plain HTML / PHP / CodeIgniter (Vanilla JS)](#পদ্ধতি-১-plain-html--php--codeigniter-vanilla-js)
   - [পদ্ধতি ২: Vue 3 প্রজেক্টে](#পদ্ধতি-২-vue-3-প্রজেক্টে)
   - [পদ্ধতি ৩: Vue 2 প্রজেক্টে](#পদ্ধতি-৩-vue-2-প্রজেক্টে)
   - [পদ্ধতি ৪: Laravel অ্যাপ্লিকেশনে](#পদ্ধতি-৪-laravel-অ্যাপ্লিকেশনে)
3. [কোন সেকশনের কাজ কী এবং ব্যবহারের নিয়ম / Feature & Section Guide](#3-কোন-সেকশনের-কাজ-কী-এবং-ব্যবহারের-নিয়ম--feature--section-guide)
   - [১. টেক্সট ফরম্যাটিং (Text Formatting)](#১-টেক্সট-ফরম্যাটিং-text-formatting)
   - [২. টেক্সট কালার ও হাইলাইট (Colors & Highlight)](#২-টেক্সট-কালার-ও-হাইলাইট-colors--highlight)
   - [৩. টেক্সট অ্যালাইনমেন্ট ও ভাষা দিক (Alignment & RTL/LTR)](#৩-টেক্সট-অ্যালাইনমেন্ট-ও-ভাষা-দিক-alignment--rtlltr)
   - [৪. ছবি ও ফাইল আপলোড (Image & File Upload)](#৪-ছবি-ও-ফাইল-আপলোড-image--file-upload)
   - [৫. টেবিল তৈরি ও এডিটিং (Tables & Context Menu)](#৫-টেবিল-তৈরি-ও-এডিটিং-tables--context-menu)
   - [৬. কোড ব্লক ও সিনট্যাক্স হাইলাইটিং (Code Blocks)](#৬-কোড-ব্লক-ও-সিনট্যাক্স-হাইলাইটিং-code-blocks)
   - [৭. ভিডিও ও ম্যাপ এম্বেড (YouTube / Vimeo / Maps Embed)](#৭-ভিডিও-ও-ম্যাপ-এম্বেড-youtube--vimeo--maps-embed)
   - [৮. স্ল্যাশ কমান্ড (Notion-Style Slash `/` Commands)](#৮-স্ল্যাশ-কমান্ড-notion-style-slash--commands)
   - [৯. মেনশন সিস্টেম (User Mentions `@`)](#৯-মেনশন-সিস্টেম-user-mentions-)
   - [১০. অটোসেভ ও ড্রাফট রিকভারি (Autosave & Draft Recovery)](#১০-অটোসেভ-ও-ড্রাফট-রিকভারি-autosave--draft-recovery)
   - [১১. ওয়ার্ড ও ক্যারেক্টার কাউন্টার (Word & Character Counter)](#১১-ওয়ার্ড-ও-ক্যারেক্টার-কাউন্টার-word--character-counter)
   - [১২. রিড-অনলি ভিউয়ার মোড (Read-Only Viewer Mode)](#১২-রিড-অনলি-ভিউয়ার-মোড-read-only-viewer-mode)
   - [১৩. থিমিং ও ডার্ক মোড (Theming & Dark Mode)](#১৩-থিমিং-ও-ডার্ক-মোড-theming--dark-mode)
   - [১৪. এআই রাইটিং অ্যাসিস্ট্যান্ট (AI Assistant)](#১৪-এআই-রাইটিং-অ্যাসিস্ট্যান্ট-ai-assistant)
4. [সার্ভার সাইড আপলোড ও ডেটাবেজ সেভ করার নিয়ম / Backend API Specs](#4-সার্ভার-সাইড-আপলোড-ও-ডেটাবেজ-সেভ-করার-নিয়ম--backend-api-specs)
5. [লাইভ সার্ভার ও cPanel এ ডিপ্লয়মেন্ট গাইড / Live Server & cPanel Deployment](#5-লাইভ-সার্ভার-ও-cpanel-এ-ডিপ্লয়মেন্ট-গাইড--live-server--cpanel-deployment)
6. [সাধারণ জিজ্ঞাসা ও সমাধান / FAQ & Troubleshooting](#6-সাধারণ-জিজ্ঞাসা-ও-সমাধান--faq--troubleshooting)

---

## 1. পরিচিতি / Overview

**Universal Rich Text Editor** হলো একটি আধুনিক, দ্রুতগতির এবং সম্পূর্ণ সিকিউরড রিচ টেক্সট এডিটর। এটি আপনি যেকোনো ওয়েবসাইটে ব্যবহার করতে পারেন—চাই তা সাধারণ **PHP**, **Laravel**, **CodeIgniter**, **Vue.js**, কিংবা সাধারণ **HTML/JS** প্রজেক্ট হোক। 

### মূল বৈশিষ্ট্যসমূহ:
- 🚀 **কোনো ফ্রেমওয়ার্কের উপর বাধ্যতামূলক নির্ভরতা নেই**: সাধারণ `<script>` ট্যাগ দিয়েও চালানো যায়।
- 🛡️ **এন্টারপ্রাইজ সিকিউরিটি (XSS Safe)**: ক্লায়েন্ট ও সার্ভার উভয় স্থানেই স্ক্রিপ্ট ইনজেকশন ব্লক করে।
- 🎨 **আধুনিক ইন্টারফেস**: Notion-স্টাইল স্ল্যাশ কমান্ড (`/`), ফ্লোটিং বাবল মেনু, এবং সুন্দর ডার্ক মোড।
- 📱 **সম্পূর্ণ রেসপনসিভ ও অ্যাক্সেসিবল**: মোবাইল, ট্যাবলেট ও পিসিতে সমান সুন্দর দেখায় (WCAG 2.1 AA Compliant)।
- 🌍 **বাংলা ও যেকোনো ভাষার সাপোর্ট**: বাংলা, আরবি (RTL), ইংরেজি সহ সকল ভাষার জটিল ইউনিকোড নির্ভুলভাবে সমর্থন করে।

---

## 2. কীভাবে প্রজেক্টে যুক্ত করবেন / Installation & Setup

আপনার প্রজেক্টের ধরন অনুযায়ী নিচের যেকোনো একটি সহজ পদ্ধতি বেছে নিন:

---

### পদ্ধতি ১: Plain HTML / PHP / CodeIgniter (Vanilla JS)
আপনি যদি কোনো আধুনিক বিল্ড টুল (Webpack/Vite/NPM) ছাড়া সাধারণ **PHP**, **HTML**, বা **CodeIgniter** এ ব্যবহার করতে চান:

#### ১.১. বিকল্প ক (TinyMCE-এর মতো সরাসরি গ্লোবাল CDN লিঙ্ক - সবচেয়ে সহজ)
কোনো ফাইল ডাউনলোড বা কপি না করেই সরাসরি গ্লোবাল CDN ব্যবহার করতে পারেন:
```html
<!-- এডিটরের সিএসএস -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shamimsofte/universal-editor-core@latest/dist/styles.css">

<!-- এডিটরের জাভাস্ক্রিপ্ট (UMD) -->
<script src="https://cdn.jsdelivr.net/npm/@shamimsofte/universal-editor-core@latest/dist/universal-editor.umd.js"></script>
```

#### ১.১. বিকল্প খ (লোকাল ফাইল কপি করে রাখা)
প্রজেক্টের বিল্ট ফাইল থেকে এই দুটি ফাইল কপি করে আপনার ওয়েব ডিরেক্টরিতে রাখুন:
- `universal-editor.umd.js` (পাথ: `packages/core/dist/universal-editor.umd.js`)
- `styles.css` (পাথ: `packages/core/dist/styles.css`)

#### ১.২. HTML পেজে কোড লিখুন
```html
<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <title>আমার এডিটর পেজ</title>
  
  <!-- ১. এডিটরের সিএসএস স্টাইলশিট লিংক করুন -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shamimsofte/universal-editor-core@latest/dist/styles.css">
  <style>
    .editor-wrapper {
      max-width: 900px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      overflow: hidden;
    }
  </style>
</head>
<body>

  <div class="editor-wrapper">
    <!-- ২. এডিটর রেন্ডার করার জন্য একটি খালি div দিন -->
    <div id="editor-container"></div>
  </div>

  <button id="save-btn" style="padding: 10px 20px; margin: 20px auto; display: block;">কন্টেন্ট সংরক্ষণ করুন</button>

  <!-- ৩. এডিটরের জাভাস্ক্রিপ্ট ফাইল যুক্ত করুন -->
  <script src="https://cdn.jsdelivr.net/npm/@shamimsofte/universal-editor-core@latest/dist/universal-editor.umd.js"></script>

  <script>
    // ৪. এডিটর ইনিশিয়ালাইজ করুন
    const editor = UniversalEditor.createEditor({
      element: document.getElementById('editor-container'),
      content: '<p>এখানে আপনার লেখা শুরু করুন...</p>',
      placeholder: 'কিছু লিখুন বা কমান্ডের জন্য "/" চাপুন...',
      theme: 'light', // অথবা 'dark', 'sepia'
      toolbar: true, // ফুল টুলবার চালু করার জন্য
      bubbleMenu: true,
      slashCommands: true,
      onUpdate: ({ editor }) => {
        // ব্যবহারকারী যখনই কিছু লিখবেন, এই ফাংশনটি কল হবে
        const currentHtml = editor.getHTML();
        console.log('আপডেট হওয়া কন্টেন্ট:', currentHtml);
      }
    });

    // ৫. ডেটা সেভ বা ফর্ম সাবমিট করা
    document.getElementById('save-btn').addEventListener('click', () => {
      const htmlContent = editor.getHTML(); // এইচটিএমএল হিসেবে পাবেন
      const jsonContent = editor.getJSON(); // জেএসওএন এএসটি হিসেবে পাবেন
      
      // আপনার ব্যাকএন্ড এপিআই এ পাঠাতে পারেন:
      fetch('/api/save-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: htmlContent })
      }).then(res => alert('কন্টেন্ট সফলভাবে সেভ হয়েছে!'));
    });
  </script>
</body>
</html>
```

---

### পদ্ধতি ২: Vue 3 প্রজেক্টে
আপনার যদি **Vue 3** (Vite, Nuxt 3, Vue CLI) প্রজেক্ট থাকে:

#### ২.১. ইনস্টল করুন
```bash
npm install @shamimsofte/universal-editor-vue3 @shamimsofte/universal-editor-core
```

#### ২.২. কম্পোনেন্টে ব্যবহার করুন
```vue
<template>
  <div class="editor-page">
    <h2>পোস্ট তৈরি করুন</h2>
    
    <!-- RichTextEditor কম্পোনেন্ট -->
    <RichTextEditor
      v-model="postContent"
      placeholder="আপনার পোস্ট লিখুন..."
      theme="light"
      :enable-toolbar="true"
      :enable-bubble-menu="true"
      :enable-slash-commands="true"
      :upload-url="'/api/editor/upload'"
      @update="handleUpdate"
    />

    <button @click="submitPost">পোস্ট পাবলিশ করুন</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { RichTextEditor } from '@shamimsofte/universal-editor-vue3';
import '@shamimsofte/universal-editor-vue3/style.css';

// v-model এর মাধ্যমে রিয়েক্টিভভাবে কন্টেন্ট বাইন্ড হবে
const postContent = ref('<h1>স্বাগতম!</h1><p>পোস্ট লেখা শুরু করুন।</p>');

function handleUpdate({ editor }) {
  console.log('বর্তমান ক্যারেক্টার সংখ্যা:', editor.getText().length);
}

function submitPost() {
  console.log('পাবলিশের জন্য কন্টেন্ট:', postContent.value);
}
</script>
```

---

### পদ্ধতি ৩: Vue 2 প্রজেক্টে
আপনার যদি **Vue 2** (Vue 2.6 বা 2.7) প্রজেক্ট থাকে:

#### ৩.১. ইনস্টল করুন
```bash
npm install @shamimsofte/universal-editor-vue2 @shamimsofte/universal-editor-core
```

#### ৩.২. কম্পোনেন্টে ব্যবহার করুন
```vue
<template>
  <div>
    <RichTextEditor
      v-model="content"
      placeholder="Vue 2 এডিটর..."
      theme="light"
    />
  </div>
</template>

<script>
import { RichTextEditor } from '@shamimsofte/universal-editor-vue2';

export default {
  components: { RichTextEditor },
  data() {
    return {
      content: '<p>Vue 2 এডিটর সফলভাবে কাজ করছে।</p>'
    };
  }
};
</script>
```

---

### পদ্ধতি ৪: Laravel অ্যাপ্লিকেশনে
আপনার ব্যাকএন্ড যদি **Laravel** হয়, তবে অফিশিয়াল প্যাকেজের মাধ্যমে ইমেজ আপলোড, এক্সএসএস ক্লিন এবং ডেটাবেজ ভার্সনিং সরাসরি পেতে পারেন:

```bash
# কম্পোজার প্যাকেজ ইনস্টল
composer require shamimsofte/laravel-universal-editor

# কনফিগারেশন ফাইল পাবলিশ (config/editor.php)
php artisan vendor:publish --tag=editor-config

# ডেটাবেজ মাইগ্রেশন রান (ডকুমেন্ট ও ভার্সন টেবিল তৈরি হবে)
php artisan migrate

# স্টোরেজ লিংক তৈরি (পাবলিক ইমেজের জন্য)
php artisan storage:link
```

#### কন্ট্রোলারে ডেটা স্যানিটাইজ ও সেভ করার উদাহরণ:
```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use UniversalEditor\Laravel\Facades\Editor;
use UniversalEditor\Laravel\Models\EditorDocument;

class ArticleController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content_html' => 'required|string',
        ]);

        // এডিটরের সিকিউরড স্যানিটাইজার দিয়ে হ্যাকিং/XSS কোড দূর করা
        $safeHtml = Editor::sanitize($request->input('content_html'));

        $document = EditorDocument::create([
            'title' => $request->title,
            'content_html' => $safeHtml,
            'user_id' => auth()->id(),
            'status' => 'published',
        ]);

        return response()->json(['status' => 'success', 'data' => $document]);
    }
}
```

---

## 3. কোন সেকশনের কাজ কী এবং ব্যবহারের নিয়ম / Feature & Section Guide

এডিটরে থাকা প্রতিটি টুলস ও সেকশনের কাজ এবং ব্যবহারের বিস্তারিত নিয়ম নিচে দেওয়া হলো:

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [ Undo ] [ Redo ] | [ Bold ] [ Italic ] [ Underline ] [ Strike ] [ Code ] | [ H1 ▾ ] | [ • List ] [ 1. List ] │
│ [ Align ▾ ] | [ Color ▾ ] [ Highlight ▾ ] | [ 📷 Image ] [ 🔗 Link ] [ ▦ Table ▾ ] [ 💻 Code Block ]      │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### ১. টেক্সট ফরম্যাটিং (Text Formatting)
- **Undo / Redo (পূর্বাবস্থায় ফেরা / পুনরায় করা)**:
  - কোনো ভুল লিখলে বা ডিলিট হলে `Ctrl + Z` বা Toolbar এর **Undo** বাটন চাপুন।
  - পুনরায় ফিরিয়ে আনতে `Ctrl + Y` বা **Redo** বাটন চাপুন।
- **Bold (`Ctrl + B`)**: লেখাকে গাঢ় বা মোটা করতে লেখা সিলেক্ট করে চাপুন।
- **Italic (`Ctrl + I`)**: লেখাকে বাঁকা করতে ব্যবহার করুন।
- **Underline (`Ctrl + U`)**: লেখার নিচে দাগ টানতে ব্যবহার করুন।
- **Strikethrough**: লেখার মাঝে কেটে দেওয়ার দাগ দিতে ব্যবহার করুন।
- **Heading Dropdown (H1 - H6)**:
  - আর্টিকেলের প্রধান শিরোনামের জন্য **Heading 1**।
  - সাব-হেডিং বা অনুচ্ছেদের শিরোনামের জন্য **Heading 2** ও **Heading 3**।
  - সাধারণ লেখার জন্য **Paragraph** নির্বাচন করুন।
- **List (তালিকা)**:
  - **Bullet List (`•`)**: পয়েন্ট আকারে তালিকা তৈরি করতে।
  - **Numbered List (`1, 2, 3`)**: নম্বর সহ ক্রমানুসারে তালিকা তৈরি করতে।
  - **Task List (চেকবক্স `☑`)**: টু-ডু বা চেকলিস্ট তৈরি করতে।
- **Blockquote (`“`)**: কোনো বিখ্যাত উক্তি বা বিশেষ প্যারাগ্রাফকে হাইলাইট করে দেখাতে ব্যবহার করুন।

---

### ২. টেক্সট কালার ও হাইলাইট (Colors & Highlight)
- **Text Color (লেখার রং)**:
  - ড্রপডাউন থেকে কালার প্যালেটের যেকোনো রং পছন্দ করে লেখার কালার পরিবর্তন করতে পারবেন (যেমন: লাল, নীল, সবুজ, কালো, বা কাস্টম হেক্স কোড)।
- **Background Highlight (লেখার ব্যাকগ্রাউন্ড কালার)**:
  - মার্কার পেন দিয়ে দাগ দেওয়ার মতো লেখার পেছনে হলুদ, হালকা সবুজ বা যেকোনো হাইলাইট রং দিতে পারেন।

---

### ৩. টেক্সট অ্যালাইনমেন্ট ও ভাষা দিক (Alignment & RTL/LTR)
- **Left / Center / Right / Justify**:
  - লেখাকে পাতার বামে, মাঝে, ডানে বা দুই পাশ সমান করে সাজাতে ড্রপডাউন ব্যবহার করুন।
- **Language & Direction (RTL / LTR)**:
  - বাংলা ও ইংরেজি লেখার জন্য ডিফল্ট **LTR** (বাম থেকে ডান)।
  - আরবি বা হিব্রু লেখার জন্য **RTL** নির্বাচন করলে সম্পূর্ণ এডিটর কার্সর এবং ডিরেকশন স্বয়ংক্রিয়ভাবে ডানে চলে যাবে।

---

### ৪. ছবি ও ফাইল আপলোড (Image & File Upload)
- **ছবি আপলোড করার ৩টি সহজ উপায়**:
  1. **ক্লিক করে**: টুলবারের **Image (📷)** আইকনে ক্লিক করুন -> পিসি থেকে ছবি নির্বাচন করুন বা ছবির অনলাইন URL দিন।
  2. **ড্র্যাগ অ্যান্ড ড্রপ**: কম্পিউটার থেকে যেকোনো ছবি মাউস দিয়ে টেনে এনে এডিটরের উপর ছেড়ে দিন।
  3. **কপি-পেস্ট (`Ctrl + V`)**: স্ক্রিনশট বা যেকোনো ছবি কপি করে এডিটরে পেস্ট করলেই সাথে সাথে আপলোড হয়ে যাবে।
- **ছবির সাইজ পরিবর্তন (Image Resizing)**:
  - ছবির উপর ক্লিক করলে **25%**, **50%**, **75%**, **100%** বাটন আসবে। ক্লিক করে মুহূর্তেই ছবির মাপ ছোট-বড় করুন।
- **ছবির অ্যালাইনমেন্ট**:
  - ছবিকে বামে, মাঝে বা ডানে রাখতে পারেন।
- **ফাইল অ্যাটাচমেন্ট (PDF, ZIP, Docs)**:
  - ফাইল আপলোড করলে একটি সুন্দর কার্ড তৈরি হবে, যাতে ফাইলের নাম, সাইজ এবং ডাউনলোড আইকন প্রদর্শিত হবে।

---

### ৫. টেবিল তৈরি ও এডিটিং (Tables & Context Menu)
- **টেবিল তৈরি**:
  - টুলবারের **Table (▦)** ড্রপডাউনে ক্লিক করে সারি (Rows) ও কলাম (Columns) সংখ্যা দিয়ে 'ইনসার্ট টেবিল' চাপুন।
- **টেবিল ফ্লোটিং কনটেক্সট মেনু**:
  - টেবিলের যেকোনো সেলে ক্লিক করলেই একটি বিশেষ মেনু ভেসে উঠবে:
    - **Add Row Above / Below**: উপরে বা নিচে নতুন সারি যোগ করা।
    - **Delete Row**: সারি মুছে ফেলা।
    - **Add Column Left / Right**: ডানে বা বামে নতুন কলাম যোগ করা।
    - **Delete Column**: কলাম মুছে ফেলা।
    - **Merge Cells**: একাধিক সেল সিলেক্ট করে একসাথে জোড়া লাগানো।
    - **Split Cell**: জোড়া লাগানো সেল আলাদা করা।
    - **Toggle Header**: প্রথম সারিকে টেবিল হেডার বানাতে বা সাধারণ করতে।

---

### ৬. কোড ব্লক ও সিনট্যাক্স হাইলাইটিং (Code Blocks)
- প্রোগ্রামার ও টেকনিক্যাল লেখকদের জন্য অত্যন্ত উপযোগী।
- **Code Block (💻)** আইকনে ক্লিক করুন বা কীবোর্ডে ৩টি ব্যাকটিক (```) দিয়ে স্পেস দিন।
- ড্রপডাউন থেকে ভাষা নির্বাচন করুন (JavaScript, PHP, Python, HTML, CSS, SQL, JSON ইত্যাদি)।
- কোড পেস্ট করলে তা রঙিন সিনট্যাক্স কালার সহ প্রদর্শিত হবে।
- কোড ব্লকের উপরে একটি **Copy Code** বাটন থাকবে, যাতে এক ক্লিকেই ভিজিটররা কোড কপি করতে পারেন।

---

### ৭. ভিডিও ও ম্যাপ এম্বেড (YouTube / Vimeo / Maps Embed)
- কোনো কোডিং ছাড়া ইউটিউব ভিডিও বা গুগল ম্যাপ সরাসরি যোগ করুন:
  1. টুলবারের **Embed** আইকনে ক্লিক করুন।
  2. আপনার YouTube ভিডিও লিংক (যেমন: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`) বা Google Maps লিংক পেস্ট করুন।
  3. 'Insert' চাপুন। ভিডিওটি রেসপনসিভ প্লেয়ার হিসেবে পেজে চলে আসবে।

---

### ৮. স্ল্যাশ কমান্ড (Notion-Style Slash `/` Commands)
- মাউস ছাড়াই দ্রুত কন্টেন্ট তৈরি করতে:
  - ফাঁকা লাইনে গিয়ে কীবোর্ডের স্ল্যাশ (`/`) বাটন চাপুন।
  - সাথে সাথে একটি পপআপ মেনু আসবে।
  - `/h1` লিখলে Heading 1 হবে, `/table` লিখলে টেবিল তৈরি হবে, `/image` লিখলে ছবি আপলোডার খুলবে, `/code` লিখলে কোড ব্লক আসবে।
  - কীবোর্ডের `Arrow Up / Down` দিয়ে ব্রাউজ করুন এবং `Enter` চেপে পছন্দ করুন।

---

### ৯. মেনশন সিস্টেম (User Mentions `@`)
- কোনো টিম মেম্বার বা ব্যবহারকারীকে ট্যাগ করতে:
  - কীবোর্ডে `@` চাপুন।
  - ব্যবহারকারীদের নামের তালিকা ও প্রোফাইল ছবি প্রদর্শিত হবে।
  - নাম টাইপ করে ফিল্টার করুন এবং সিলেক্ট করুন। লেখাটিতে `@User` ব্যাজ তৈরি হবে।

---

### ১০. অটোসেভ ও ড্রাফট রিকভারি (Autosave & Draft Recovery)
- কারেন্ট চলে গেলে বা ভুল করে ব্রাউজার ট্যাব বন্ধ হয়ে গেলে লেখা হারানোর ভয় নেই!
- প্রতি ২ সেকেন্ড পর পর ব্যাকগ্রাউন্ডে ব্রাউজারের লোকাল স্টোরেজে লেখাটি ড্রাফট হিসেবে সেভ হয়।
- পুনরায় পেজে ঢুকলে একটি রিকভারি পপআপ আসবে: **"পূর্বের না-সেভ করা ড্রাফট পাওয়া গেছে। রিকভার করবেন কি?"** — 'Restore' চাপলে পূর্বের সব লেখা ফিরে আসবে।

---

### ১১. ওয়ার্ড ও ক্যারেক্টার কাউন্টার (Word & Character Counter)
- এডিটরের একদম নিচের ডান কোণায় রিয়েল-টাইম কাউন্টার থাকে:
  - **Words**: মোট শব্দ সংখ্যা।
  - **Characters**: মোট বর্ণ বা অক্ষর সংখ্যা।
  - **Paragraphs**: মোট অনুচ্ছেদ সংখ্যা।
  - **Reading Time**: সাধারণ একজন পাঠকের এই আর্টিকেলটি পড়তে কত মিনিট লাগবে (যেমন: `2 min read`)।

---

### ১২. রিড-অনলি ভিউয়ার মোড (Read-Only Viewer Mode)
- যখন ওয়েবসাইটে ইউজারদের শুধু ব্লগ পোস্ট বা আর্টিকেলটি পড়তে দেবেন (এডিট করার প্রয়োজন নেই):
  - ভারী এডিটর লোড না করে হালকা ওজনের `<RichTextViewer />` ব্যবহার করুন।
  - এটি কোনো বাটন বা টুলবার ছাড়াই এডিটরের মূল কন্টেন্টকে নিখুঁত ও সুন্দরভাবে প্রদর্শন করে।

```vue
<!-- Vue 3 ভিউয়ার উদাহরণ -->
<RichTextViewer :content="articleHtml" theme="light" />
```

---

### ১৩. থিমিং ও ডার্ক মোড (Theming & Dark Mode)
- এডিটরে ৪টি ইনবিল্ট থিম রয়েছে:
  - **Light (ডিফল্ট)**: পরিষ্কার আধুনিক সাদা ব্যাকগ্রাউন্ড।
  - **Dark**: রাতের জন্য প্রিমিয়াম ডার্ক মোড (চোখের ক্ষতি রোধ করে)।
  - **Sepia**: বই পড়ার মতো হালকা বাদামী চোখের জন্য আরামদায়ক টোন।
  - **High-Contrast**: উচ্চ কনট্রাস্টযুক্ত অ্যাক্সেসিবল থিম।
- সিএসএস ভেরিয়েবল পরিবর্তন করে আপনার ব্র্যান্ডের রঙের সাথে সম্পূর্ণ ম্যাচ করাতে পারেন:
```css
:root {
  --ue-primary: #2563eb;       /* আপনার পছন্দের বাটন কালার */
  --ue-bg-surface: #ffffff;    /* এডিটর ব্যাকগ্রাউন্ড */
  --ue-text-main: #1e293b;     /* লেখার মূল রং */
}
```

---

### ১৪. এআই রাইটিং অ্যাসিস্ট্যান্ট (AI Assistant)
- টুলবারের **AI** বাটনে ক্লিক করলে বা লেখা সিলেক্ট করে রাইট-ক্লিক করলে ৬টি স্মার্ট এআই অপশন পাওয়া যায়:
  1. **Improve Writing**: লেখার গুণগত মান ও স্পষ্টতা বাড়ানো।
  2. **Summarize**: বড় লেখাকে সংক্ষেপে পয়েন্ট আকারে নিয়ে আসা।
  3. **Expand**: ছোট পয়েন্টকে বিস্তারিত অনুচ্ছেদে রূপান্তর করা।
  4. **Fix Grammar**: বানান ও ব্যাকরণ ভুল স্বয়ংক্রিয়ভাবে ঠিক করা।
  5. **Change Tone**: লেখাকে Professional, Casual, বা Friendly টোনে রূপান্তর করা।
  6. **Translate**: বাংলা, ইংরেজি, স্প্যানিশ, ফ্রেঞ্চ ইত্যাদি ভাষায় অনুবাদ করা।

---

## 4. সার্ভার সাইড আপলোড ও ডেটাবেজ সেভ করার নিয়ম / Backend API Specs

এডিটর থেকে ফাইল বা ইমেজ আপলোড করার সময় আপনার ব্যাকএন্ড এপিআই যে ফরম্যাটে রিকোয়েস্ট ও রেসপন্স আশা করে:

### ইমেজ আপলোড এপিআই স্পেসিফিকেশন (`POST /api/upload`)
- **রিকোয়েস্ট টাইপ**: `multipart/form-data`
- **ফিল্ডের নাম**: `file` (বা `image` বা `upload`)

#### সফল রেসপন্স (JSON Format):
```json
{
  "status": "success",
  "url": "https://yourdomain.com/uploads/photo-abc123.jpg",
  "name": "photo.jpg",
  "size": 102450
}
```

#### ব্যর্থ রেসপন্স (Error):
```json
{
  "status": "error",
  "message": "File exceeds the 10MB limit."
}
```

#### সাধারণ PHP ব্যাকএন্ড হ্যান্ডলারের কোড (`upload.php`):
```php
<?php
header('Content-Type: application/json');

if (!isset($_FILES['file'])) {
    echo json_encode(['status' => 'error', 'message' => 'No file received.']);
    exit;
}

$file = $_FILES['file'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

// অনুমোদিত এক্সটেনশন যাচাই
$allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'pdf'];
if (!in_array($ext, $allowed)) {
    echo json_encode(['status' => 'error', 'message' => 'Disallowed file type.']);
    exit;
}

// ইউনিক নাম তৈরি
$targetName = uniqid('media_', true) . '.' . $ext;
$targetDir = __DIR__ . '/uploads/';

if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
}

if (move_uploaded_file($file['tmp_name'], $targetDir . $targetName)) {
    $fullUrl = 'https://' . $_SERVER['HTTP_HOST'] . '/uploads/' . $targetName;
    echo json_encode([
        'status' => 'success',
        'url' => $fullUrl,
        'name' => $file['name'],
        'size' => $file['size']
    ]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Upload failed.']);
}
```

---

## 5. লাইভ সার্ভার ও cPanel এ ডিপ্লয়মেন্ট গাইড / Live Server & cPanel Deployment

### সম্পূর্ণ শোকেস / ডেমো সাইটটি cPanel এ আপলোড করার নিয়ম:
1. **প্রথমে লোকাল পিসিতে প্রোডাকশন বিল্ড দিন**:
   ```bash
   npm run build
   ```
2. আপনার প্রোজেক্টের `demo/dist/` ফোল্ডারের ভেতরে প্রবেশ করুন:
   - `assets/` ফোল্ডার
   - `index.html` ফাইল
   - `vite.svg`
3. **cPanel File Manager** খুলুন:
   - আপনি যে ডোমেন বা সাবডোমেনে রাখতে চান (যেমন: `public_html/` অথবা `public_html/editor/`) সেখানে ফাইলগুলো আপলোড করে দিন।
4. **`.htaccess` ফাইল তৈরি করুন**:
   - `index.html` ফাইলের পাশাপাশি একটি `.htaccess` ফাইল তৈরি করে নিচের কোডটুকু পেস্ট করুন (যাতে পেজ রিফ্রেশ দিলে ৪MD/404 এরর না আসে):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```
*(সাব-ফোল্ডারে হলে `RewriteBase /` এর জায়গায় `RewriteBase /editor/` এবং `RewriteRule . /editor/index.html [L]` দিন)*।

---

## 6. সাধারণ জিজ্ঞাসা ও সমাধান / FAQ & Troubleshooting

### প্রশ্ন ১: এডিটর থেকে ছবি আপলোড হচ্ছে না, "Upload Failed" দেখাচ্ছে কেন?
**সমাধান:**
1. আপনার সার্ভারের `upload_max_filesize` এবং `post_max_size` PHP সেটিংসে ১০ মেগাবাইট বা তার বেশি আছে কিনা নিশ্চিত করুন।
2. সার্ভারে যে ফোল্ডারে ছবি আপলোড হবে (যেমন: `uploads/`) তার ফাইল পারমিশন `755` বা `775` দিন।
3. যদি ফ্রন্টএন্ড এবং ব্যাকএন্ড আলাদা ডোমেনে থাকে, তবে ব্যাকএন্ডে **CORS Header** (`Access-Control-Allow-Origin: *`) এনাবল করুন।

### প্রশ্ন ২: আমি শুধু সাধারণ টেক্সট এবং বোল্ড/ইটালিক বাটন রাখতে চাই, বাকি বাটন লুকাবো কীভাবে?
**সমাধান:** এডিটর ইনিশিয়ালাইজ করার সময় `toolbar` কনফিগারেশনে শুধু আপনার পছন্দের বাটনগুলো দিন:
```javascript
const editor = UniversalEditor.createEditor({
  element: document.getElementById('my-editor'),
  // শুধুমাত্র এই বাটনগুলো দেখাবে
  toolbar: ['bold', 'italic', 'underline', '|', 'bulletList', 'orderedList']
});
```

### প্রশ্ন ৩: মোবাইল ফোনে কি টুলবার সুন্দর দেখাবে?
**সমাধান:** হ্যাঁ, মোবাইলে স্ক্রিন ছোট হলে টুলবার স্বয়ংক্রিয়ভাবে নিচে একটি সহজে আঙুল দিয়ে ছোঁয়ার মতো 'Mobile Bottom Sheet' আকারে পরিবর্তিত হয়।

### প্রশ্ন ৪: ব্যবহারকারীরা কোনো ক্ষতিকারক জাভাস্ক্রিপ্ট কোড সাবমিট করলে কি আমার ওয়েবসাইট হ্যাক হতে পারে?
**সমাধান:** না। Universal Editor-এ ক্লায়েন্ট এবং সার্ভার উভয় স্থানেই ডাবল-লেয়ার **ContentSanitizer** দেওয়া আছে। ব্যবহারকারী কোনো `<script>`, `onerror=`, বা ক্ষতিকারক কোড দিলে এডিটর তা তাৎক্ষণিকভাবে স্বয়ংক্রিয়ভাবে মুছে ফেলে শুধু নিরাপদ ও বৈধ HTML রিটার্ন করে।

---

## 📞 সাপোর্ট ও যোগাযোগ / Support & Maintenance

যেকোনো সমস্যা বা কাস্টমাইজেশনের প্রয়োজন হলে আপনার প্রোজেক্টের ডেভেলপার বা আর্কিটেকচার টিমের সাথে যোগাযোগ করুন।

> **Universal Rich Text Editor — Engineered for Excellence, Speed, and Reliability.**

import type { FileMap } from "@/lib/types";

/** A small site shaped like real model output. */
export const site: FileMap = {
  "partials/head.html": `<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600&family=Inter+Tight:wght@400;600&display=swap" rel="stylesheet">
<style type="text/tailwindcss">
  @theme {
    --color-brand: #0f766e;
    --font-display: "Fraunces", serif;
  }
</style>
<script defer src="assets/site.js"></script>`,
  "partials/header.html": `<header class="sticky top-0 bg-white" x-data="{ open: false }">
  <a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>
  <nav class="mx-auto flex max-w-6xl items-center justify-between p-4">
    <a href="index.html" class="font-display text-xl aria-[current=page]:text-brand">Bright Smile</a>
    <a href="services.html" class="aria-[current=page]:text-brand">Services</a>
    <a href="contact.html" class="aria-[current=page]:text-brand">Contact</a>
    <button @click="open = !open" aria-label="Menu"><i data-lucide="menu" class="size-5"></i></button>
  </nav>
</header>`,
  "partials/footer.html": `<footer class="bg-brand text-white p-8"><p>Call us: [[Phone number]]</p></footer>`,
  "index.html": `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Family Dentist in Columbus, OH | Bright Smile Dental</title>
  <meta name="description" content="Gentle family dentistry in Columbus, Ohio. Cleanings, implants, Invisalign and same-week emergency visits. Request your appointment online today.">
  <!-- @include partials/head.html -->
</head>
<body class="font-sans">
  <!-- @include partials/header.html -->
  <main id="main">
    <h1 class="font-display text-5xl px-[13px]">Gentle care for the whole family</h1>
    <p class="text-lg">We make dental visits easy.</p>
    <img data-ai-image="a bright modern dental office reception with plants" data-aspect="16:9" alt="Reception" width="1600" height="900">
    <a href="contact.html#form" class="bg-brand text-white">Book now</a>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Dentist","name":"Bright Smile Dental"}</script>
  </main>
  <!-- @include partials/footer.html -->
</body>
</html>`,
  "services.html": `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dental Services in Columbus | Bright Smile Dental</title>
  <meta name="description" content="Cleanings, whitening, implants and Invisalign from a caring Columbus dental team. See every service we offer and request a visit.">
  <!-- @include partials/head.html -->
</head>
<body>
  <!-- @include partials/header.html -->
  <main id="main"><h1>Services</h1><p>Cleanings and more.</p></main>
  <!-- @include partials/footer.html -->
</body>
</html>`,
  "contact.html": `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Contact Bright Smile Dental in Columbus, OH</title>
  <meta name="description" content="Request an appointment with Bright Smile Dental in Columbus, OH. Tell us a good time and we will call you back within one business day.">
  <!-- @include partials/head.html -->
</head>
<body>
  <!-- @include partials/header.html -->
  <main id="main">
    <h1>Contact us</h1>
    <form data-sl-form="Appointment request" id="form">
      <label>Name <input name="name" required></label>
      <button type="submit" class="hover:bg-brand/80">Send</button>
      <div data-sl-success hidden>Thanks!</div>
    </form>
  </main>
  <!-- @include partials/footer.html -->
</body>
</html>`,
  "assets/site.js": `document.querySelectorAll('[data-year]').forEach((el) => el.classList.add('opacity-90'));`,
};

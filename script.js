// ==================== TYPING EFFECT ====================

const words = [
    "Building scalable web app",
    "Java • node.js • Python",
    "300+ LeetCode Problems Solved",
    "CodeChef 2★ Developer",
    "10+ Projects Built"
];

let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;

const typingText = document.getElementById("typing-text");

function typeEffect() {

    const currentWord = words[wordIndex];

    if (!isDeleting) {

        typingText.textContent =
            currentWord.substring(0, charIndex + 1);

        charIndex++;

        if (charIndex === currentWord.length) {

            isDeleting = true;

            setTimeout(typeEffect, 1500);

            return;
        }

    } else {

        typingText.textContent =
            currentWord.substring(0, charIndex - 1);

        charIndex--;

        if (charIndex === 0) {

            isDeleting = false;

            wordIndex++;

            if (wordIndex >= words.length) {
                wordIndex = 0;
            }
        }
    }

    setTimeout(typeEffect, isDeleting ? 40 : 80);
}

typeEffect();




// ==================== SCROLL ANIMATION ====================

gsap.registerPlugin(ScrollTrigger);

let tl = gsap.timeline({

    scrollTrigger: {
        trigger: "#about",
        start: "top 80%",
        end: "top 10%",
        scrub: 1.5
    }

});

tl.to(".profile-img", {

    x: window.innerWidth * 0.42,
    scale: 1.05,
    ease: "none"

}, 0);

tl.to(".blur-layer", {

    backdropFilter: "blur(12px)",
    background: "rgba(0, 3, 9, 0.6)",
    ease: "none"

}, 0);

tl.to("#about", {

    opacity: 1,
    pointerEvents: "auto",
    ease: "none"

}, 0);

tl.to(".about-content", {

    x: 0,
    ease: "none"

}, 0);

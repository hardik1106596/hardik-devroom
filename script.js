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
        typingText.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
        if (charIndex === currentWord.length) {
            isDeleting = true;
            setTimeout(typeEffect, 1500);
            return;
        }
    } else {
        typingText.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
            isDeleting = false;
            wordIndex++;
            if (wordIndex >= words.length) wordIndex = 0;
        }
    }
    setTimeout(typeEffect, isDeleting ? 40 : 80);
}

typeEffect();




// ==================== SCROLL ANIMATION ====================

gsap.registerPlugin(ScrollTrigger);

const aboutSection = document.querySelector('#about');
const aboutContent = document.querySelector('.about-content');
const aboutImg     = document.querySelector('.about-img');

// Image is visible immediately when about enters (no delay)
// About section pins, image travels left → right while scrolling
ScrollTrigger.create({
    trigger: '#about',
    start: 'top top',   // pins as soon as about hits viewport top
    end: '+=50%',       // only 80% of viewport scroll to complete — fast & snappy
    pin: true,
    pinSpacing: false,
    scrub: 0.6,         // low scrub = tight follow, no lag

    onUpdate(self) {
        const t = self.progress;  // 0 → 1
        const W = window.innerWidth;

        // Image travels: left=0 → left=72vw
        aboutImg.style.left = (W * 0.67 * (t )) + 'px';

        // Clears fully by 55% scroll — early clear
        const tClear = Math.min(t / 0.55, 1);
        const blur   = 12 * (1 - tClear);
        const bright = 0.25 + tClear * 0.87;
        aboutImg.style.filter = `brightness(${bright}) contrast(1.05) blur(${blur}px)`;

        // Content: slides in within first 25% of scroll, then stays
        const cT = Math.min(t / 0.01, 1);
        aboutContent.style.opacity   = cT;
        aboutContent.style.transform = `translateX(${-50 * (1 - cT)}px)`;
    },

    onLeaveBack() {
        // Scrolled back to hero — reset
        aboutImg.style.left   = '0px';
        aboutImg.style.filter = 'brightness(0.25) contrast(1.05) blur(14px)';
        aboutContent.style.opacity   = '0';
        aboutContent.style.transform = 'translateX(-50px)';
    }
});

gsap.registerPlugin(ScrollTrigger);

let tl = gsap.timeline({

    scrollTrigger:{
        trigger:"#skills",
        start:"top top",
        end:"+=300",
        scrub:true,
        pin:true
    }
});

tl.to(".left-door",{

    rotateY:-95

},0);

tl.to(".right-door",{

    rotateY:95

},0);

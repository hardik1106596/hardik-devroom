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



///zoom baba zoom

// gsap.registerPlugin(ScrollTrigger);

// gsap.to("#profileFrame", {

//     scale: 0,

//     scrollTrigger: {
//         trigger: "#about",
//         start: "top 20%",
//         end: "top 90%",
//         scrub: true,
//         markers: true
//     }
// });

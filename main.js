const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

const canMove = () => !reduceMotion.matches;

const splitWords = (el) => {
    let index = 0;

    const walk = (node) => {
        [...node.childNodes].forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
                const frag = document.createDocumentFragment();

                child.textContent.split(/(\s+)/).forEach((part) => {
                    if (!part) {
                        return;
                    }

                    if (/^\s+$/.test(part)) {
                        frag.append(" ");
                        return;
                    }

                    const outer = document.createElement("span");
                    const inner = document.createElement("span");
                    outer.className = "w";
                    outer.style.setProperty("--i", index++);
                    inner.textContent = part;
                    outer.append(inner);
                    frag.append(outer);
                });

                child.replaceWith(frag);
                return;
            }

            if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR" && !child.classList.contains("caret")) {
                walk(child);
            }
        });
    };

    walk(el);
};

const setupNav = () => {
    const nav = document.querySelector(".nav");
    const links = document.querySelector(".nav-links");
    const pill = links.querySelector(".pill");

    new IntersectionObserver(([entry]) => nav.classList.toggle("scrolled", !entry.isIntersecting)).observe(document.getElementById("top-sentinel"));

    if (!finePointer) {
        return;
    }

    links.querySelectorAll("a:not(.btn)").forEach((link) => {
        link.addEventListener("pointerenter", () => {
            pill.style.setProperty("--x", link.offsetLeft + "px");
            pill.style.setProperty("--w", link.offsetWidth + "px");
            pill.classList.add("show");
        });
    });
    links.addEventListener("pointerleave", () => pill.classList.remove("show"));
};

const setPointerOrigin = (btn, event) => {
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty("--bx", event.clientX - rect.left + "px");
    btn.style.setProperty("--by", event.clientY - rect.top + "px");
};

const setupButtons = () => {
    document.querySelectorAll(".btn").forEach((btn) => {
        const roll = btn.querySelector(".roll");
        const inner = document.createElement("span");
        inner.className = "roll-in";
        inner.dataset.t = roll.textContent;
        inner.textContent = roll.textContent;
        roll.replaceChildren(inner);

        if (!finePointer) {
            return;
        }

        btn.addEventListener("pointerenter", (event) => setPointerOrigin(btn, event));
        btn.addEventListener("pointermove", (event) => {
            if (!canMove()) {
                return;
            }

            const rect = btn.getBoundingClientRect();
            btn.style.setProperty("--tx", (event.clientX - rect.left - rect.width / 2) * 0.2 + "px");
            btn.style.setProperty("--ty", (event.clientY - rect.top - rect.height / 2) * 0.3 + "px");
        });
        btn.addEventListener("pointerleave", (event) => {
            setPointerOrigin(btn, event);
            btn.style.setProperty("--tx", "0px");
            btn.style.setProperty("--ty", "0px");
        });
    });
};

// 목표값을 매 프레임 조금씩 따라가 커서를 놓아도 부드럽게 제자리로 돌아온다.
const attachTilt = (target, area, maxDeg) => {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frame = 0;

    const step = () => {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;
        target.style.setProperty("--rx", -currentY * maxDeg + "deg");
        target.style.setProperty("--ry", currentX * maxDeg + "deg");
        target.style.setProperty("--px", currentX);
        target.style.setProperty("--py", currentY);

        const settled = Math.abs(targetX - currentX) + Math.abs(targetY - currentY) < 0.002;
        frame = settled ? 0 : requestAnimationFrame(step);
    };

    const start = () => {
        if (!frame) {
            frame = requestAnimationFrame(step);
        }
    };

    area.addEventListener("pointermove", (event) => {
        if (!canMove()) {
            return;
        }

        const rect = area.getBoundingClientRect();
        targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        start();
    });
    area.addEventListener("pointerleave", () => {
        targetX = 0;
        targetY = 0;
        start();
    });
};

const setupSpotlight = () => {
    document.querySelectorAll(".cell, .final-box").forEach((el) => {
        el.addEventListener("pointermove", (event) => {
            const rect = el.getBoundingClientRect();
            el.style.setProperty("--mx", event.clientX - rect.left + "px");
            el.style.setProperty("--my", event.clientY - rect.top + "px");
        });
    });
};

const formatNumber = (el, value) => {
    el.textContent = value.toFixed(Number(el.dataset.dec));
};

const countUp = (el) => {
    const from = Number(el.dataset.from);
    const to = Number(el.dataset.to);
    const start = performance.now();

    const tick = (now) => {
        const progress = Math.min((now - start) / 1600, 1);
        formatNumber(el, from + (to - from) * (1 - Math.pow(1 - progress, 4)));

        if (progress < 1) {
            requestAnimationFrame(tick);
        }
    };

    requestAnimationFrame(tick);
};

const typeOut = (el) => {
    const text = el.textContent;
    let count = 0;

    el.style.minHeight = el.offsetHeight + "px";
    el.textContent = "";
    el.classList.add("typing");

    const timer = setInterval(() => {
        el.textContent = text.slice(0, ++count);

        if (count >= text.length) {
            clearInterval(timer);
            setTimeout(() => el.classList.remove("typing"), 1200);
        }
    }, 34);
};

const setupReveal = () => {
    const nums = document.querySelectorAll(".num");
    const typer = document.querySelector(".typer");

    nums.forEach((num) => formatNumber(num, Number(num.dataset.from)));

    // 한 번에 함께 들어온 요소끼리 순서대로 시차를 둔다.
    const observer = new IntersectionObserver(
        (entries) => {
            let order = 0;

            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }

                const el = entry.target;
                el.style.transitionDelay = order++ * 90 + "ms";
                el.classList.add("in");
                observer.unobserve(el);

                el.querySelectorAll(".num").forEach((num) => setTimeout(() => countUp(num), 300));

                if (el.contains(typer)) {
                    setTimeout(() => typeOut(typer), 500);
                }
            });
        },
        { threshold: 0.25 }
    );

    document.querySelectorAll(".reveal, .split-mask").forEach((el) => observer.observe(el));
};

const setupSteps = () => {
    const steps = [...document.querySelectorAll(".step")];
    const images = [...document.querySelectorAll(".stage img")];
    const box = document.querySelector(".steps");
    let activeIndex = 0;

    // 진행선은 활성 단계의 아래 끝(본문 여백 40px 제외)까지 채운다.
    const setStage = (index) => {
        const active = steps[index];
        activeIndex = index;
        steps.forEach((step, i) => step.classList.toggle("active", i === index));
        images.forEach((img, i) => img.classList.toggle("active", i === index));
        box.style.setProperty("--rail", active.offsetTop + active.offsetHeight - 80 + "px");
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setStage(Number(entry.target.dataset.stage));
                }
            });
        },
        { rootMargin: "-45% 0px -45% 0px" }
    );

    setStage(0);
    steps.forEach((step) => observer.observe(step));
    addEventListener("resize", () => setStage(activeIndex));
};

document.querySelectorAll("[data-split]").forEach(splitWords);
setupNav();
setupButtons();
setupSpotlight();
setupReveal();
setupSteps();

if (finePointer) {
    attachTilt(document.querySelector(".hero-stage"), document.getElementById("hero"), 7);
    attachTilt(document.querySelector(".stage"), document.querySelector(".stage"), 5);
}
